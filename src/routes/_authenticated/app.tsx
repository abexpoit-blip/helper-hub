import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, Users, Globe, Link2, Wand2, CalendarClock,
  Plus, Search, Zap, TrendingUp, Activity, PlayCircle, Shield, Cpu,
  Sparkles, RefreshCw, Upload, CheckCircle2, AlertTriangle, XCircle,
  ChevronRight, LogOut, Loader2, Trash2, Wifi, WifiOff, ShieldAlert, FileSpreadsheet,
} from "lucide-react";
import { PolicyCheckView } from "@/components/PolicyCheckView";
import { ViralReshaperView } from "@/components/ViralReshaperView";
import { BulkExcelUpload, type ExcelAccountRow } from "@/components/BulkExcelUpload";
import { PolicyCheckView } from "@/components/PolicyCheckView";
import { ViralReshaperView } from "@/components/ViralReshaperView";
import { supabase } from "@/integrations/supabase/client";
import { listAccounts, importAccounts, updateAccountStatus, deleteAccount, mapImaxProfile, attachProxy } from "@/lib/accounts.functions";
import { listProxies, addProxy, deleteProxy } from "@/lib/proxies.functions";
import { getImaxConfig, saveImaxConfig, recordImaxTest } from "@/lib/imax.functions";
import { createCampaign, listCampaigns, listLogs, listRuns, updateCampaignStatus, setCampaignRetryPolicy, controlRun } from "@/lib/campaigns.functions";
import { getDashboardStats } from "@/lib/metrics.functions";
import { testImaxConnection, listImaxProfiles, type DiagStep } from "@/lib/imax-client";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Dashboard · FB Viral Traffic Engine Pro" }] }),
  component: App,
});

type ViewKey = "dashboard" | "accounts" | "imax" | "linker" | "reshaper" | "scheduler" | "policy";

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard; tone: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, tone: "from-fuchsia-400 to-violet-500" },
  { key: "accounts", label: "Account Manager", icon: Users, tone: "from-emerald-300 to-teal-500" },
  { key: "imax", label: "iMax Browser Sync", icon: Globe, tone: "from-sky-300 to-blue-500" },
  { key: "linker", label: "Linker Setup", icon: Link2, tone: "from-pink-300 to-fuchsia-500" },
  { key: "reshaper", label: "AI Video Reshaper", icon: Wand2, tone: "from-amber-300 to-rose-500" },
  { key: "scheduler", label: "Campaign Scheduler", icon: CalendarClock, tone: "from-indigo-300 to-purple-500" },
  { key: "policy", label: "Policy Checker", icon: ShieldAlert, tone: "from-rose-300 to-amber-500" },
];

function App() {
  const [view, setView] = useState<ViewKey>("dashboard");
  return (
    <div className="flex min-h-screen text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-20 h-[28rem] w-[28rem] rounded-full bg-emerald-400/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-500/25 blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>
      <Sidebar view={view} setView={setView} />
      <main className="relative z-10 flex-1 min-w-0">
        <TopBar view={view} />
        <div className="px-8 pb-10">
          {view === "dashboard" && <DashboardView />}
          {view === "accounts" && <AccountsView />}
          {view === "imax" && <IMaxView />}
          {view === "linker" && <LinkerView />}
          {view === "reshaper" && <ViralReshaperView />}
          {view === "scheduler" && <SchedulerView />}
          {view === "policy" && <PolicyCheckView />}
        </div>
      </main>
    </div>
  );
}

/* ============================== SIDEBAR ============================== */
function Sidebar({ view, setView }: { view: ViewKey; setView: (v: ViewKey) => void }) {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };
  return (
    <aside className="relative z-10 w-72 shrink-0 p-5">
      <div className="glass-strong sticky top-5 rounded-3xl p-5">
        <div className="flex items-center gap-3 px-2 pb-5">
          <div className="relative">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-sky-400 neon-purple-glow">
              <Zap className="h-5 w-5 text-white drop-shadow" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 neon-green-glow animate-pulse-glow" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">FB Viral</div>
            <div className="text-sm font-semibold text-neon">Traffic Engine Pro</div>
          </div>
        </div>
        <nav className="space-y-1.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = view === n.key;
            return (
              <button key={n.key} onClick={() => setView(n.key)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all ${active ? "glass-strong text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${n.tone} shadow-lg ${active ? "neon-purple-glow" : "opacity-80 group-hover:opacity-100"}`}
                  style={{ boxShadow: active ? undefined : "inset 0 1px 0 rgba(255,255,255,.3)" }}>
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <span className="flex-1 text-left font-medium">{n.label}</span>
                {active && <ChevronRight className="h-4 w-4 text-fuchsia-300" />}
              </button>
            );
          })}
        </nav>
        <button onClick={signOut}
          className="glass mt-6 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </aside>
  );
}

function TopBar({ view }: { view: ViewKey }) {
  const current = NAV.find((n) => n.key === view)!;
  return (
    <div className="sticky top-0 z-20 -mx-1 mb-6 px-8 pt-6">
      <div className="glass flex items-center gap-4 rounded-2xl px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md bg-white/5 px-2 py-1">Workspace</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{current.label}</span>
        </div>
        <div className="ml-auto flex flex-1 max-w-md items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search accounts, campaigns, logs…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-sky-400 text-xs font-bold neon-purple-glow">FB</div>
      </div>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
function DashboardView() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
    refetchInterval: 10_000,
  });
  const qc = useQueryClient();
  // realtime invalidation on new metric events
  useEffect(() => {
    const ch = supabase
      .channel("dash-metrics")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "metric_events" }, () => {
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const s = data?.stats;
  const d = data?.deltas;
  const series = data?.series ?? [];

  const stats = [
    { label: "Total Posts", value: s ? fmt(s.totalPosts) : "—", delta: d ? pct(d.posts) : "", icon: Activity, tone: "from-fuchsia-400 to-violet-500" },
    { label: "Videos Rendered", value: s ? fmt(s.videosRendered) : "—", delta: d ? pct(d.videos) : "", icon: PlayCircle, tone: "from-amber-300 to-rose-500" },
    { label: "Clicks Generated", value: s ? fmt(s.clicks) : "—", delta: d ? pct(d.clicks) : "", icon: TrendingUp, tone: "from-sky-300 to-blue-500" },
    { label: "Success Rate", value: s ? `${s.successRate}%` : "—", delta: d ? pct(d.successRate, true) : "", icon: Shield, tone: "from-emerald-300 to-teal-500" },
  ];

  return (
    <div className="space-y-6">
      <Hero accounts={s?.totalAccounts ?? 0} active={s?.activeAccounts ?? 0} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((st) => {
          const Icon = st.icon;
          const positive = !st.delta.startsWith("-");
          return (
            <div key={st.label} className="glass-strong group relative overflow-hidden rounded-3xl p-5 transition hover:-translate-y-1">
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${st.tone} opacity-30 blur-2xl`} />
              <div className="flex items-center justify-between">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${st.tone} shadow-lg`}
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 10px 30px -10px rgba(0,0,0,.6)" }}>
                  <Icon className="h-5 w-5 text-white" />
                </span>
                {st.delta && (
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${positive ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30" : "bg-rose-400/15 text-rose-300 ring-rose-400/30"}`}>
                    {st.delta}
                  </span>
                )}
              </div>
              <div className="mt-5 text-3xl font-bold tracking-tight">{isLoading ? "…" : st.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{st.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="glass-strong rounded-3xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Traffic Performance</h3>
              <p className="text-xs text-muted-foreground">Last 14 days · live from your campaigns</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] text-emerald-300 ring-1 ring-emerald-400/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> live
            </span>
          </div>
          <GlossyChart series={series} />
        </div>
        <LiveActivity />
      </div>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function pct(n: number, points = false) {
  const s = `${n > 0 ? "+" : ""}${n}${points ? "pt" : "%"}`;
  return s;
}

function Hero({ accounts, active }: { accounts: number; active: number }) {
  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-7">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-emerald-300 ring-1 ring-emerald-400/30">
            <Sparkles className="h-3 w-3" /> Engine Online · v3.8
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Welcome back, <span className="text-neon">Operator</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {accounts} stealth accounts armed · {active} active. iMax footprints synced. Your next campaign is one click away.
          </p>
        </div>
      </div>
    </div>
  );
}

function GlossyChart({ series }: { series: { date: string; posts: number; clicks: number }[] }) {
  const pts = series.length ? series.map((s) => s.posts) : Array(14).fill(0);
  const max = Math.max(1, ...pts);
  const w = 700, h = 240;
  const stepX = w / Math.max(1, pts.length - 1);
  const toY = (v: number) => h - (v / max) * (h - 20) - 10;
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${toY(p)}`).join(" ");
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div className="relative h-64 w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.65 0.28 300)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="oklch(0.65 0.28 300)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.78 0.22 160)" />
            <stop offset="50%" stopColor="oklch(0.7 0.22 240)" />
            <stop offset="100%" stopColor="oklch(0.65 0.28 300)" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="oklch(1 0 0 / 6%)" strokeDasharray="4 6" />
        ))}
        <path d={areaPath} fill="url(#area)" />
        <path d={linePath} fill="none" stroke="url(#line)" strokeWidth="3" filter="url(#glow)" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => i % 2 === 0 && (
          <circle key={i} cx={i * stepX} cy={toY(p)} r="3.5" fill="white" stroke="oklch(0.65 0.28 300)" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}

function LiveActivity() {
  const fetchLogs = useServerFn(listLogs);
  const { data, refetch } = useQuery({
    queryKey: ["recent-logs"],
    queryFn: () => fetchLogs({ data: { limit: 8 } }),
    refetchInterval: 8000,
  });
  useEffect(() => {
    const ch = supabase
      .channel("logs-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "run_logs" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);
  const logs = data?.logs ?? [];
  return (
    <div className="glass-strong rounded-3xl p-6">
      <h3 className="mb-4 text-lg font-semibold">Live Activity</h3>
      <div className="space-y-3">
        {logs.length === 0 && <div className="text-xs text-muted-foreground">No activity yet. Queue your first campaign.</div>}
        {logs.map((a) => {
          const color = a.level === "success" ? "emerald" : a.level === "error" ? "rose" : a.level === "warning" ? "amber" : "sky";
          return (
            <div key={a.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <span className={`h-2 w-2 rounded-full bg-${color}-400 animate-pulse-glow`} />
              <div className="flex-1 text-sm truncate">{a.message}</div>
              <span className="text-[11px] text-muted-foreground">{relTime(a.created_at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

/* ============================== ACCOUNTS ============================== */
function AccountsView() {
  const qc = useQueryClient();
  const fetchAccounts = useServerFn(listAccounts);
  const fetchProxies = useServerFn(listProxies);
  const doImport = useServerFn(importAccounts);
  const doStatus = useServerFn(updateAccountStatus);
  const doDelete = useServerFn(deleteAccount);
  const doProxyAdd = useServerFn(addProxy);
  const doAttach = useServerFn(attachProxy);

  const { data: accData } = useQuery({ queryKey: ["accounts"], queryFn: () => fetchAccounts() });
  const { data: pxData } = useQuery({ queryKey: ["proxies"], queryFn: () => fetchProxies() });
  const accounts = accData?.accounts ?? [];
  const proxies = pxData?.proxies ?? [];

  const importMut = useMutation({
    mutationFn: (rows: any[]) => doImport({ data: { accounts: rows } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "active" | "flagged" | "disconnected" }) => doStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => doDelete({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
  const proxyMut = useMutation({
    mutationFn: (v: any) => doProxyAdd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proxies"] }),
  });
  const attachMut = useMutation({
    mutationFn: (v: { accountIds: string[]; proxyId: string | null }) => doAttach({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const [sel, setSel] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSel((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const counts = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter((a: any) => a.status === "active").length,
    flagged: accounts.filter((a: any) => a.status === "flagged").length,
    disconnected: accounts.filter((a: any) => a.status === "disconnected").length,
  }), [accounts]);

  const [showExcel, setShowExcel] = useState(false);
  return (
    <div className="space-y-6">
      <div className="glass-strong flex flex-wrap items-center justify-between gap-3 rounded-3xl p-4">
        <div>
          <h3 className="text-sm font-semibold">📥 Bulk Excel Upload (UID · Password · Cookies)</h3>
          <p className="text-xs text-muted-foreground">Upload hundreds of accounts at once with auto cookie→UID/PASS fallback login.</p>
        </div>
        <button
          onClick={() => setShowExcel(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:opacity-90">
          <FileSpreadsheet className="h-4 w-4" /> Upload Excel / CSV
        </button>
      </div>
      {showExcel && (
        <BulkExcelUpload
          busy={importMut.isPending}
          onClose={() => setShowExcel(false)}
          onImport={(rows) => {
            importMut.mutate(rows, { onSuccess: () => setShowExcel(false) });
          }}
        />
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ImportCookies onImport={(rows) => importMut.mutate(rows)} busy={importMut.isPending} />
        <ImportTokens onImport={(rows) => importMut.mutate(rows)} busy={importMut.isPending} />
        <ImportCsv onImport={(rows) => importMut.mutate(rows)} busy={importMut.isPending} />
      </div>



      <div className="glass-strong rounded-3xl p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Connected Accounts</h3>
            <p className="text-xs text-muted-foreground">
              {counts.total} total · {counts.active} active · {counts.flagged} flagged · {counts.disconnected} disconnected
              {sel.size > 0 && <> · {sel.size} selected</>}
            </p>
          </div>
          <AddProxyForm onAdd={(v) => proxyMut.mutate(v)} busy={proxyMut.isPending} />
        </div>

        {sel.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Apply proxy to {sel.size} selected:</span>
            <select
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                attachMut.mutate({ accountIds: Array.from(sel), proxyId: v || null });
                setSel(new Set());
              }}
              className="glass rounded-lg bg-transparent px-3 py-1.5 outline-none">
              <option value="">— None —</option>
              {proxies.map((p: any) => (
                <option key={p.id} value={p.id} className="bg-slate-900">{p.label || `${p.ip}:${p.port}`}</option>
              ))}
            </select>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-3 w-8"></th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Proxy</th>
                <th className="px-4 py-3">iMax Profile</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No accounts yet. Import cookies, tokens, or CSV above.
                </td></tr>
              )}
              {accounts.map((r: any) => (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.03] transition">
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-sky-400 text-[10px] font-bold">
                        {r.label.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{r.label}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{r.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.region ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {r.proxies ? `${r.proxies.ip}:${r.proxies.port}` : <span className="opacity-50">none</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.imax_profile_id ?? <span className="opacity-50">unmapped</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => statusMut.mutate({ id: r.id, status: e.target.value as any })}
                      className="rounded-lg bg-transparent text-xs outline-none">
                      <option value="active" className="bg-slate-900">Active</option>
                      <option value="flagged" className="bg-slate-900">Flagged</option>
                      <option value="disconnected" className="bg-slate-900">Disconnected</option>
                    </select>
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteMut.mutate(r.id)} className="glass rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {proxies.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Saved Proxies</div>
            <div className="flex flex-wrap gap-2">
              {proxies.map((p: any) => (
                <ProxyChipDisplay key={p.id} px={p} onDelete={() => { void deleteProxy; }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ImportCookies({ onImport, busy }: { onImport: (rows: any[]) => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [label, setLabel] = useState("");
  return (
    <>
      <ImportCard title="Import Cookies" subtitle=".json / .txt — bulk upload" icon={Upload} tone="from-emerald-300 to-teal-500" onClick={() => setOpen(true)} />
      {open && (
        <Modal title="Import Cookies" onClose={() => setOpen(false)}>
          <Field label="Account Label" value={label} onChange={setLabel} placeholder="e.g. US-East-01" />
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Cookies JSON or Netscape format</span>
            <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)}
              className="glass w-full rounded-xl bg-transparent p-3 font-mono text-xs outline-none"
              placeholder='[{"name":"c_user","value":"100..."},{"name":"xs","value":"..."}]' />
          </label>
          <button disabled={!text || !label || busy}
            onClick={() => { onImport([{ label, cookies: text }]); setOpen(false); setText(""); setLabel(""); }}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-sky-400 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-50">
            {busy ? "Importing…" : "Import"}
          </button>
        </Modal>
      )}
    </>
  );
}
function ImportTokens({ onImport, busy }: { onImport: (rows: any[]) => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <>
      <ImportCard title="Paste Tokens" subtitle="EAAB… — one per line" icon={Link2} tone="from-sky-300 to-blue-500" onClick={() => setOpen(true)} />
      {open && (
        <Modal title="Paste Access Tokens" onClose={() => setOpen(false)}>
          <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)}
            className="glass w-full rounded-xl bg-transparent p-3 font-mono text-xs outline-none"
            placeholder="EAAB…&#10;EAAB…&#10;EAAB…" />
          <button disabled={!text || busy}
            onClick={() => {
              const rows = text.split("\n").map((t) => t.trim()).filter(Boolean).map((tok, i) => ({
                label: `token-${Date.now().toString(36)}-${i}`, token: tok,
              }));
              onImport(rows); setOpen(false); setText("");
            }}
            className="w-full rounded-xl bg-gradient-to-r from-sky-400 to-fuchsia-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Importing…" : `Import ${text.split("\n").filter((l) => l.trim()).length} tokens`}
          </button>
        </Modal>
      )}
    </>
  );
}
function ImportCsv({ onImport, busy }: { onImport: (rows: any[]) => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("label,region,user_agent,cookies\n");
  return (
    <>
      <ImportCard title="CSV Bulk Import" subtitle="label,region,user_agent,cookies" icon={Users} tone="from-fuchsia-400 to-violet-500" onClick={() => setOpen(true)} />
      {open && (
        <Modal title="CSV Bulk Import" onClose={() => setOpen(false)}>
          <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)}
            className="glass w-full rounded-xl bg-transparent p-3 font-mono text-xs outline-none" />
          <button disabled={busy}
            onClick={() => {
              const [head, ...lines] = text.split("\n").filter(Boolean);
              const cols = head.split(",").map((s) => s.trim());
              const rows = lines.map((ln) => {
                const v = ln.split(",");
                const obj: any = {};
                cols.forEach((c, i) => (obj[c] = v[i]?.trim()));
                return { label: obj.label || `acc-${Math.random().toString(36).slice(2, 7)}`, region: obj.region, user_agent: obj.user_agent, cookies: obj.cookies };
              });
              onImport(rows); setOpen(false);
            }}
            className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Importing…" : "Import CSV"}
          </button>
        </Modal>
      )}
    </>
  );
}

function ImportCard({ title, subtitle, icon: Icon, tone, onClick }: { title: string; subtitle: string; icon: typeof Upload; tone: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass-strong group relative w-full overflow-hidden rounded-3xl p-5 text-left transition hover:-translate-y-1">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tone} opacity-30 blur-2xl`} />
      <div className="flex items-center gap-4">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tone}`}
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 10px 30px -10px rgba(0,0,0,.6)" }}>
          <Icon className="h-5 w-5 text-white" />
        </span>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

function AddProxyForm({ onAdd, busy }: { onAdd: (v: any) => void; busy: boolean }) {
  const [ip, setIp] = useState(""); const [port, setPort] = useState(""); const [u, setU] = useState(""); const [p, setP] = useState("");
  return (
    <div className="flex flex-wrap items-end gap-2">
      <ProxyInput label="IP" placeholder="23.81.10.4" value={ip} onChange={setIp} />
      <ProxyInput label="Port" placeholder="8080" value={port} onChange={setPort} />
      <ProxyInput label="User" placeholder="user" value={u} onChange={setU} />
      <ProxyInput label="Pass" placeholder="••••" type="password" value={p} onChange={setP} />
      <button
        disabled={!ip || !port || busy}
        onClick={() => { onAdd({ ip, port: parseInt(port, 10), username: u || undefined, password: p || undefined }); setIp(""); setPort(""); setU(""); setP(""); }}
        className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-sky-400 px-4 py-2 text-xs font-semibold text-white neon-purple-glow disabled:opacity-50">
        Save Proxy
      </button>
    </div>
  );
}
function ProxyInput({ label, placeholder, value, onChange, type = "text" }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-20 bg-transparent outline-none placeholder:text-muted-foreground/60" />
    </label>
  );
}
function ProxyChipDisplay({ px }: { px: any; onDelete: () => void }) {
  return (
    <div className="glass rounded-full px-3 py-1.5 text-xs font-mono">
      {px.label || `${px.ip}:${px.port}`}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { c: string; Icon: typeof CheckCircle2 }> = {
    active: { c: "emerald", Icon: CheckCircle2 },
    flagged: { c: "amber", Icon: AlertTriangle },
    disconnected: { c: "rose", Icon: XCircle },
  };
  const m = map[status] ?? map.active;
  const Icon = m.Icon;
  return (
    <span className={`ml-2 inline-flex items-center gap-1 rounded-full bg-${m.c}-400/15 px-2 py-0.5 text-[10px] font-semibold text-${m.c}-300 ring-1 ring-${m.c}-400/30`}>
      <Icon className="h-3 w-3" />
    </span>
  );
}

/* ============================== iMAX ============================== */
function IMaxView() {
  const qc = useQueryClient();
  const fetchCfg = useServerFn(getImaxConfig);
  const fetchAccounts = useServerFn(listAccounts);
  const saveCfg = useServerFn(saveImaxConfig);
  const recordTest = useServerFn(recordImaxTest);
  const doMap = useServerFn(mapImaxProfile);

  const { data: cfgData } = useQuery({ queryKey: ["imax-cfg"], queryFn: () => fetchCfg() });
  const { data: accData } = useQuery({ queryKey: ["accounts"], queryFn: () => fetchAccounts() });
  const cfg = cfgData?.config;
  const accounts = accData?.accounts ?? [];

  const [endpoint, setEndpoint] = useState("http://127.0.0.1:54345");
  const [token, setToken] = useState("");
  const [sync, setSync] = useState(30);
  const [maxConc, setMaxConc] = useState(24);
  const [fp, setFp] = useState({ canvas: true, webgl: true, audio: false, timezone: true, user_agent: true });
  const [test, setTest] = useState<{ ok: boolean; message: string; busy?: boolean } | null>(null);
  const [diag, setDiag] = useState<DiagStep[]>([]);

  useEffect(() => {
    if (cfg) {
      setEndpoint(cfg.api_endpoint);
      setSync(cfg.sync_interval_seconds);
      setMaxConc(cfg.max_concurrent_profiles);
      setFp(cfg.footprint as any);
    }
  }, [cfg]);

  const saveMut = useMutation({
    mutationFn: () => saveCfg({ data: {
      api_endpoint: endpoint,
      api_token: token || undefined,
      sync_interval_seconds: sync,
      max_concurrent_profiles: maxConc,
      footprint: fp,
    } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["imax-cfg"] }),
  });
  const mapMut = useMutation({
    mutationFn: (v: { accountId: string; profileId: string }) => doMap({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  async function runTest() {
    setTest({ ok: false, message: "Running diagnostics…", busy: true });
    setDiag([]);
    const r = await testImaxConnection(endpoint, token || undefined, (steps) => setDiag(steps));
    setDiag(r.steps);
    setTest({ ok: r.ok, message: r.message + (r.latencyMs ? ` (${r.latencyMs}ms)` : "") });
    await recordTest({ data: { ok: r.ok, message: r.message } }).catch(() => {});
  }
  async function autoMap() {
    try {
      const profiles = await listImaxProfiles(endpoint, token || undefined);
      const unmapped = accounts.filter((a: any) => !a.imax_profile_id).slice(0, profiles.length);
      for (let i = 0; i < unmapped.length; i++) {
        await mapMut.mutateAsync({ accountId: unmapped[i].id, profileId: profiles[i].id });
      }
      setTest({ ok: true, message: `Mapped ${unmapped.length} accounts.` });
    } catch (e) {
      setTest({ ok: false, message: (e as Error).message });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="glass-strong rounded-3xl p-6 lg:col-span-2 space-y-5">
        <Section title="iMax API Configuration" subtitle="Connect to your local Anti-detect Browser (127.0.0.1)" icon={Globe} />
        <Field label="API Endpoint" value={endpoint} onChange={setEndpoint} placeholder="http://127.0.0.1:54345" />
        <Field label="API Token (optional)" value={token} onChange={setToken} placeholder={cfg && (cfg as any).has_token ? "•••• saved" : "Bearer token"} type="password" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sync Interval (s)" value={String(sync)} onChange={(v) => setSync(parseInt(v) || 30)} placeholder="30" />
          <Field label="Max Concurrent Profiles" value={String(maxConc)} onChange={(v) => setMaxConc(parseInt(v) || 24)} placeholder="24" />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={runTest} disabled={test?.busy} className="glass-strong flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
            {test?.busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5 text-emerald-300" />}
            Test Connection
          </button>
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-sky-400 px-4 py-2.5 text-sm font-semibold text-white neon-purple-glow">
            {saveMut.isPending ? "Saving…" : "Save Configuration"}
          </button>
          <button onClick={autoMap} className="glass rounded-xl px-4 py-2.5 text-sm font-semibold">
            Auto-map Profiles
          </button>
        </div>
        {test && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ring-1 ${test.busy ? "bg-sky-400/10 text-sky-300 ring-sky-400/30" : test.ok ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30" : "bg-rose-400/10 text-rose-300 ring-rose-400/30"}`}>
            {test.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : test.ok ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />} {test.message}
          </div>
        )}
        {diag.length > 0 && (
          <div className="glass rounded-2xl p-3 space-y-1.5">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Diagnostic Log</div>
            {diag.map((s) => {
              const tone =
                s.status === "ok" ? "text-emerald-300" :
                s.status === "fail" ? "text-rose-300" :
                s.status === "warn" ? "text-amber-300" :
                s.status === "running" ? "text-sky-300" : "text-muted-foreground";
              const icon =
                s.status === "ok" ? "✓" :
                s.status === "fail" ? "✕" :
                s.status === "warn" ? "!" :
                s.status === "running" ? "…" : "·";
              return (
                <div key={s.id} className="rounded-lg bg-black/20 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 ${tone}`}>
                      <span className="inline-grid h-4 w-4 place-items-center rounded-full bg-white/10 font-mono">{icon}</span>
                      <span className="font-medium">{s.label}</span>
                    </div>
                    {s.ms != null && <span className="font-mono text-[10px] text-muted-foreground">{s.ms}ms</span>}
                  </div>
                  {s.detail && <div className="mt-1 ml-6 text-[11px] text-muted-foreground">{s.detail}</div>}
                  {s.hint && (s.status === "fail" || s.status === "warn") && (
                    <div className="mt-1 ml-6 text-[11px] text-amber-200/90">💡 {s.hint}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Section title="Profile ID Mapping" subtitle="Bind FB accounts to iMax browser profiles" icon={Link2} />
        <div className="space-y-2 max-h-72 overflow-auto">
          {accounts.length === 0 && <div className="text-xs text-muted-foreground">Import accounts first.</div>}
          {accounts.map((a: any) => (
            <div key={a.id} className="glass flex items-center gap-3 rounded-xl px-3 py-2">
              <div className="flex-1 text-sm">{a.label}</div>
              <input
                defaultValue={a.imax_profile_id ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== a.imax_profile_id) mapMut.mutate({ accountId: a.id, profileId: v });
                }}
                placeholder="prof_xxx"
                className="glass w-48 rounded-lg bg-transparent px-3 py-1.5 font-mono text-xs outline-none" />
              <span className="text-[11px] text-emerald-300">{a.imax_profile_id ? "Linked" : "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <Section title="Footprint Randomization" subtitle="Stealth & fingerprint controls" icon={Shield} />
        <Toggle label="Canvas Fingerprint Spoof" value={fp.canvas} onChange={(v) => setFp({ ...fp, canvas: v })} />
        <Toggle label="WebGL Noise Injection" value={fp.webgl} onChange={(v) => setFp({ ...fp, webgl: v })} />
        <Toggle label="Audio Context Randomizer" value={fp.audio} onChange={(v) => setFp({ ...fp, audio: v })} />
        <Toggle label="Timezone / Geo Match Proxy" value={fp.timezone} onChange={(v) => setFp({ ...fp, timezone: v })} />
        <Toggle label="User-Agent Rotation" value={fp.user_agent} onChange={(v) => setFp({ ...fp, user_agent: v })} />
        <div className="glass mt-4 rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Sync Health</div>
          <div className="mt-1 text-2xl font-bold text-neon">
            {cfg?.last_test_ok ? "Healthy" : cfg?.last_test_at ? "Issue" : "—"}
          </div>
          {cfg?.last_test_message && (
            <div className="mt-1 text-[11px] text-muted-foreground">{cfg.last_test_message}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== LINKER ============================== */
function LinkerView() {
  const [tmpl, setTmpl] = useState("{Watch|Check out|Don't miss} this {insane|crazy|wild} {clip|video|moment} 👉 [LINK]");
  const previews = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < 3; i++) {
      let s = tmpl;
      for (let g = 0; g < 20; g++) {
        const m = s.match(/\{([^{}]+)\}/);
        if (!m) break;
        const opts = m[1].split("|");
        s = s.slice(0, m.index!) + opts[Math.floor(Math.random() * opts.length)] + s.slice(m.index! + m[0].length);
      }
      out.push(s);
    }
    return out;
  }, [tmpl]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <Section title="Shortener Integration" subtitle="Connect your own link platform" icon={Link2} />
        <Field label="Shortener API Key" placeholder="shrt_••••••••••••" type="password" value="" onChange={() => {}} />
        <Field label="Base Endpoint" placeholder="https://api.yourshort.io/v2" value="" onChange={() => {}} />
        <Field label="Default Tag" placeholder="fb-viral-en" value="" onChange={() => {}} />
        <Section title="Domain Rotator" subtitle="Round-robin across your domains" icon={RefreshCw} />
        <div className="flex flex-wrap gap-2">
          {["go.brnd.io", "trk.linksy.co", "tap.viralhub.cc"].map((d) => (
            <span key={d} className="glass rounded-full px-3 py-1.5 text-xs text-emerald-300 ring-1 ring-emerald-400/30">{d}</span>
          ))}
          <button className="rounded-full bg-white/5 px-3 py-1.5 text-xs ring-1 ring-white/10">+ Add</button>
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <Section title="Spintax Anchor Generator" subtitle="Auto-rotate link anchor text" icon={Sparkles} />
        <textarea value={tmpl} onChange={(e) => setTmpl(e.target.value)} rows={6}
          className="glass w-full rounded-2xl bg-transparent p-4 font-mono text-sm outline-none" />
        <div className="glass rounded-2xl p-4">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Live Preview</div>
          <div className="space-y-1.5 text-sm">
            {previews.map((p, i) => <div key={i}>{p}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== RESHAPER ============================== */
function ReshaperView() {
  const [speed, setSpeed] = useState(1.04);
  const [blur, setBlur] = useState(12);
  const [sat, setSat] = useState(8);
  const [contrast, setContrast] = useState(5);
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="glass-strong rounded-3xl p-6 lg:col-span-2 space-y-6">
        <Section title="AI Video Reshaper" subtitle="Bypass duplicate-content detection automatically" icon={Wand2} />
        <NeonSlider label="Video Speed" value={speed} min={1.01} max={1.10} step={0.01} format={(v) => `${v.toFixed(2)}x`} onChange={setSpeed} />
        <NeonSlider label="Blur Frame Border" value={blur} min={0} max={64} step={1} format={(v) => `${v}px`} onChange={setBlur} />
        <NeonSlider label="Saturation Offset" value={sat} min={-25} max={25} step={1} format={(v) => `${v > 0 ? "+" : ""}${v}%`} onChange={setSat} />
        <NeonSlider label="Contrast Offset" value={contrast} min={-25} max={25} step={1} format={(v) => `${v > 0 ? "+" : ""}${v}%`} onChange={setContrast} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 pt-2">
          <Toggle label="Horizontal Mirror" value={true} onChange={() => {}} />
          <Toggle label="MD5 / Meta Wipe" value={true} onChange={() => {}} />
          <Toggle label="Seamless Loop Hook" value={false} onChange={() => {}} />
        </div>
      </div>
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <Section title="Preview" subtitle="Live reshape simulation" icon={PlayCircle} />
        <div className="relative aspect-[9/16] overflow-hidden rounded-2xl ring-1 ring-white/10"
          style={{
            background: "radial-gradient(circle at 30% 20%, oklch(0.6 0.25 300 / 60%), oklch(0.4 0.2 240 / 40%) 60%, oklch(0.2 0.1 280) 100%)",
            filter: `saturate(${100 + sat}%) contrast(${100 + contrast}%)`,
            transform: speed > 1.05 ? "scale(1.02)" : undefined,
          }}>
          <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 ${blur * 2}px ${blur}px oklch(0.1 0.02 280)` }} />
          <div className="absolute inset-0 grid place-items-center">
            <div className="glass-strong grid h-16 w-16 place-items-center rounded-full neon-purple-glow">
              <PlayCircle className="h-7 w-7" />
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono">
            <span>00:14 / 00:32</span>
            <span className="text-emerald-300">REC · {speed.toFixed(2)}x</span>
          </div>
        </div>
        <button className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-sky-400 py-3 font-semibold text-slate-900 neon-green-glow">
          Render Queue (desktop)
        </button>
      </div>
    </div>
  );
}

/* ============================== SCHEDULER ============================== */
function SchedulerView() {
  const qc = useQueryClient();
  const fetchAccounts = useServerFn(listAccounts);
  const fetchCampaigns = useServerFn(listCampaigns);
  const fetchLogs = useServerFn(listLogs);
  const doCreate = useServerFn(createCampaign);
  const doStatus = useServerFn(updateCampaignStatus);

  const { data: accData } = useQuery({ queryKey: ["accounts"], queryFn: () => fetchAccounts() });
  const { data: cData, refetch: refetchCampaigns } = useQuery({
    queryKey: ["campaigns"], queryFn: () => fetchCampaigns(), refetchInterval: 5000,
  });
  const accounts = accData?.accounts ?? [];
  const campaigns = cData?.campaigns ?? [];

  useEffect(() => {
    const ch = supabase
      .channel("campaign-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, () => refetchCampaigns())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetchCampaigns]);

  const [name, setName] = useState("");
  const [type, setType] = useState<"post" | "comment" | "reaction">("post");
  const [spintax, setSpintax] = useState("{Hi|Hello|Hey} {everyone|friends}, {this is wild|check this out} 🔥");
  const [link, setLink] = useState("");
  const [pph, setPph] = useState(30);
  const [rand, setRand] = useState(90);
  const [scheduleAt, setScheduleAt] = useState("");
  const [maxRetries, setMaxRetries] = useState(2);
  const [backoff, setBackoff] = useState(60);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: () => doCreate({
      data: {
        name: name || `Campaign ${new Date().toLocaleString()}`,
        type,
        spintax,
        link: link || undefined,
        posts_per_hour: pph,
        randomize_seconds: rand,
        max_retries: maxRetries,
        retry_backoff_seconds: backoff,
        scheduled_at: scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
        account_ids: Array.from(selected),
      },
    }),
    onSuccess: () => {
      setName(""); setLink(""); setSelected(new Set()); setScheduleAt("");
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: any }) => doStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="glass-strong rounded-3xl p-6 lg:col-span-2 space-y-5">
          <Section title="New Campaign" subtitle="Queue posts, comments, or reaction loops" icon={CalendarClock} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Campaign Name" placeholder="Black Friday Drop" value={name} onChange={setName} />
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Type</span>
              <select value={type} onChange={(e) => setType(e.target.value as any)}
                className="glass w-full rounded-xl bg-transparent px-4 py-3 text-sm outline-none">
                <option value="post" className="bg-slate-900">Bulk Post</option>
                <option value="comment" className="bg-slate-900">Comment Drop</option>
                <option value="reaction" className="bg-slate-900">Reaction Loop</option>
              </select>
            </label>
            <Field label="Posts / hour" placeholder="30" value={String(pph)} onChange={(v) => setPph(parseInt(v) || 30)} />
            <Field label="Randomize (±sec)" placeholder="90" value={String(rand)} onChange={(v) => setRand(parseInt(v) || 0)} />
            <Field label="Schedule At (optional)" placeholder="" type="datetime-local" value={scheduleAt} onChange={setScheduleAt} />
            <Field label="Link / Target URL" placeholder="https://…" value={link} onChange={setLink} />
            <Field label="Max Retries (per run)" placeholder="2" value={String(maxRetries)} onChange={(v) => setMaxRetries(Math.max(0, Math.min(10, parseInt(v) || 0)))} />
            <Field label="Retry Backoff (sec, exponential)" placeholder="60" value={String(backoff)} onChange={(v) => setBackoff(Math.max(5, parseInt(v) || 60))} />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Spintax Body</span>
            <textarea value={spintax} onChange={(e) => setSpintax(e.target.value)} rows={3}
              className="glass w-full rounded-xl bg-transparent p-3 font-mono text-xs outline-none" />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
              <span>Target Accounts ({selected.size}/{accounts.length})</span>
              <button onClick={() => setSelected(new Set(accounts.filter((a: any) => a.status === "active").map((a: any) => a.id)))}
                className="text-fuchsia-300 hover:underline normal-case tracking-normal">
                Select all active
              </button>
            </div>
            <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-auto md:grid-cols-3">
              {accounts.map((a: any) => (
                <button key={a.id} type="button"
                  onClick={() => setSelected((s) => { const n = new Set(s); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; })}
                  className={`glass rounded-lg px-3 py-1.5 text-left text-xs ${selected.has(a.id) ? "ring-2 ring-fuchsia-400/60" : ""}`}>
                  {a.label}
                </button>
              ))}
              {accounts.length === 0 && <div className="text-xs text-muted-foreground">Import accounts first.</div>}
            </div>
          </div>

          <button
            disabled={selected.size === 0 || createMut.isPending}
            onClick={() => createMut.mutate()}
            className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 py-3 text-sm font-semibold text-white neon-purple-glow disabled:opacity-50">
            {createMut.isPending ? "Queuing…" : scheduleAt ? "Schedule Campaign" : "Save as Draft"}
          </button>
          {createMut.isError && <div className="text-xs text-rose-300">{(createMut.error as Error).message}</div>}
        </div>

        <div className="glass-strong rounded-3xl p-6 space-y-3">
          <Section title="Execution Queue" subtitle="Live campaign status" icon={Activity} />
          <div className="space-y-2 max-h-[32rem] overflow-auto">
            {campaigns.length === 0 && <div className="text-xs text-muted-foreground">No campaigns yet.</div>}
            {campaigns.map((c: any) => (
              <div key={c.id} className="glass rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <button onClick={() => setOpenCampaign(c.id === openCampaign ? null : c.id)} className="flex-1 text-left">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground">{c.type} · {c.total_done}/{c.total_targets} done · {c.total_failed} failed</div>
                  </button>
                  <CampaignStatusBadge status={c.status} />
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-500"
                    style={{ width: `${Math.round(((c.total_done + c.total_failed) / Math.max(1, c.total_targets)) * 100)}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(c.status === "draft" || c.status === "scheduled") && (
                    <button onClick={() => statusMut.mutate({ id: c.id, status: "running" })} className="rounded-lg bg-emerald-400/15 px-2 py-1 text-[10px] text-emerald-300 ring-1 ring-emerald-400/30">▶ Start</button>
                  )}
                  {c.status === "running" && (
                    <button onClick={() => statusMut.mutate({ id: c.id, status: "paused" })} className="rounded-lg bg-amber-400/15 px-2 py-1 text-[10px] text-amber-300 ring-1 ring-amber-400/30">⏸ Pause</button>
                  )}
                  {c.status === "paused" && (
                    <button onClick={() => statusMut.mutate({ id: c.id, status: "running" })} className="rounded-lg bg-emerald-400/15 px-2 py-1 text-[10px] text-emerald-300 ring-1 ring-emerald-400/30">▶ Resume</button>
                  )}
                  {["draft","scheduled","running","paused"].includes(c.status) && (
                    <button onClick={() => { if (confirm(`Cancel campaign "${c.name}"?`)) statusMut.mutate({ id: c.id, status: "cancelled" }); }}
                      className="rounded-lg bg-rose-400/15 px-2 py-1 text-[10px] text-rose-300 ring-1 ring-rose-400/30">✕ Cancel</button>
                  )}
                  <span className="ml-auto text-[10px] text-muted-foreground">retries: {c.max_retries ?? 0}</span>
                </div>
                {openCampaign === c.id && (
                  <div className="mt-3 space-y-3">
                    <RetryPolicyEditor campaign={c} />
                    <CampaignRuns campaignId={c.id} />
                    <CampaignLogs campaignId={c.id} fetchLogs={fetchLogs} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-white/10 text-muted-foreground",
    scheduled: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
    running: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30 animate-pulse",
    paused: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
    completed: "bg-fuchsia-400/15 text-fuchsia-300 ring-fuchsia-400/30",
    failed: "bg-rose-400/15 text-rose-300 ring-rose-400/30",
    cancelled: "bg-rose-400/10 text-rose-300/80 ring-rose-400/20",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${map[status] ?? map.draft}`}>{status}</span>;
}

function CampaignLogs({ campaignId, fetchLogs }: { campaignId: string; fetchLogs: any }) {
  const { data } = useQuery({
    queryKey: ["logs", campaignId],
    queryFn: () => fetchLogs({ data: { campaignId, limit: 50 } }),
    refetchInterval: 3000,
  });
  const logs = data?.logs ?? [];
  return (
    <div className="mt-3 max-h-52 overflow-auto rounded-xl bg-black/30 p-2 font-mono text-[10px] ring-1 ring-white/5">
      {logs.length === 0 && <div className="text-muted-foreground">No logs yet.</div>}
      {logs.map((l: any) => {
        const color = l.level === "success" ? "text-emerald-300" : l.level === "error" ? "text-rose-300" : l.level === "warning" ? "text-amber-300" : "text-sky-300";
        return (
          <div key={l.id} className="flex gap-2">
            <span className="text-muted-foreground">{new Date(l.created_at).toLocaleTimeString()}</span>
            <span className={color}>[{l.level}]</span>
            <span className="flex-1 truncate">{l.message}</span>
            {l.fb_accounts?.label && <span className="text-muted-foreground">{l.fb_accounts.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

function RetryPolicyEditor({ campaign }: { campaign: any }) {
  const qc = useQueryClient();
  const setPolicy = useServerFn(setCampaignRetryPolicy);
  const [maxR, setMaxR] = useState<number>(campaign.max_retries ?? 2);
  const [backoff, setBackoff] = useState<number>(campaign.retry_backoff_seconds ?? 60);
  const mut = useMutation({
    mutationFn: () => setPolicy({ data: { id: campaign.id, max_retries: maxR, retry_backoff_seconds: backoff } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
  return (
    <div className="glass rounded-xl p-3">
      <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Retry Policy</div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[11px]">
          <span className="block text-muted-foreground">Max retries</span>
          <input type="number" min={0} max={10} value={maxR} onChange={(e) => setMaxR(parseInt(e.target.value) || 0)}
            className="glass mt-1 w-20 rounded-lg bg-transparent px-2 py-1 text-xs outline-none" />
        </label>
        <label className="text-[11px]">
          <span className="block text-muted-foreground">Backoff (s, exponential)</span>
          <input type="number" min={5} max={3600} value={backoff} onChange={(e) => setBackoff(parseInt(e.target.value) || 60)}
            className="glass mt-1 w-24 rounded-lg bg-transparent px-2 py-1 text-xs outline-none" />
        </label>
        <button onClick={() => mut.mutate()} disabled={mut.isPending}
          className="rounded-lg bg-fuchsia-400/15 px-3 py-1.5 text-[11px] text-fuchsia-200 ring-1 ring-fuchsia-400/30">
          {mut.isPending ? "Saving…" : "Apply"}
        </button>
        {mut.isSuccess && <span className="text-[10px] text-emerald-300">Saved ✓</span>}
      </div>
    </div>
  );
}

function CampaignRuns({ campaignId }: { campaignId: string }) {
  const qc = useQueryClient();
  const fetchRuns = useServerFn(listRuns);
  const doControl = useServerFn(controlRun);
  const { data } = useQuery({
    queryKey: ["runs", campaignId],
    queryFn: () => fetchRuns({ data: { campaignId } }),
    refetchInterval: 3000,
  });
  const runs = data?.runs ?? [];
  const ctrl = useMutation({
    mutationFn: (v: { runId: string; action: "pause" | "resume" | "cancel" | "retry" }) =>
      doControl({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["runs", campaignId] }),
  });
  const tone: Record<string, string> = {
    queued: "text-sky-300", running: "text-emerald-300 animate-pulse", paused: "text-amber-300",
    success: "text-emerald-300", failed: "text-rose-300", cancelled: "text-muted-foreground", skipped: "text-muted-foreground",
  };
  return (
    <div className="glass rounded-xl p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Per-account Runs ({runs.length})</span>
      </div>
      <div className="max-h-56 space-y-1 overflow-auto">
        {runs.map((r: any) => (
          <div key={r.id} className="flex items-center gap-2 rounded-lg bg-black/20 px-2 py-1.5 text-[11px]">
            <span className="w-32 truncate">{r.fb_accounts?.label ?? r.account_id?.slice(0, 8)}</span>
            <span className={`w-16 font-mono ${tone[r.status] ?? "text-muted-foreground"}`}>{r.status}</span>
            <span className="w-20 text-muted-foreground">
              {r.retry_count ?? 0}/{r.max_retries ?? 0}
            </span>
            <span className="flex-1 truncate text-muted-foreground">{r.error ?? ""}</span>
            <div className="flex gap-1">
              {(r.status === "queued" || r.status === "running") && (
                <button onClick={() => ctrl.mutate({ runId: r.id, action: "pause" })}
                  className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] text-amber-300">⏸</button>
              )}
              {r.status === "paused" && (
                <button onClick={() => ctrl.mutate({ runId: r.id, action: "resume" })}
                  className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[9px] text-emerald-300">▶</button>
              )}
              {(r.status === "failed" || r.status === "cancelled") && (
                <button onClick={() => ctrl.mutate({ runId: r.id, action: "retry" })}
                  className="rounded bg-sky-400/15 px-1.5 py-0.5 text-[9px] text-sky-300">↻</button>
              )}
              {!["success","cancelled"].includes(r.status) && (
                <button onClick={() => ctrl.mutate({ runId: r.id, action: "cancel" })}
                  className="rounded bg-rose-400/15 px-1.5 py-0.5 text-[9px] text-rose-300">✕</button>
              )}
            </div>
          </div>
        ))}
        {runs.length === 0 && <div className="text-[11px] text-muted-foreground">No runs.</div>}
      </div>
    </div>
  );
}

/* ============================== SHARED ============================== */
function Section({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: typeof Wand2 }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-sky-400"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 8px 20px -8px rgba(0,0,0,.6)" }}>
        <Icon className="h-4 w-4 text-white" />
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text" }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="glass w-full rounded-xl bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-fuchsia-400/50" />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="glass flex w-full items-center justify-between rounded-2xl p-4 text-left">
      <span className="text-sm font-medium">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${value ? "bg-gradient-to-r from-emerald-400 to-sky-400 neon-green-glow" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white shadow transition ${value ? "left-[22px]" : "left-0.5"}`}>
          {value && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
        </span>
      </span>
    </button>
  );
}

function NeonSlider({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs text-fuchsia-300">{format(value)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/5">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-500"
          style={{ width: `${pct}%`, boxShadow: "0 0 12px oklch(0.65 0.28 300 / 70%)" }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_oklch(0.65_0.28_300_/_50%),0_0_18px_oklch(0.65_0.28_300_/_80%)]" />
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="glass-strong w-full max-w-lg space-y-3 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XCircle className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
