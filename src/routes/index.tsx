import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FB Viral Traffic Engine Pro" },
      { name: "description", content: "Premium glassmorphic command center for automating Facebook viral traffic campaigns." },
      { property: "og:title", content: "FB Viral Traffic Engine Pro" },
      { property: "og:description", content: "Premium glassmorphic command center for automating Facebook viral traffic campaigns." },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/app" : "/auth" });
  },
  component: () => null,
});
