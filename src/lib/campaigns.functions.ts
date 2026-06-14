import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const campaignType = z.enum(["post", "comment", "reaction"]);
const campaignStatus = z.enum(["draft", "scheduled", "running", "paused", "completed", "failed", "cancelled"]);
const runControlAction = z.enum(["pause", "resume", "cancel", "retry"]);

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        name: z.string().min(1).max(120),
        type: campaignType,
        spintax: z.string().max(4000).optional(),
        link: z.string().max(2000).optional(),
        target_url: z.string().max(2000).optional(),
        emoji_set: z.string().max(500).optional(),
        scheduled_at: z.string().datetime().optional(),
        posts_per_hour: z.number().int().min(1).max(600),
        randomize_seconds: z.number().int().min(0).max(3600),
        max_retries: z.number().int().min(0).max(10).default(2),
        retry_backoff_seconds: z.number().int().min(5).max(3600).default(60),
        account_ids: z.array(z.string().uuid()).min(1).max(500),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const status = data.scheduled_at ? "scheduled" : "draft";
    const { data: c, error } = await context.supabase
      .from("campaigns")
      .insert({
        user_id: context.userId,
        name: data.name,
        type: data.type,
        status,
        scheduled_at: data.scheduled_at ?? null,
        posts_per_hour: data.posts_per_hour,
        randomize_seconds: data.randomize_seconds,
        max_retries: data.max_retries,
        retry_backoff_seconds: data.retry_backoff_seconds,
        total_targets: data.account_ids.length,
        payload: {
          spintax: data.spintax ?? null,
          link: data.link ?? null,
          target_url: data.target_url ?? null,
          emoji_set: data.emoji_set ?? null,
          account_ids: data.account_ids,
        },
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const runs = data.account_ids.map((aid) => ({
      campaign_id: c.id,
      user_id: context.userId,
      account_id: aid,
      status: "queued" as const,
      max_retries: data.max_retries,
    }));
    const { error: rerr } = await context.supabase.from("campaign_runs").insert(runs);
    if (rerr) throw new Error(rerr.message);

    await context.supabase.from("run_logs").insert({
      campaign_id: c.id,
      user_id: context.userId,
      level: "info",
      message: `Campaign "${data.name}" queued with ${data.account_ids.length} accounts (retries: ${data.max_retries}).`,
    });

    return { id: c.id };
  });

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("campaigns")
      .select(
        "id,name,type,status,scheduled_at,started_at,completed_at,posts_per_hour,total_targets,total_done,total_failed,max_retries,retry_backoff_seconds,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { campaigns: data ?? [] };
  });

export const updateCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: campaignStatus }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const nowIso = new Date().toISOString();
    const patch: { status: typeof data.status; started_at?: string; completed_at?: string } = {
      status: data.status,
    };
    if (data.status === "running") patch.started_at = nowIso;
    if (data.status === "completed" || data.status === "cancelled" || data.status === "failed") {
      patch.completed_at = nowIso;
    }
    const { error } = await context.supabase
      .from("campaigns")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    // Cascade onto runs
    if (data.status === "paused") {
      await context.supabase
        .from("campaign_runs")
        .update({ status: "paused" })
        .eq("campaign_id", data.id)
        .in("status", ["queued"]);
    } else if (data.status === "running") {
      await context.supabase
        .from("campaign_runs")
        .update({ status: "queued" })
        .eq("campaign_id", data.id)
        .eq("status", "paused");
    } else if (data.status === "cancelled") {
      await context.supabase
        .from("campaign_runs")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("campaign_id", data.id)
        .in("status", ["queued", "paused", "running"]);
    }

    await context.supabase.from("run_logs").insert({
      campaign_id: data.id,
      user_id: context.userId,
      level: data.status === "cancelled" ? "warning" : "info",
      message: `Campaign manually set to ${data.status.toUpperCase()}.`,
    });
    return { ok: true };
  });

export const setCampaignRetryPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        max_retries: z.number().int().min(0).max(10),
        retry_backoff_seconds: z.number().int().min(5).max(3600),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("campaigns")
      .update({
        max_retries: data.max_retries,
        retry_backoff_seconds: data.retry_backoff_seconds,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    // Push new ceiling onto remaining runs
    await context.supabase
      .from("campaign_runs")
      .update({ max_retries: data.max_retries })
      .eq("campaign_id", data.id)
      .in("status", ["queued", "paused", "failed"]);

    await context.supabase.from("run_logs").insert({
      campaign_id: data.id,
      user_id: context.userId,
      level: "info",
      message: `Retry policy updated: max=${data.max_retries}, backoff=${data.retry_backoff_seconds}s`,
    });
    return { ok: true };
  });

export const controlRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ runId: z.string().uuid(), action: runControlAction }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: run, error: gErr } = await context.supabase
      .from("campaign_runs")
      .select("id,campaign_id,status,retry_count,max_retries,account_id")
      .eq("id", data.runId)
      .eq("user_id", context.userId)
      .single();
    if (gErr || !run) throw new Error("Run not found");

    let next: "queued" | "paused" | "cancelled" = run.status as never;
    const patch: {
      status?: "queued" | "paused" | "cancelled";
      completed_at?: string | null;
      started_at?: string | null;
      error?: string | null;
      retry_count?: number;
      max_retries?: number;
    } = {};
    switch (data.action) {
      case "pause":
        if (!["queued", "running"].includes(run.status)) throw new Error("Run is not pausable");
        next = "paused";
        break;
      case "resume":
        if (run.status !== "paused") throw new Error("Run is not paused");
        next = "queued";
        break;
      case "cancel":
        if (["success", "cancelled"].includes(run.status)) throw new Error("Already finished");
        next = "cancelled";
        patch.completed_at = new Date().toISOString();
        break;
      case "retry": {
        if (!["failed", "cancelled"].includes(run.status)) throw new Error("Only failed/cancelled runs can be retried");
        next = "queued";
        patch.error = null;
        patch.started_at = null;
        patch.completed_at = null;
        const nextRetry = (run.retry_count ?? 0) + 1;
        patch.retry_count = nextRetry;
        if ((run.max_retries ?? 0) < nextRetry) patch.max_retries = nextRetry;
        break;
      }
    }
    patch.status = next;
    const { error } = await context.supabase
      .from("campaign_runs")
      .update(patch)
      .eq("id", data.runId);
    if (error) throw new Error(error.message);

    await context.supabase.from("run_logs").insert({
      run_id: data.runId,
      campaign_id: run.campaign_id,
      account_id: run.account_id,
      user_id: context.userId,
      level: data.action === "cancel" ? "warning" : "info",
      message: `Run manually ${data.action.toUpperCase()}D → ${next}`,
    });
    return { ok: true };
  });

export const listRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ campaignId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: runs, error } = await context.supabase
      .from("campaign_runs")
      .select("id,status,started_at,completed_at,error,account_id,retry_count,max_retries,next_retry_at,fb_accounts(label)")
      .eq("campaign_id", data.campaignId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { runs: runs ?? [] };
  });

export const listLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ campaignId: z.string().uuid().optional(), limit: z.number().int().min(1).max(500).default(100) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("run_logs")
      .select("id,level,message,meta,created_at,account_id,campaign_id,fb_accounts(label)")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.campaignId) q = q.eq("campaign_id", data.campaignId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { logs: rows ?? [] };
  });
