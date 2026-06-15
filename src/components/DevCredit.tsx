import { Sparkles } from "lucide-react";

export function DevCredit({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 ring-1 ring-fuchsia-400/40 bg-slate-950/60 backdrop-blur animate-dev-glow ${className}`}
    >
      <Sparkles className="h-3.5 w-3.5 text-fuchsia-300 drop-shadow-[0_0_6px_rgba(232,121,249,0.9)]" />
      <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Crafted by</span>
      <span className="dev-credit-text text-sm font-extrabold tracking-wide">Dev Shovon</span>
      <Sparkles className="h-3.5 w-3.5 text-emerald-300 drop-shadow-[0_0_6px_rgba(110,231,183,0.9)]" />
    </div>
  );
}
