import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Globe,
  Link2,
  Wand2,
  CalendarClock,
  Plus,
  Search,
  Zap,
  TrendingUp,
  Activity,
  PlayCircle,
  Shield,
  Cpu,
  Sparkles,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FB Viral Traffic Engine Pro" },
      { name: "description", content: "Premium 3D glassmorphic dashboard for automating Facebook viral traffic campaigns." },
      { property: "og:title", content: "FB Viral Traffic Engine Pro" },
      { property: "og:description", content: "Premium 3D glassmorphic dashboard for automating Facebook viral traffic campaigns." },
    ],
  }),
  component: App,
});

type ViewKey =
  | "dashboard"
  | "accounts"
  | "imax"
  | "linker"
  | "reshaper"
  | "scheduler";

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard; tone: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, tone: "from-fuchsia-400 to-violet-500" },
  { key: "accounts", label: "Account Manager", icon: Users, tone: "from-emerald-300 to-teal-500" },
  { key: "imax", label: "iMax Browser Sync", icon: Globe, tone: "from-sky-300 to-blue-500" },
  { key: "linker", label: "Linker Setup", icon: Link2, tone: "from-pink-300 to-fuchsia-500" },
  { key: "reshaper", label: "AI Video Reshaper", icon: Wand2, tone: "from-amber-300 to-rose-500" },
  { key: "scheduler", label: "Campaign Scheduler", icon: CalendarClock, tone: "from-indigo-300 to-purple-500" },
];

function App() {
  const [view, setView] = useState<ViewKey>("dashboard");

  return (
    <div className="flex min-h-screen text-foreground">
      {/* decorative orbs */}
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
          {view === "reshaper" && <ReshaperView />}
          {view === "scheduler" && <SchedulerView />}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------- SIDEBAR ------------------------------- */
function Sidebar({ view, setView }: { view: ViewKey; setView: (v: ViewKey) => void }) {
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
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all ${
                  active
                    ? "glass-strong text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${n.tone} shadow-lg ${
                    active ? "neon-purple-glow" : "opacity-80 group-hover:opacity-100"
                  }`}
                  style={{ boxShadow: active ? undefined : "inset 0 1px 0 rgba(255,255,255,.3)" }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <span className="flex-1 text-left font-medium">{n.label}</span>
                {active && <ChevronRight className="h-4 w-4 text-fuchsia-300" />}
              </button>
            );
          })}
        </nav>

        <div className="glass mt-6 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="h-3.5 w-3.5 text-emerald-300" />
            Engine Status
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-neon">98.4%</span>
            <span className="text-[11px] text-emerald-300">Operational</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-[98%] rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-500" />
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------- TOPBAR ------------------------------- */
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
          <input
            placeholder="Search accounts, campaigns, logs…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </div>
        <button className="glass-strong flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:scale-[1.02] transition">
          <Plus className="h-4 w-4 text-fuchsia-300" /> New Campaign
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-sky-400 text-xs font-bold neon-purple-glow">
          AX
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- DASHBOARD ------------------------------- */
function DashboardView() {
  const stats = [
    { label: "Total Posts", value: "184,290", delta: "+12.4%", icon: Activity, tone: "from-fuchsia-400 to-violet-500" },
    { label: "Videos Rendered", value: "32,071", delta: "+8.1%", icon: PlayCircle, tone: "from-amber-300 to-rose-500" },
    { label: "Clicks Generated", value: "9.42M", delta: "+24.7%", icon: TrendingUp, tone: "from-sky-300 to-blue-500" },
    { label: "Success Rate", value: "94.6%", delta: "+1.9%", icon: Shield, tone: "from-emerald-300 to-teal-500" },
  ];

  return (
    <div className="space-y-6">
      <Hero />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-strong group relative overflow-hidden rounded-3xl p-5 transition hover:-translate-y-1">
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${s.tone} opacity-30 blur-2xl`} />
              <div className="flex items-center justify-between">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${s.tone} shadow-lg`}
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 10px 30px -10px rgba(0,0,0,.6)" }}>
                  <Icon className="h-5 w-5 text-white" />
                </span>
                <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                  {s.delta}
                </span>
              </div>
              <div className="mt-5 text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="glass-strong rounded-3xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Traffic Performance</h3>
              <p className="text-xs text-muted-foreground">Last 14 days · synced across 248 accounts</p>
            </div>
            <div className="flex gap-1 rounded-xl bg-white/5 p-1 text-xs">
              {["24h", "7d", "14d", "30d"].map((t, i) => (
                <button
                  key={t}
                  className={`rounded-lg px-3 py-1.5 ${i === 2 ? "glass-strong" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <GlossyChart />
        </div>

        <div className="glass-strong rounded-3xl p-6">
          <h3 className="mb-4 text-lg font-semibold">Live Activity</h3>
          <div className="space-y-3">
            {[
              { t: "Account #A-9182 posted to 4 groups", c: "emerald", s: "2s" },
              { t: "Render queue completed (24 videos)", c: "sky", s: "12s" },
              { t: "Spintax comment dropped × 38", c: "fuchsia", s: "41s" },
              { t: "Proxy rotated for cluster EU-3", c: "amber", s: "1m" },
              { t: "Reaction loop boosted post K-22", c: "violet", s: "2m" },
            ].map((a, i) => (
              <div key={i} className="glass flex items-center gap-3 rounded-2xl p-3">
                <span className={`h-2 w-2 rounded-full bg-${a.c}-400 animate-pulse-glow`} />
                <div className="flex-1 text-sm">{a.t}</div>
                <span className="text-[11px] text-muted-foreground">{a.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
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
            248 stealth accounts armed. iMax footprints synced. The viral pipeline is hot — your next campaign is one click away.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="glass rounded-2xl px-5 py-3 text-sm font-semibold hover:scale-[1.02] transition">
            View Logs
          </button>
          <button className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 px-5 py-3 text-sm font-semibold text-white neon-purple-glow hover:scale-[1.02] transition">
            Launch Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

function GlossyChart() {
  const pts = useMemo(
    () => Array.from({ length: 28 }, (_, i) => 30 + Math.sin(i / 2) * 20 + Math.random() * 25 + i * 1.4),
    []
  );
  const max = Math.max(...pts);
  const w = 700;
  const h = 240;
  const stepX = w / (pts.length - 1);
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
        {pts.map((p, i) => i % 4 === 0 && (
          <circle key={i} cx={i * stepX} cy={toY(p)} r="3.5" fill="white" stroke="oklch(0.65 0.28 300)" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------- ACCOUNTS ------------------------------- */
function AccountsView() {
  const rows = [
    { id: "A-9182", name: "Sophia Reyes", region: "US-East", proxy: "23.81.10.4:8080", status: "Active" },
    { id: "A-9183", name: "Liam Tanaka", region: "EU-West", proxy: "78.142.9.2:3128", status: "Active" },
    { id: "A-9184", name: "Mei Chen", region: "APAC", proxy: "103.44.21.9:1080", status: "Flagged" },
    { id: "A-9185", name: "Noah Hassan", region: "MENA", proxy: "41.99.22.8:8000", status: "Active" },
    { id: "A-9186", name: "Aria Kowalski", region: "EU-North", proxy: "94.16.55.3:8080", status: "Disconnected" },
    { id: "A-9187", name: "Ethan Park", region: "US-West", proxy: "67.21.88.1:8080", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ImportCard title="Import Cookies" subtitle=".json / .txt — bulk upload" icon={Upload} tone="from-emerald-300 to-teal-500" />
        <ImportCard title="Paste Tokens" subtitle="EAAB... — comma separated" icon={Link2} tone="from-sky-300 to-blue-500" />
        <ImportCard title="CSV Bulk Import" subtitle="account,proxy,user-agent" icon={Users} tone="from-fuchsia-400 to-violet-500" />
      </div>

      <div className="glass-strong rounded-3xl p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Connected Accounts</h3>
            <p className="text-xs text-muted-foreground">248 total · 231 active · 12 flagged · 5 disconnected</p>
          </div>
          <div className="flex gap-2">
            <ProxyChip label="IP" placeholder="192.168.0.1" />
            <ProxyChip label="Port" placeholder="8080" />
            <ProxyChip label="User" placeholder="user" />
            <ProxyChip label="Pass" placeholder="••••" type="password" />
            <button className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-sky-400 px-4 py-2 text-xs font-semibold text-white neon-purple-glow">
              Apply Proxy
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Proxy</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.03] transition">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-sky-400 text-[10px] font-bold">
                        {r.name.split(" ").map((p) => p[0]).join("")}
                      </div>
                      <div className="font-medium">{r.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.region}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.proxy}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button className="glass rounded-lg px-3 py-1.5 text-xs">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ImportCard({ title, subtitle, icon: Icon, tone }: { title: string; subtitle: string; icon: typeof Upload; tone: string }) {
  return (
    <div className="glass-strong group relative overflow-hidden rounded-3xl p-5 transition hover:-translate-y-1 cursor-pointer">
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
    </div>
  );
}

function ProxyChip({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input type={type} placeholder={placeholder} className="w-20 bg-transparent outline-none placeholder:text-muted-foreground/60" />
    </label>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { c: string; Icon: typeof CheckCircle2 }> = {
    Active: { c: "emerald", Icon: CheckCircle2 },
    Flagged: { c: "amber", Icon: AlertTriangle },
    Disconnected: { c: "rose", Icon: XCircle },
  };
  const m = map[status];
  const Icon = m.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-${m.c}-400/15 px-2.5 py-1 text-[11px] font-semibold text-${m.c}-300 ring-1 ring-${m.c}-400/30`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}

/* ------------------------------- iMAX ------------------------------- */
function IMaxView() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="glass-strong rounded-3xl p-6 lg:col-span-2 space-y-5">
        <Section title="iMax API Configuration" subtitle="Connect to your Anti-detect Browser instance" icon={Globe} />
        <Field label="API Endpoint" placeholder="http://127.0.0.1:54345" />
        <Field label="API Token" placeholder="sk_live_imax_••••••••••" type="password" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sync Interval (s)" placeholder="30" />
          <Field label="Max Concurrent Profiles" placeholder="24" />
        </div>

        <Section title="Profile ID Mapping" subtitle="Bind FB accounts to iMax browser profiles" icon={Link2} />
        <div className="space-y-2">
          {["A-9182 → prof_8x12kq", "A-9183 → prof_77abm0", "A-9184 → prof_q23dlz"].map((m) => (
            <div key={m} className="glass flex items-center justify-between rounded-xl px-4 py-3 text-sm font-mono">
              <span>{m}</span>
              <span className="text-[11px] text-emerald-300">Linked</span>
            </div>
          ))}
          <button className="glass-strong w-full rounded-xl py-3 text-sm font-semibold">+ Add Mapping</button>
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <Section title="Footprint Randomization" subtitle="Stealth & fingerprint controls" icon={Shield} />
        <Toggle label="Canvas Fingerprint Spoof" on />
        <Toggle label="WebGL Noise Injection" on />
        <Toggle label="Audio Context Randomizer" />
        <Toggle label="Timezone / Geo Match Proxy" on />
        <Toggle label="User-Agent Rotation" on />
        <div className="glass mt-4 rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Sync Health</div>
          <div className="mt-1 text-2xl font-bold text-neon">99.1%</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-[99%] rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- LINKER ------------------------------- */
function LinkerView() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <Section title="Shortener Integration" subtitle="Connect your own link platform" icon={Link2} />
        <Field label="Shortener API Key" placeholder="shrt_••••••••••••" type="password" />
        <Field label="Base Endpoint" placeholder="https://api.yourshort.io/v2" />
        <Field label="Default Tag" placeholder="fb-viral-en" />

        <Section title="Domain Rotator" subtitle="Round-robin across your domains" icon={RefreshCw} />
        <div className="flex flex-wrap gap-2">
          {["go.brnd.io", "trk.linksy.co", "tap.viralhub.cc", "x.shr.ly", "qk.bznz.app"].map((d, i) => (
            <span key={d} className={`glass rounded-full px-3 py-1.5 text-xs ${i < 3 ? "text-emerald-300 ring-1 ring-emerald-400/30" : "text-muted-foreground"}`}>
              {d}
            </span>
          ))}
          <button className="rounded-full bg-white/5 px-3 py-1.5 text-xs ring-1 ring-white/10">+ Add</button>
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <Section title="Spintax Anchor Generator" subtitle="Auto-rotate link anchor text" icon={Sparkles} />
        <textarea
          rows={6}
          defaultValue="{Watch|Check out|Don't miss} this {insane|crazy|wild} {clip|video|moment} 👉 [LINK]"
          className="glass w-full rounded-2xl bg-transparent p-4 font-mono text-sm outline-none"
        />
        <div className="glass rounded-2xl p-4">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Preview</div>
          <div className="space-y-1.5 text-sm">
            <div>Watch this insane clip 👉 <span className="text-sky-300">go.brnd.io/q8a</span></div>
            <div>Don't miss this wild moment 👉 <span className="text-emerald-300">trk.linksy.co/m2x</span></div>
            <div>Check out this crazy video 👉 <span className="text-fuchsia-300">tap.viralhub.cc/k71</span></div>
          </div>
        </div>
        <button className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 py-3 font-semibold text-white neon-purple-glow">
          Generate 500 Variations
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- RESHAPER ------------------------------- */
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
          <Toggle label="Horizontal Mirror" on />
          <Toggle label="MD5 / Meta Wipe" on />
          <Toggle label="Seamless Loop Hook" />
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <Section title="Preview" subtitle="Live reshape simulation" icon={PlayCircle} />
        <div
          className="relative aspect-[9/16] overflow-hidden rounded-2xl ring-1 ring-white/10"
          style={{
            background: "radial-gradient(circle at 30% 20%, oklch(0.6 0.25 300 / 60%), oklch(0.4 0.2 240 / 40%) 60%, oklch(0.2 0.1 280) 100%)",
            filter: `saturate(${100 + sat}%) contrast(${100 + contrast}%)`,
            transform: speed > 1.05 ? "scale(1.02)" : undefined,
          }}
        >
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
          Render 124 Videos
        </button>
      </div>
    </div>
  );
}

function NeonSlider({
  label, value, min, max, step, format, onChange,
}: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void; }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs text-fuchsia-300">{format(value)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/5">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-500"
          style={{ width: `${pct}%`, boxShadow: "0 0 12px oklch(0.65 0.28 300 / 70%)" }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_oklch(0.65_0.28_300_/_50%),0_0_18px_oklch(0.65_0.28_300_/_80%)]"
        />
      </div>
    </div>
  );
}

function Toggle({ label, on: initial = false }: { label: string; on?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button onClick={() => setOn(!on)} className="glass flex w-full items-center justify-between rounded-2xl p-4 text-left">
      <span className="text-sm font-medium">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${on ? "bg-gradient-to-r from-emerald-400 to-sky-400 neon-green-glow" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`}>
          {on && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
        </span>
      </span>
    </button>
  );
}

/* ------------------------------- SCHEDULER ------------------------------- */
function SchedulerView() {
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  const loads = useMemo(() => days.map(() => Math.random()), [days.length]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="glass-strong rounded-3xl p-6 lg:col-span-2">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">November 2026</h3>
            <p className="text-xs text-muted-foreground">3D heatmap · campaign density per day</p>
          </div>
          <div className="flex gap-2">
            <button className="glass rounded-xl px-3 py-1.5 text-xs">‹</button>
            <button className="glass rounded-xl px-3 py-1.5 text-xs">›</button>
            <button className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-sky-400 px-3 py-1.5 text-xs font-semibold text-white">+ Schedule</button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => {
            const valid = d >= 1 && d <= 30;
            const l = loads[i];
            const tone = l > 0.7 ? "from-fuchsia-500 to-violet-500" : l > 0.4 ? "from-sky-400 to-blue-500" : "from-emerald-400 to-teal-500";
            return (
              <div
                key={i}
                className={`relative aspect-square rounded-2xl ${valid ? "glass cursor-pointer hover:-translate-y-0.5" : "opacity-30"} transition`}
              >
                {valid && (
                  <>
                    <span className="absolute left-2 top-1.5 text-xs font-medium">{d}</span>
                    <div
                      className={`absolute bottom-2 left-2 right-2 rounded-lg bg-gradient-to-br ${tone}`}
                      style={{ height: `${Math.round(l * 60)}%`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.35)" }}
                    />
                    <span className="absolute bottom-1.5 right-2 text-[10px] font-mono text-white/80">{Math.round(l * 240)}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <Section title="Bulk Posting" subtitle="Spread across accounts & groups" icon={CalendarClock} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" placeholder="2026-11-14 09:00" />
            <Field label="End" placeholder="2026-11-14 22:00" />
          </div>
          <Field label="Posts / hour" placeholder="42" />
          <Toggle label="Randomize timing (±90s)" on />
        </div>

        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <Section title="Comment Drop" subtitle="Spintax engine" icon={Sparkles} />
          <textarea
            rows={3}
            defaultValue="{Hi|Hello|Hey} {everyone|friends}, {this is wild|check this out} 🔥"
            className="glass w-full rounded-2xl bg-transparent p-3 font-mono text-xs outline-none"
          />
          <Toggle label="Multi-account reaction loop" on />
          <Toggle label="Auto-rotate emoji set" />
          <button className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-sky-400 py-3 text-sm font-semibold text-slate-900 neon-green-glow">
            Queue Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- SHARED ------------------------------- */
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

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="glass w-full rounded-xl bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-fuchsia-400/50"
      />
    </label>
  );
}
