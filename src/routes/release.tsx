import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Download, Package, Shield, CheckCircle2, AlertTriangle, Loader2,
  ExternalLink, Cpu, HardDrive, Zap, FileArchive, Github, History, ChevronDown, Play,
} from "lucide-react";

const GH_OWNER = "abexpoit-blip";
const GH_REPO = "helper-hub";
const GH_API_LIST = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases?per_page=30`;
const GH_RELEASES = `https://github.com/${GH_OWNER}/${GH_REPO}/releases`;
const GH_ACTIONS = `https://github.com/${GH_OWNER}/${GH_REPO}/actions`;

type GhAsset = {
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
  updated_at: string;
};
type GhRelease = {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  body: string;
  assets: GhAsset[];
};

export const Route = createFileRoute("/release")({
  head: () => ({
    meta: [
      { title: "Download · FB Viral Traffic Engine Pro" },
      { name: "description", content: "Download the latest Windows desktop build (installer + portable .exe) of FB Viral Traffic Engine Pro." },
      { property: "og:title", content: "Download · FB Viral Traffic Engine Pro" },
      { property: "og:description", content: "Latest Windows .exe download (installer + portable)." },
    ],
  }),
  component: ReleasePage,
});

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function classifyAsset(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("portable") && lower.endsWith(".exe")) {
    return { label: "Portable .exe", desc: "No install required — double-click to run", icon: Zap, primary: true, tone: "from-emerald-400 to-teal-500" };
  }
  if (lower.endsWith(".msi")) {
    return { label: "MSI Installer", desc: "Windows Installer package (recommended)", icon: HardDrive, primary: true, tone: "from-sky-400 to-blue-500" };
  }
  if (lower.endsWith(".exe")) {
    return { label: "NSIS Installer", desc: "Standard Windows setup .exe", icon: Package, primary: false, tone: "from-violet-400 to-fuchsia-500" };
  }
  return { label: "Asset", desc: name, icon: FileArchive, primary: false, tone: "from-slate-400 to-slate-600" };
}

function ReleasePage() {
  const { data: releases, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery<GhRelease[]>({
    queryKey: ["gh-releases", GH_OWNER, GH_REPO],
    queryFn: async () => {
      const res = await fetch(`${GH_API_LIST}&_=${Date.now()}`, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const json = (await res.json()) as GhRelease[];
      if (!Array.isArray(json) || json.length === 0) throw new Error("NO_RELEASE");
      return json;
    },
    retry: 1,
    staleTime: 15_000,
    // Auto-poll until a release with Windows binaries shows up.
    refetchInterval: (q) => {
      const list = q.state.data as GhRelease[] | undefined;
      const err = q.state.error as Error | null;
      const hasWin = list?.some((r) => r.assets.some((a) => /\.(exe|msi)$/i.test(a.name)));
      if (hasWin) return false; // build done — stop polling
      // Poll faster when nothing yet / error, until workflow finishes
      if (err || !list || list.length === 0) return 15_000;
      return 20_000; // release exists but no .exe yet (build still running)
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  useEffect(() => {
    if (releases && releases.length > 0 && !selectedTag) setSelectedTag(releases[0].tag_name);
  }, [releases, selectedTag]);

  const data = releases?.find(r => r.tag_name === selectedTag) ?? releases?.[0];
  const winAssets = (data?.assets ?? []).filter(a =>
    a.name.toLowerCase().endsWith(".exe") || a.name.toLowerCase().endsWith(".msi")
  );

  return (
    <div className="min-h-screen text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-20 h-[28rem] w-[28rem] rounded-full bg-emerald-400/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-500/25 blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-14">
        {/* Hero */}
        <div className="glass-strong rounded-3xl p-8 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Desktop Release</div>
              <h1 className="text-3xl font-bold text-neon">FB Viral Traffic Engine Pro</h1>
              <p className="text-sm text-muted-foreground mt-1">Windows 10 / 11 (64-bit) — Installer & Portable</p>
            </div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition">← Home</Link>
          </div>

          {/* Build status banner */}
          <BuildStatusBanner state={isLoading ? "loading" : error ? "error" : data ? "ready" : "idle"} errorMsg={(error as Error | undefined)?.message} release={data} />
        </div>

        {/* Version selector */}
        {releases && releases.length > 0 && (
          <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <History className="h-4 w-4" />
              <span>Version:</span>
            </div>
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <select
                value={selectedTag ?? ""}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full appearance-none rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:border-fuchsia-400/50 hover:border-white/20 transition cursor-pointer"
              >
                {releases.map((r, i) => {
                  const hasWin = r.assets.some(a => /\.(exe|msi)$/i.test(a.name));
                  return (
                    <option key={r.tag_name} value={r.tag_name}>
                      {r.tag_name} {i === 0 ? "(latest)" : ""} — {new Date(r.published_at).toLocaleDateString()} {hasWin ? "✓" : "⚠ no .exe"}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="text-xs text-muted-foreground">
              {releases.length} release{releases.length === 1 ? "" : "s"} available
            </div>
          </div>
        )}

        {/* Download cards */}
        {isLoading && (
          <div className="glass rounded-3xl p-10 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-fuchsia-400 mb-3" />
            <div className="text-sm text-muted-foreground">Fetching latest build from GitHub Releases…</div>
          </div>
        )}

        {error && (error as Error).message === "NO_RELEASE" && (
          <NoReleaseYet />
        )}

        {error && (error as Error).message !== "NO_RELEASE" && (
          <div className="glass rounded-3xl p-8 border border-rose-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-rose-300">Couldn't reach GitHub</div>
                <div className="text-sm text-muted-foreground mt-1">{(error as Error).message}</div>
                <button onClick={() => refetch()} className="mt-4 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-sm transition">
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {data && winAssets.length === 0 && (
          <div className="glass rounded-3xl p-8 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-200">Release found, but no Windows binaries attached</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Latest release <span className="font-mono">{data.tag_name}</span> has no .exe / .msi assets. The Tauri workflow may still be running or failed.
                </div>
                <a href={GH_ACTIONS} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-sm text-sky-300 hover:text-sky-200">
                  Check GitHub Actions <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {data && winAssets.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {winAssets
                .sort((a, b) => Number(classifyAsset(b.name).primary) - Number(classifyAsset(a.name).primary))
                .map((asset) => {
                  const meta = classifyAsset(asset.name);
                  const Icon = meta.icon;
                  return (
                    <a
                      key={asset.name}
                      href={asset.browser_download_url}
                      className="group glass-strong rounded-3xl p-6 hover:scale-[1.01] transition relative overflow-hidden"
                    >
                      <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${meta.tone} opacity-20 blur-2xl`} />
                      <div className="relative">
                        <div className={`inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${meta.tone} mb-4`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-lg font-semibold">{meta.label}</div>
                        <div className="text-sm text-muted-foreground mt-1">{meta.desc}</div>
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
                          <div className="text-xs font-mono text-muted-foreground truncate max-w-[60%]">{asset.name}</div>
                          <div className="flex items-center gap-2 text-sm text-fuchsia-300 group-hover:text-fuchsia-200">
                            <Download className="h-4 w-4" />
                            {formatBytes(asset.size)}
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
            </div>

            {/* Release meta */}
            <div className="glass rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Release</div>
                  <div className="font-semibold">{data.name || data.tag_name}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Published {new Date(data.published_at).toLocaleString()}
                </div>
                <a href={data.html_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-sky-300 hover:text-sky-200">
                  View on GitHub <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              {data.body && (
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground max-h-64 overflow-auto bg-black/20 rounded-xl p-4 border border-white/5">{data.body}</pre>
              )}
            </div>
          </>
        )}

        {/* System requirements */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Req icon={Cpu} title="Windows 10 / 11" desc="64-bit only" />
          <Req icon={HardDrive} title="~150 MB" desc="Free disk space" />
          <Req icon={Shield} title="Code-signed" desc="When configured in workflow" />
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs text-muted-foreground hover:text-foreground transition inline-flex items-center gap-2"
          >
            {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
            Refresh release info
          </button>
        </div>
      </div>
    </div>
  );
}

function BuildStatusBanner({ state, errorMsg, release }: { state: "loading" | "error" | "ready" | "idle"; errorMsg?: string; release?: GhRelease }) {
  if (state === "loading") {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 p-4">
        <Loader2 className="h-5 w-5 text-sky-300 animate-spin" />
        <div>
          <div className="font-medium text-sky-200">Checking build status…</div>
          <div className="text-xs text-muted-foreground">Querying GitHub for the latest Tauri build</div>
        </div>
      </div>
    );
  }
  if (state === "error" && errorMsg !== "NO_RELEASE") {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4">
        <AlertTriangle className="h-5 w-5 text-rose-300" />
        <div>
          <div className="font-medium text-rose-200">Build status unavailable</div>
          <div className="text-xs text-muted-foreground">{errorMsg}</div>
        </div>
      </div>
    );
  }
  if (state === "error" && errorMsg === "NO_RELEASE") {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-300" />
        <div>
          <div className="font-medium text-amber-200">No release published yet</div>
          <div className="text-xs text-muted-foreground">Push a tag like <code className="font-mono">v1.0.0</code> to trigger the Windows build.</div>
        </div>
      </div>
    );
  }
  if (state === "ready" && release) {
    const hasWin = release.assets.some(a => /\.(exe|msi)$/i.test(a.name));
    return (
      <div className={`mt-6 flex items-center gap-3 rounded-2xl p-4 border ${hasWin ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
        {hasWin ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <AlertTriangle className="h-5 w-5 text-amber-300" />}
        <div>
          <div className={`font-medium ${hasWin ? "text-emerald-200" : "text-amber-200"}`}>
            {hasWin ? `Build succeeded — ${release.tag_name} ready to download` : `Build incomplete — ${release.tag_name} has no Windows binaries`}
          </div>
          <div className="text-xs text-muted-foreground">
            {release.assets.length} asset{release.assets.length === 1 ? "" : "s"} • published {new Date(release.published_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function NoReleaseYet() {
  return (
    <div className="glass-strong rounded-3xl p-8">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500">
          <Github className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold">No release published yet</div>
          <p className="text-sm text-muted-foreground mt-1">
            The GitHub Actions workflow builds the Windows .exe and attaches it to a Release when you push a version tag.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href={GH_ACTIONS}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
            >
              <Play className="h-4 w-4" />
              Trigger Build
            </a>
            <span className="text-xs text-muted-foreground">Opens GitHub Actions → “Build Windows Desktop App” → Run workflow</span>
          </div>
          <div className="mt-4 rounded-2xl bg-black/30 border border-white/5 p-4 font-mono text-xs space-y-1">
            <div className="text-emerald-300"># Or from your local clone:</div>
            <div>git tag v1.0.0</div>
            <div>git push origin v1.0.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Req({ icon: Icon, title, desc }: { icon: typeof Cpu; title: string; desc: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className="h-5 w-5 text-fuchsia-300 mb-2" />
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
