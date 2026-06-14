import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/scheduler-tick")({
  server: {
    handlers: {
      POST: async () => {
        const { runSchedulerTick } = await import("@/lib/scheduler.server");
        try {
          const summary = await runSchedulerTick();
          return Response.json({ ok: true, ...summary });
        } catch (e) {
          console.error("[scheduler-tick]", e);
          return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
        }
      },
      GET: async () => Response.json({ ok: true, message: "Use POST" }),
    },
  },
});
