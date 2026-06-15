import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  topic: z.string().trim().min(3).max(500),
  niche: z.string().trim().max(80).optional().or(z.literal("")),
  language: z.enum(["english", "bangla", "hindi", "mixed"]).default("english"),
  audience: z.enum(["global", "bd", "in", "us", "uk"]).default("global"),
});

export type ViralAnalysis = {
  viralScore: number; // 0-100
  scoreReason: string;
  hooks: string[]; // first 3-second hooks
  captions: string[]; // 3 caption variants
  hashtags: string[];
  thumbnailText: string[]; // bold overlay text suggestions
  bestPostingTimes: string[]; // e.g. "Fri 8-10 PM BDT"
  algorithmTips: string[];
  ctaIdeas: string[];
};

export const analyzeViralPotential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<ViralAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText, Output } = await import("ai");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are a Facebook & Reels viral growth strategist. The user wants to make a viral Facebook video.

VIDEO TOPIC / DESCRIPTION:
"""
${data.topic}
"""
NICHE: ${data.niche || "general"}
LANGUAGE: ${data.language}
TARGET AUDIENCE: ${data.audience}

Generate a complete viral package. Be aggressive, scroll-stopping, emotional. Hooks must trigger curiosity, shock, or relatability in the first 3 seconds. Captions short & punchy. Hashtags should mix high-volume (#viral #reels #fyp) and niche-specific. Posting times in BDT if audience is bd, otherwise local time. Avoid anything that would violate Facebook policy.

Return strict JSON.`;

    const { output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      output: Output.object({
        schema: z.object({
          viralScore: z.number().min(0).max(100),
          scoreReason: z.string().max(300),
          hooks: z.array(z.string().max(120)).min(3).max(6),
          captions: z.array(z.string().max(280)).min(2).max(4),
          hashtags: z.array(z.string().max(40)).min(8).max(20),
          thumbnailText: z.array(z.string().max(40)).min(2).max(4),
          bestPostingTimes: z.array(z.string().max(60)).min(2).max(4),
          algorithmTips: z.array(z.string().max(200)).min(3).max(6),
          ctaIdeas: z.array(z.string().max(120)).min(2).max(4),
        }),
      }),
      prompt,
    });

    return output as ViralAnalysis;
  });
