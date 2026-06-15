import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Wand2, PlayCircle, Sparkles, Flame, Hash, Clock, Target, Loader2,
  Copy, CheckCircle2, Zap, TrendingUp, Eye, Repeat, Volume2,
} from "lucide-react";
import { analyzeViralPotential, type ViralAnalysis } from "@/lib/viral-analysis.functions";

type Preset = {
  key: string;
  name: string;
  desc: string;
  tone: string;
  values: { speed: number; blur: number; sat: number; contrast: number; mirror: boolean; loop: boolean; mdwipe: boolean };
};

const PRESETS: Preset[] = [
  {
    key: "reels", name: "🔥 Reels Killer",
    desc: "9:16 vertical, fast cut, max algorithm boost",
    tone: "from-rose-400 to-amber-400",
    values: { speed: 1.06, blur: 18, sat: 12, contrast: 8, mirror: true, loop: true, mdwipe: true },
  },
  {
    key: "bypass", name: "🛡️ Duplicate Bypass",
    desc: "Strongest anti-detection — repost safe",
    tone: "from-emerald-300 to-teal-500",
    values: { speed: 1.08, blur: 24, sat: 15, contrast: 10, mirror: true, loop: false, mdwipe: true },
  },
  {
    key: "hook", name: "⚡ Hook Boost",
    desc: "Loop-first, subtle edit — retention focused",
    tone: "from-fuchsia-400 to-violet-500",
    values: { speed: 1.03, blur: 8, sat: 5, contrast: 3, mirror: false, loop: true, mdwipe: true },
  },
  {
    key: "subtle", name: "🎨 Subtle Polish",
    desc: "Minimal — for original content",
    tone: "from-sky-300 to-blue-500",
    values: { speed: 1.02, blur: 4, sat: 3, contrast: 2, mirror: false, loop: false, mdwipe: false },
  },
];

export function ViralReshaperView() {
  const [speed, setSpeed] = useState(1.04);
  const [blur, setBlur] = useState(12);
  const [sat, setSat] = useState(8);
  const [contrast, setContrast] = useState(5);
  const [mirror, setMirror] = useState(true);
  const [loop, setLoop] = useState(false);
  const [mdwipe, setMdwipe] = useState(true);
  const [activePreset, setActivePreset] = useState<string>("");

  // Viral AI
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [language, setLanguage] = useState<"english" | "bangla" | "hindi" | "mixed">("english");
  const [audience, setAudience] = useState<"global" | "bd" | "in" | "us" | "uk">("global");

  const run = useServerFn(analyzeViralPotential);
  const mut = useMutation({
    mutationFn: () =>
      run({ data: { topic, niche, language, audience } }) as Promise<ViralAnalysis>,
  });

  const applyPreset = (p: Preset) => {
    setSpeed(p.values.speed); setBlur(p.values.blur); setSat(p.values.sat);
    setContrast(p.values.contrast); setMirror(p.values.mirror);
    setLoop(p.values.loop); setMdwipe(p.values.mdwipe);
    setActivePreset(p.key);
  };

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="glass-strong relative overflow-hidden rounded-3xl p-7">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-500/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-rose-300 ring-1 ring-rose-400/30">
              <Flame className="h-3 w-3" /> Viral Engine v2 · AI Powered
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Smart <span className="text-neon">Viral Video Studio</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              AI দিয়ে viral score, hook, caption, hashtag, posting time সব এক জায়গায়। One-click preset দিয়ে algorithm bypass + retention boost।
            </p>
          </div>
        </div>
      </div>

      {/* PRESETS */}
      <div className="glass-strong rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-300" />
          <h3 className="text-lg font-semibold">One-Click Viral Presets</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PRESETS.map((p) => {
            const active = activePreset === p.key;
            return (
              <button key={p.key} onClick={() => applyPreset(p)}
                className={`group relative overflow-hidden rounded-2xl p-4 text-left ring-1 transition hover:-translate-y-1 ${active ? "ring-fuchsia-400/60 bg-white/5" : "ring-white/10 bg-white/[0.02]"}`}>
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${p.tone} opacity-30 blur-2xl`} />
                <div className="relative">
                  <div className="text-base font-semibold">{p.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.desc}</div>
                  {active && (
                    <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> APPLIED
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI VIRAL ANALYZER */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-strong rounded-3xl p-6 lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-fuchsia-300" />
            <h3 className="text-lg font-semibold">AI Viral Analyzer</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            আপনার video topic / idea লিখুন — AI viral score, hook, caption, hashtag সব দেবে।
          </p>

          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Video Topic / Idea</span>
            <textarea
              value={topic} onChange={(e) => setTopic(e.target.value)} rows={4}
              placeholder="e.g. Man surprises mom with new house"
              className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 placeholder:text-muted-foreground focus:ring-fuchsia-400/40"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Niche (optional)</span>
            <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="comedy / motivation / food / pranks"
              className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10 placeholder:text-muted-foreground focus:ring-fuchsia-400/40" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Language</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10">
                <option value="english" className="bg-slate-900">English</option>
                <option value="bangla" className="bg-slate-900">Bangla</option>
                <option value="hindi" className="bg-slate-900">Hindi</option>
                <option value="mixed" className="bg-slate-900">Mixed</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">Audience</span>
              <select value={audience} onChange={(e) => setAudience(e.target.value as any)}
                className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10">
                <option value="global" className="bg-slate-900">Global</option>
                <option value="bd" className="bg-slate-900">Bangladesh</option>
                <option value="in" className="bg-slate-900">India</option>
                <option value="us" className="bg-slate-900">USA</option>
                <option value="uk" className="bg-slate-900">UK</option>
              </select>
            </label>
          </div>

          <button onClick={() => mut.mutate()} disabled={topic.trim().length < 3 || mut.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-40">
            {mut.isPending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>) : (<><Flame className="h-4 w-4" /> Generate Viral Pack</>)}
          </button>
          {mut.isError && (
            <div className="rounded-xl bg-rose-500/10 p-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              {(mut.error as Error)?.message || "Failed"}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!mut.data && !mut.isPending && (
            <div className="glass-strong grid h-full min-h-[400px] place-items-center rounded-3xl p-6 text-sm text-muted-foreground">
              <div className="text-center">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-fuchsia-300/60" />
                Viral package এখানে দেখাবে।
              </div>
            </div>
          )}
          {mut.isPending && (
            <div className="glass-strong grid h-full min-h-[400px] place-items-center rounded-3xl p-6">
              <Loader2 className="h-10 w-10 animate-spin text-fuchsia-400" />
            </div>
          )}
          {mut.data && <ViralResult result={mut.data} />}
        </div>
      </div>

      {/* RESHAPE CONTROLS + PREVIEW */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="glass-strong rounded-3xl p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-amber-300" />
            <div>
              <h3 className="text-lg font-semibold">Reshape Controls</h3>
              <p className="text-xs text-muted-foreground">Bypass duplicate detection · adjust below</p>
            </div>
          </div>
          <SmartSlider label="Video Speed" icon={Eye} value={speed} min={1.01} max={1.10} step={0.01} format={(v) => `${v.toFixed(2)}x`} onChange={setSpeed} />
          <SmartSlider label="Blur Frame Border" icon={Repeat} value={blur} min={0} max={64} step={1} format={(v) => `${v}px`} onChange={setBlur} />
          <SmartSlider label="Saturation Offset" icon={Volume2} value={sat} min={-25} max={25} step={1} format={(v) => `${v > 0 ? "+" : ""}${v}%`} onChange={setSat} />
          <SmartSlider label="Contrast Offset" icon={TrendingUp} value={contrast} min={-25} max={25} step={1} format={(v) => `${v > 0 ? "+" : ""}${v}%`} onChange={setContrast} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 pt-2">
            <ToggleChip label="Horizontal Mirror" value={mirror} onChange={setMirror} />
            <ToggleChip label="MD5 / Meta Wipe" value={mdwipe} onChange={setMdwipe} />
            <ToggleChip label="Seamless Loop Hook" value={loop} onChange={setLoop} />
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-sky-300" />
            <h3 className="text-lg font-semibold">Live Preview</h3>
          </div>
          <div className="relative aspect-[9/16] overflow-hidden rounded-2xl ring-1 ring-white/10"
            style={{
              background: "radial-gradient(circle at 30% 20%, oklch(0.6 0.25 300 / 60%), oklch(0.4 0.2 240 / 40%) 60%, oklch(0.2 0.1 280) 100%)",
              filter: `saturate(${100 + sat}%) contrast(${100 + contrast}%)`,
              transform: `${speed > 1.05 ? "scale(1.02)" : ""} ${mirror ? "scaleX(-1)" : ""}`.trim(),
            }}>
            <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 ${blur * 2}px ${blur}px oklch(0.1 0.02 280)` }} />
            <div className="absolute inset-0 grid place-items-center">
              <div className="glass-strong grid h-16 w-16 place-items-center rounded-full neon-purple-glow">
                <PlayCircle className="h-7 w-7" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono">
              <span>00:14 / 00:32</span>
              <span className="text-emerald-300">REC · {speed.toFixed(2)}x{mirror ? " · MIR" : ""}</span>
            </div>
          </div>
          <button className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-sky-400 py-3 font-semibold text-slate-900 neon-green-glow">
            Queue for Desktop Render
          </button>
        </div>
      </div>
    </div>
  );
}

function ViralResult({ result }: { result: ViralAnalysis }) {
  const scoreColor = result.viralScore >= 75 ? "emerald" : result.viralScore >= 50 ? "amber" : "rose";
  return (
    <div className="space-y-4">
      {/* SCORE */}
      <div className={`glass-strong rounded-3xl p-6 ring-1 ring-${scoreColor}-400/30`}>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(1 0 0 / 8%)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={scoreColor === "emerald" ? "oklch(0.78 0.22 160)" : scoreColor === "amber" ? "oklch(0.82 0.18 80)" : "oklch(0.7 0.22 20)"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(result.viralScore / 100) * 264} 264`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-2xl font-bold">{result.viralScore}</div>
            </div>
          </div>
          <div className="flex-1">
            <div className={`text-xs uppercase tracking-widest text-${scoreColor}-300 mb-1`}>Viral Score</div>
            <p className="text-sm">{result.scoreReason}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ResultCard icon={Flame} title="Hooks (First 3 sec)" items={result.hooks} tone="rose" />
        <ResultCard icon={Target} title="Captions" items={result.captions} tone="fuchsia" />
        <ResultCard icon={Hash} title="Hashtags" items={result.hashtags} tone="sky" inline />
        <ResultCard icon={Eye} title="Thumbnail Overlay Text" items={result.thumbnailText} tone="amber" />
        <ResultCard icon={Clock} title="Best Posting Times" items={result.bestPostingTimes} tone="emerald" />
        <ResultCard icon={TrendingUp} title="CTAs" items={result.ctaIdeas} tone="violet" />
      </div>

      <div className="glass-strong rounded-3xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-300" />
          <h4 className="text-sm font-semibold">Algorithm Tips</h4>
        </div>
        <ul className="space-y-1.5">
          {result.algorithmTips.map((t, i) => (
            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ResultCard({ icon: Icon, title, items, tone, inline = false }: {
  icon: any; title: string; items: string[]; tone: string; inline?: boolean;
}) {
  const [copied, setCopied] = useState<number | null>(null);
  const copy = (text: string, i: number) => {
    navigator.clipboard?.writeText(text);
    setCopied(i); setTimeout(() => setCopied(null), 1200);
  };
  return (
    <div className="glass-strong rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 text-${tone}-300`} />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      {inline ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <button key={i} onClick={() => copy(it, i)}
              className={`rounded-full bg-${tone}-400/10 px-2.5 py-1 text-[11px] text-${tone}-200 ring-1 ring-${tone}-400/30 hover:bg-${tone}-400/20`}>
              {copied === i ? "✓ copied" : it}
            </button>
          ))}
          <button onClick={() => copy(items.join(" "), -1)}
            className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground ring-1 ring-white/10 hover:bg-white/10">
            {copied === -1 ? "✓ all copied" : "Copy all"}
          </button>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="group flex items-start gap-2 rounded-xl bg-white/[0.03] p-2 text-xs ring-1 ring-white/5">
              <span className="flex-1">{it}</span>
              <button onClick={() => copy(it, i)} className="opacity-0 group-hover:opacity-100 transition" title="Copy">
                {copied === i ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SmartSlider({ label, icon: Icon, value, min, max, step, format, onChange }: {
  label: string; icon: any; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</span>
        <span className="font-mono text-fuchsia-300">{format(value)}</span>
      </div>
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-fuchsia-400" />
    </label>
  );
}

function ToggleChip({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm ring-1 transition ${value ? "bg-fuchsia-400/15 text-fuchsia-200 ring-fuchsia-400/40" : "bg-white/[0.02] text-muted-foreground ring-white/10"}`}>
      <span>{label}</span>
      <span className={`h-4 w-7 rounded-full ${value ? "bg-fuchsia-400" : "bg-white/15"} relative transition`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${value ? "left-3.5" : "left-0.5"}`} />
      </span>
    </button>
  );
}
