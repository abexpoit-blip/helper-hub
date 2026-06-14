import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const addProxy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        label: z.string().max(80).optional(),
        ip: z.string().min(1).max(120),
        port: z.number().int().min(1).max(65535),
        username: z.string().max(120).optional(),
        password: z.string().max(500).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { encryptString } = await import("./crypto.server");
    const pw = data.password ? encryptString(data.password) : { ciphertext: null, iv: null };
    const { error, data: row } = await context.supabase
      .from("proxies")
      .insert({
        user_id: context.userId,
        label: data.label ?? null,
        ip: data.ip,
        port: data.port,
        username: data.username ?? null,
        password_ciphertext: pw.ciphertext,
        password_iv: pw.iv,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listProxies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("proxies")
      .select("id,label,ip,port,username,is_active,last_check_at,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { proxies: data ?? [] };
  });

export const deleteProxy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("proxies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
