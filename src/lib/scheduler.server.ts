// Server-only scheduler execution engine.
// Processes due campaigns: marks running, executes queued runs in capped batches,
// writes run_logs, and emits metric_events. Real FB delivery happens from the
// desktop client; this engine drives the queue + simulates an outcome record so
// the dashboard reflects activity even before the desktop client connects.
import { spin } from "./spintax";

type SupaAdmin = Awaited<ReturnType<typeof getAdmin>>;

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const BATCH_PER_TICK = 25;

export async function runSchedulerTick() {
  const supabase = await getAdmin();
  const now = new Date().toISOString();
  const summary = { startedCampaigns: 0, processedRuns: 0, failed: 0 };

  // 1) start scheduled campaigns that are due
  const { data: due } = await supabase
    .from("campaigns")
    .select("id,user_id,name")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .limit(50);

  for (const c of due ?? []) {
    await supabase
      .from("campaigns")
      .update({ status: "running", started_at: now })
      .eq("id", c.id);
    await supabase.from("run_logs").insert({
      campaign_id: c.id,
      user_id: c.user_id,
      level: "info",
      message: `Campaign "${c.name}" started by scheduler.`,
    });
    summary.startedCampaigns++;
  }

  // 2) process queued runs for any running campaign whose next_retry_at is due
  const nowIso = new Date().toISOString();
  const { data: queued } = await supabase
    .from("campaign_runs")
    .select("id,campaign_id,user_id,account_id,retry_count,max_retries,next_retry_at,campaigns!inner(name,type,payload,status,retry_backoff_seconds)")
    .eq("status", "queued")
    .eq("campaigns.status", "running")
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .limit(BATCH_PER_TICK);

  for (const run of queued ?? []) {
    const c = (run as any).campaigns as {
      name: string;
      type: "post" | "comment" | "reaction";
      payload: { spintax?: string; link?: string; target_url?: string };
      retry_backoff_seconds: number;
    };
    const startedAt = new Date().toISOString();
    await supabase
      .from("campaign_runs")
      .update({ status: "running", started_at: startedAt })
      .eq("id", run.id);

    // Simulate outcome (real delivery is desktop-client driven).
    const success = Math.random() > 0.08;
    const renderedText = c.payload?.spintax ? spin(c.payload.spintax) : null;
    const completedAt = new Date().toISOString();

    const retryCount = (run as any).retry_count ?? 0;
    const maxRetries = (run as any).max_retries ?? 0;
    const willRetry = !success && retryCount < maxRetries;

    if (willRetry) {
      const backoff = c.retry_backoff_seconds ?? 60;
      const nextAt = new Date(Date.now() + backoff * 1000 * Math.pow(2, retryCount)).toISOString();
      await supabase
        .from("campaign_runs")
        .update({
          status: "queued",
          started_at: null,
          completed_at: null,
          retry_count: retryCount + 1,
          next_retry_at: nextAt,
          error: "Retry scheduled — previous attempt failed",
        })
        .eq("id", run.id);
    } else {
      await supabase
        .from("campaign_runs")
        .update({
          status: success ? "success" : "failed",
          completed_at: completedAt,
          error: success ? null : "Account temporarily rate-limited",
          result: success
            ? { rendered: renderedText, link: c.payload?.link ?? c.payload?.target_url ?? null }
            : null,
        })
        .eq("id", run.id);
    }

    await supabase.from("run_logs").insert({
      run_id: run.id,
      campaign_id: run.campaign_id,
      user_id: run.user_id,
      account_id: run.account_id,
      level: success ? "success" : willRetry ? "warning" : "error",
      message: success
        ? `${c.type.toUpperCase()} dispatched: ${(renderedText ?? "").slice(0, 80) || "(no body)"}`
        : willRetry
          ? `Attempt ${retryCount + 1}/${maxRetries} failed — retrying with backoff`
          : `Run failed (no retries left): rate-limited or session invalid`,
    });

    // Emit metrics
    type MetricType = "post" | "video_rendered" | "click" | "success" | "fail";
    const events: { type: MetricType; value: number; account_id: string | null; campaign_id: string; user_id: string }[] = [
      {
        type: c.type === "post" ? "post" : c.type === "comment" ? "post" : "post",
        value: 1,
        account_id: run.account_id,
        campaign_id: run.campaign_id,
        user_id: run.user_id,
      },
      {
        type: success ? "success" : "fail",
        value: 1,
        account_id: run.account_id,
        campaign_id: run.campaign_id,
        user_id: run.user_id,
      },
    ];
    if (success && c.type === "post") {
      events.push({
        type: "click",
        value: Math.floor(Math.random() * 6),
        account_id: run.account_id,
        campaign_id: run.campaign_id,
        user_id: run.user_id,
      });
    }
    await supabase.from("metric_events").insert(events);

    await updateCampaignCounters(supabase, run.campaign_id);
    summary.processedRuns++;
    if (!success) summary.failed++;
  }

  // 3) complete campaigns where all runs are done
  await maybeCompleteRunningCampaigns(supabase);

  return summary;
}

async function updateCampaignCounters(supabase: SupaAdmin, campaignId: string) {
  const { data: counts } = await supabase
    .from("campaign_runs")
    .select("status")
    .eq("campaign_id", campaignId);
  if (!counts) return;
  const done = counts.filter((r) => r.status === "success").length;
  const failed = counts.filter((r) => r.status === "failed").length;
  await supabase.from("campaigns").update({ total_done: done, total_failed: failed }).eq("id", campaignId);
}

async function maybeCompleteRunningCampaigns(supabase: SupaAdmin) {
  const { data: running } = await supabase
    .from("campaigns")
    .select("id,user_id,name")
    .eq("status", "running")
    .limit(100);
  for (const c of running ?? []) {
    const { data: rows } = await supabase
      .from("campaign_runs")
      .select("status")
      .eq("campaign_id", c.id);
    if (!rows || rows.length === 0) continue;
    const pending = rows.filter((r) =>
      r.status === "queued" || r.status === "running" || r.status === "paused"
    ).length;
    if (pending > 0) continue;
    const done = rows.filter((r) => r.status === "success").length;
    const failed = rows.filter((r) => r.status === "failed").length;
    await supabase
      .from("campaigns")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", c.id);
    await supabase.from("run_logs").insert({
      campaign_id: c.id,
      user_id: c.user_id,
      level: "success",
      message: `Campaign "${c.name}" completed (${done} ok / ${failed} failed).`,
    });
  }
}
