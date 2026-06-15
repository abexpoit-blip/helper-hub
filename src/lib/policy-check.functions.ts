import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  content: z.string().trim().min(3).max(8000),
  url: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PolicyVerdict = "safe" | "risky" | "violation";

export type PolicyResult = {
  verdict: PolicyVerdict;
  score: number; // 0-100 risk score
  summary: string;
  violations: { category: string; severity: "low" | "medium" | "high"; reason: string }[];
  suggestions: string[];
};

export const checkFacebookPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<PolicyResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText, Output } = await import("ai");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are a Facebook Community Standards & Ad Policy expert. Analyze this content (intended for posting on Facebook) and decide if Facebook is likely to remove the post, restrict reach, or ban the account.

CONTENT TO POST:
"""
${data.content}
"""
${data.url ? `\nLINK INCLUDED: ${data.url}` : ""}

Check against these Facebook policies:
- Spam / repetitive / engagement bait / clickbait
- Misleading / fake news / scam
- Copyright / trademark / impersonation
- Hate speech / harassment / bullying
- Adult / sexual / nudity
- Violence / dangerous organizations
- Restricted goods (drugs, weapons, alcohol, tobacco)
- Cloaking / suspicious link / phishing / shortener abuse
- Health misinformation / medical claims
- Excessive promotion / low-quality content
- Personal data / privacy violations

Return strict JSON only.`;

    const { output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      output: Output.object({
        schema: z.object({
          verdict: z.enum(["safe", "risky", "violation"]),
          score: z.number().min(0).max(100),
          summary: z.string().max(400),
          violations: z
            .array(
              z.object({
                category: z.string().max(60),
                severity: z.enum(["low", "medium", "high"]),
                reason: z.string().max(300),
              })
            )
            .max(8),
          suggestions: z.array(z.string().max(280)).max(6),
        }),
      }),
      prompt,
    });

    return output as PolicyResult;
  });
