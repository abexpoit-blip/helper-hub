import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const prev = new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString();

    const [{ data: events }, { data: prevEvents }, { count: totalAccounts }, { count: activeAccounts }] =
      await Promise.all([
        context.supabase
          .from("metric_events")
          .select("type,value,created_at")
          .gte("created_at", since),
        context.supabase
          .from("metric_events")
          .select("type,value")
          .gte("created_at", prev)
          .lt("created_at", since),
        context.supabase.from("fb_accounts").select("id", { count: "exact", head: true }),
        context.supabase
          .from("fb_accounts")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
      ]);

    const sum = (rows: { type: string; value: number }[] | null, type: string) =>
      (rows ?? []).filter((r) => r.type === type).reduce((a, b) => a + b.value, 0);

    const cur = {
      posts: sum(events ?? [], "post"),
      videos: sum(events ?? [], "video_rendered"),
      clicks: sum(events ?? [], "click"),
      success: sum(events ?? [], "success"),
      fail: sum(events ?? [], "fail"),
    };
    const pre = {
      posts: sum(prevEvents ?? [], "post"),
      videos: sum(prevEvents ?? [], "video_rendered"),
      clicks: sum(prevEvents ?? [], "click"),
      success: sum(prevEvents ?? [], "success"),
      fail: sum(prevEvents ?? [], "fail"),
    };
    const pct = (a: number, b: number) =>
      b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 1000) / 10;
    const successRate =
      cur.success + cur.fail > 0
        ? Math.round((cur.success / (cur.success + cur.fail)) * 1000) / 10
        : 0;
    const prevSuccessRate =
      pre.success + pre.fail > 0
        ? Math.round((pre.success / (pre.success + pre.fail)) * 1000) / 10
        : 0;

    // build per-day series for chart (last 14 days)
    const days: { date: string; posts: number; clicks: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, posts: 0, clicks: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const e of events ?? []) {
      const k = (e.created_at as string).slice(0, 10);
      const i = idx.get(k);
      if (i == null) continue;
      if (e.type === "post") days[i].posts += e.value;
      if (e.type === "click") days[i].clicks += e.value;
    }

    return {
      stats: {
        totalPosts: cur.posts,
        videosRendered: cur.videos,
        clicks: cur.clicks,
        successRate,
        totalAccounts: totalAccounts ?? 0,
        activeAccounts: activeAccounts ?? 0,
      },
      deltas: {
        posts: pct(cur.posts, pre.posts),
        videos: pct(cur.videos, pre.videos),
        clicks: pct(cur.clicks, pre.clicks),
        successRate: Math.round((successRate - prevSuccessRate) * 10) / 10,
      },
      series: days,
    };
  });

export const recordMetric = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        type: z.enum(["post", "video_rendered", "click", "success", "fail"]),
        value: z.number().int().min(1).max(100000).default(1),
        accountId: z.string().uuid().optional(),
        campaignId: z.string().uuid().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("metric_events").insert({
      user_id: context.userId,
      type: data.type,
      value: data.value,
      account_id: data.accountId ?? null,
      campaign_id: data.campaignId ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
