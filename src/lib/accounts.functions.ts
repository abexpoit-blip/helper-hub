import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const accountStatus = z.enum(["active", "flagged", "disconnected"]);

const importInput = z.object({
  accounts: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        region: z.string().max(60).optional(),
        user_agent: z.string().max(500).optional(),
        cookies: z.string().max(50_000).optional(),
        token: z.string().max(8_000).optional(),
        uid: z.string().max(120).optional(),
        password: z.string().max(500).optional(),
        imax_profile_id: z.string().max(120).optional(),
        proxy_id: z.string().uuid().optional().nullable(),
      })
    )
    .min(1)
    .max(2000),
});

export const importAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => importInput.parse(d))
  .handler(async ({ data, context }) => {
    const { encryptString } = await import("./crypto.server");
    const rows = data.accounts.map((a) => {
      const c = a.cookies ? encryptString(a.cookies) : { ciphertext: null, iv: null };
      const t = a.token ? encryptString(a.token) : { ciphertext: null, iv: null };
      const p = a.password ? encryptString(a.password) : { ciphertext: null, iv: null };
      return {
        user_id: context.userId,
        label: a.label,
        region: a.region ?? null,
        user_agent: a.user_agent ?? null,
        cookies_ciphertext: c.ciphertext,
        cookies_iv: c.iv,
        token_ciphertext: t.ciphertext,
        token_iv: t.iv,
        uid: a.uid ?? null,
        password_ciphertext: p.ciphertext,
        password_iv: p.iv,
        imax_profile_id: a.imax_profile_id ?? null,
        proxy_id: a.proxy_id ?? null,
      };
    });
    const { error, data: inserted } = await context.supabase
      .from("fb_accounts")
      .insert(rows)
      .select("id");
    if (error) throw new Error(error.message);
    return { inserted: inserted?.length ?? 0 };
  });

export const planAccountLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("fb_accounts")
      .select("id,label,uid,cookies_ciphertext,password_ciphertext,last_login_method")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error(error?.message || "Account not found");
    const hasCookies = !!row.cookies_ciphertext;
    const hasPass = !!(row.uid && row.password_ciphertext);
    const strategy: "cookies" | "uid_password" | "none" =
      hasCookies ? "cookies" : hasPass ? "uid_password" : "none";
    const fallback: "uid_password" | null = hasCookies && hasPass ? "uid_password" : null;
    return { strategy, fallback, label: row.label, uid: row.uid };
  });

export const recordLoginAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      method: z.enum(["cookies", "uid_password"]),
      success: z.boolean(),
      newCookies: z.string().max(50_000).optional(),
      error: z.string().max(500).optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {
      last_login_method: data.method,
      last_login_at: new Date().toISOString(),
      status: data.success ? "active" : "flagged",
      last_error: data.success ? null : (data.error ?? "login failed"),
    };
    if (data.success && data.newCookies) {
      const { encryptString } = await import("./crypto.server");
      const c = encryptString(data.newCookies);
      patch.cookies_ciphertext = c.ciphertext;
      patch.cookies_iv = c.iv;
    }
    const { error } = await context.supabase.from("fb_accounts").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("fb_accounts")
      .select(
        "id,label,region,status,imax_profile_id,proxy_id,last_sync_at,last_error,user_agent,created_at,proxies(ip,port,label)"
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { accounts: data ?? [] };
  });

export const updateAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: accountStatus }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("fb_accounts")
      .update({ status: data.status, last_sync_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fb_accounts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const attachProxy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ accountIds: z.array(z.string().uuid()).min(1).max(500), proxyId: z.string().uuid().nullable() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("fb_accounts")
      .update({ proxy_id: data.proxyId })
      .in("id", data.accountIds);
    if (error) throw new Error(error.message);
    return { updated: data.accountIds.length };
  });

export const mapImaxProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ accountId: z.string().uuid(), profileId: z.string().min(1).max(120) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("fb_accounts")
      .update({ imax_profile_id: data.profileId })
      .eq("id", data.accountId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
