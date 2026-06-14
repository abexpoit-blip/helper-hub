import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const footprintSchema = z.object({
  canvas: z.boolean(),
  webgl: z.boolean(),
  audio: z.boolean(),
  timezone: z.boolean(),
  user_agent: z.boolean(),
});

export const saveImaxConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        api_endpoint: z.string().url().max(300),
        api_token: z.string().max(2000).optional(),
        sync_interval_seconds: z.number().int().min(5).max(3600),
        max_concurrent_profiles: z.number().int().min(1).max(500),
        footprint: footprintSchema,
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { encryptString } = await import("./crypto.server");
    const t = data.api_token ? encryptString(data.api_token) : { ciphertext: null, iv: null };
    const { error } = await context.supabase.from("imax_config").upsert({
      user_id: context.userId,
      api_endpoint: data.api_endpoint,
      api_token_ciphertext: t.ciphertext,
      api_token_iv: t.iv,
      sync_interval_seconds: data.sync_interval_seconds,
      max_concurrent_profiles: data.max_concurrent_profiles,
      footprint: data.footprint,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getImaxConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("imax_config")
      .select(
        "api_endpoint,sync_interval_seconds,max_concurrent_profiles,footprint,last_test_at,last_test_ok,last_test_message,api_token_ciphertext"
      )
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      config: data
        ? { ...data, has_token: !!data.api_token_ciphertext, api_token_ciphertext: undefined }
        : null,
    };
  });

export const recordImaxTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ ok: z.boolean(), message: z.string().max(500) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("imax_config")
      .update({
        last_test_at: new Date().toISOString(),
        last_test_ok: data.ok,
        last_test_message: data.message,
      })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
