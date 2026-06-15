import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { checkFacebookPolicy, type PolicyResult } from "@/lib/policy-check.functions";

export function PolicyCheckView() {
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const run = useServerFn(checkFacebookPolicy);
  const mut = useMutation({
    mutationFn: () => run({ data: { content, url } }) as Promise<PolicyResult>,
  });

  const result = mut.data;
  const verdictMeta = result
    ? result.verdict === "safe"
      ? { color: "emerald", Icon: CheckCircle2, label: "Safe to Post" }
      : result.verdict === "risky"
        ? { color: "amber", Icon: AlertTriangle, label: "Risky — Review Suggested" }
        : { color: "rose", Icon: XCircle, label: "Likely to be Removed" }
    : null;

  return (
    <div className="space-y-6">
      <div className="glass-strong relative overflow-hidden rounded-3xl p-7">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/30 blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-amber-300 ring-1 ring-amber-400/30">
            <Sparkles className="h-3 w-3" /> AI-Powered Policy Check
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Facebook <span className="text-neon">Policy Checker</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Post করার আগে AI দিয়ে check করুন — Facebook এ remove বা ban হওয়ার risk আছে কিনা।
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-strong rounded-3xl p-6">
          <h3 className="mb-4 text-lg font-semibold">Your Post Content</h3>
          <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
            Caption / Text
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Paste your Facebook post caption, comment, or message here…"
            className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-muted-foreground focus:ring-fuchsia-400/40"
          />
          <label className="mb-2 mt-4 block text-xs uppercase tracking-widest text-muted-foreground">
            Link (Optional)
          </label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/your-page"
            className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-muted-foreground focus:ring-fuchsia-400/40"
          />
          <button
            onClick={() => mut.mutate()}
            disabled={content.trim().length < 3 || mut.isPending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-40"
          >
            {mut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Checking with AI…
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" /> Check Now
              </>
            )}
          </button>
          {mut.isError && (
            <div className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              {(mut.error as Error)?.message || "Check failed. Try again."}
            </div>
          )}
        </div>

        <div className="glass-strong rounded-3xl p-6">
          <h3 className="mb-4 text-lg font-semibold">Analysis Result</h3>
          {!result && !mut.isPending && (
            <div className="grid h-64 place-items-center text-sm text-muted-foreground">
              Result এখানে দেখাবে। উপরে content দিয়ে "Check Now" press করুন।
            </div>
          )}
          {mut.isPending && (
            <div className="grid h-64 place-items-center">
              <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
            </div>
          )}
          {result && verdictMeta && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-3 rounded-2xl bg-${verdictMeta.color}-400/10 p-4 ring-1 ring-${verdictMeta.color}-400/30`}
              >
                <verdictMeta.Icon className={`h-6 w-6 text-${verdictMeta.color}-300`} />
                <div className="flex-1">
                  <div className={`font-semibold text-${verdictMeta.color}-200`}>{verdictMeta.label}</div>
                  <div className="text-xs text-muted-foreground">Risk score: {result.score}/100</div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">Summary</div>
                <p className="text-sm">{result.summary}</p>
              </div>

              {result.violations.length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                    Policy Issues ({result.violations.length})
                  </div>
                  <div className="space-y-2">
                    {result.violations.map((v, i) => {
                      const sev = v.severity === "high" ? "rose" : v.severity === "medium" ? "amber" : "sky";
                      return (
                        <div key={i} className={`rounded-xl bg-${sev}-400/10 p-3 ring-1 ring-${sev}-400/30`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{v.category}</span>
                            <span className={`rounded-full bg-${sev}-400/20 px-2 py-0.5 text-[10px] uppercase text-${sev}-200`}>
                              {v.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{v.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {result.suggestions.length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                    How to Fix
                  </div>
                  <ul className="space-y-1.5">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2 rounded-xl bg-emerald-400/5 p-2.5 text-xs ring-1 ring-emerald-400/20">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
