import { useEffect, useRef, useState } from "react";
import { Download, Sparkles, X, RefreshCw, CheckCircle2 } from "lucide-react";
import { APP_VERSION, GITHUB_REPO } from "@/lib/app-version";

type Asset = { name: string; browser_download_url: string; size: number };
type Release = {
  tag_name: string;
  name: string;
  html_url: string;
  body: string;
  published_at: string;
  assets: Asset[];
};

function isNewer(remote: string, current: string): boolean {
  const r = remote.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const c = current.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(r.length, c.length); i++) {
    const a = r[i] ?? 0;
    const b = c[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

const DISMISS_KEY = "update_dismissed_tag";
const AUTO_KEY = "update_auto_download";

function pickInstaller(assets: Asset[]): Asset | undefined {
  return (
    assets.find((a) => a.name.toLowerCase().endsWith(".exe")) ??
    assets.find((a) => a.name.toLowerCase().endsWith(".msi")) ??
    assets[0]
  );
}

export function UpdateChecker() {
  const [release, setRelease] = useState<Release | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(DISMISS_KEY) : null
  );
  const [autoDownload, setAutoDownload] = useState<boolean>(
    typeof window !== "undefined" ? localStorage.getItem(AUTO_KEY) === "1" : false
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // background download state
  const [dlProgress, setDlProgress] = useState<number | null>(null); // 0..100
  const [dlBlobUrl, setDlBlobUrl] = useState<string | null>(null);
  const [dlFileName, setDlFileName] = useState<string | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);
  const dlStartedForRef = useRef<string | null>(null);

  async function check() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) throw new Error(`GitHub ${res.status}`);
      const data: Release = await res.json();
      setRelease(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to check");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    check();
    const id = setInterval(check, 1000 * 60 * 60);
    return () => clearInterval(id);
  }, []);

  // Auto-download in background when a new release is detected
  useEffect(() => {
    if (!release) return;
    if (!autoDownload) return;
    if (!isNewer(release.tag_name, APP_VERSION)) return;
    if (dlStartedForRef.current === release.tag_name) return;

    const asset = pickInstaller(release.assets);
    if (!asset) return;

    dlStartedForRef.current = release.tag_name;
    setDlError(null);
    setDlBlobUrl(null);
    setDlProgress(0);
    setDlFileName(asset.name);

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(asset.browser_download_url, {
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const total = Number(res.headers.get("content-length")) || asset.size || 0;
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            if (total > 0) setDlProgress(Math.round((received / total) * 100));
          }
        }
        const blob = new Blob(chunks as BlobPart[], {
          type: "application/octet-stream",
        });
        setDlBlobUrl(URL.createObjectURL(blob));
        setDlProgress(100);
      } catch (e: unknown) {
        setDlError(e instanceof Error ? e.message : "Download failed");
        dlStartedForRef.current = null;
      }
    })();

    return () => controller.abort();
  }, [release, autoDownload]);

  if (!release) return null;
  const hasUpdate = isNewer(release.tag_name, APP_VERSION);
  if (!hasUpdate) return null;
  if (dismissed === release.tag_name) return null;

  const installer = pickInstaller(release.assets);
  const isReady = dlBlobUrl !== null;
  const isDownloading = dlProgress !== null && !isReady && !dlError;

  function toggleAuto(next: boolean) {
    setAutoDownload(next);
    localStorage.setItem(AUTO_KEY, next ? "1" : "0");
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-[380px] max-w-[calc(100vw-2rem)]">
      <div
        className="relative rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-950/90 via-purple-950/90 to-slate-950/90 p-4 shadow-2xl backdrop-blur-xl"
        style={{ boxShadow: "0 0 40px rgba(217, 70, 239, 0.35)" }}
      >
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, release!.tag_name);
            setDismissed(release!.tag_name);
          }}
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-fuchsia-300" />
          <span className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
            {isReady ? "Update Ready to Install" : "New Update Available"}
          </span>
        </div>

        <h3 className="mb-1 text-base font-bold text-white">
          {release.name || release.tag_name}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Current: <span className="text-white/70">v{APP_VERSION}</span> → Latest:{" "}
          <span className="font-semibold text-emerald-300">{release.tag_name}</span>
        </p>

        {release.body && !isDownloading && !isReady && (
          <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-white/70">
            {release.body.slice(0, 200)}
          </p>
        )}

        {/* Auto-download toggle */}
        <label className="mb-3 flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-xs text-white/80">Auto-download in background</span>
          <input
            type="checkbox"
            checked={autoDownload}
            onChange={(e) => toggleAuto(e.target.checked)}
            className="h-4 w-4 accent-fuchsia-500"
          />
        </label>

        {/* Progress */}
        {isDownloading && (
          <div className="mb-3">
            <div className="mb-1 flex justify-between text-[10px] text-white/60">
              <span>Downloading {dlFileName}…</span>
              <span>{dlProgress ?? 0}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-400 to-emerald-400 transition-all"
                style={{ width: `${dlProgress ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {dlError && (
          <p className="mb-2 text-[10px] text-red-400">
            Auto-download failed: {dlError}. Use manual download below.
          </p>
        )}

        <div className="flex gap-2">
          {isReady && dlBlobUrl ? (
            <a
              href={dlBlobUrl}
              download={dlFileName ?? "update.exe"}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:from-emerald-400 hover:to-green-500"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Save & Install
            </a>
          ) : installer ? (
            <a
              href={installer.browser_download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:from-fuchsia-400 hover:to-purple-500"
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloading ? "Downloading…" : `Download ${installer.name.toLowerCase().endsWith(".msi") ? "MSI" : "EXE"}`}
            </a>
          ) : (
            <a
              href={release.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-lg"
            >
              <Download className="h-3.5 w-3.5" />
              View Release
            </a>
          )}
          <button
            onClick={check}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
            title="Check again"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {error && (
          <p className="mt-2 text-[10px] text-red-400">Check failed: {error}</p>
        )}
      </div>
    </div>
  );
}
