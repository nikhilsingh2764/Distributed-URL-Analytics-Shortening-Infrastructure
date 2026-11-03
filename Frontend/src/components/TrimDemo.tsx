import { useEffect, useState } from "react";
import { BarChart3, Copy } from "lucide-react";

const EXAMPLES = [
  { long: "https://shop.example.com/collections/spring-2026/products/linen-shirt?utm_source=newsletter&utm_medium=email&utm_campaign=spring", short: "trimly.link/spring", clicks: [3, 5, 4, 8, 12, 9, 15] },
  { long: "https://docs.example.org/guides/getting-started/installation#step-3-configure-your-environment-variables", short: "trimly.link/setup", clicks: [1, 2, 6, 4, 7, 10, 8] },
  { long: "https://maps.example.net/place/Cafe+Aroma/@18.5204,73.8567,17z/data=!3m1!4b1!4m6!3m5", short: "trimly.link/cafe", clicks: [6, 4, 9, 7, 11, 14, 20] },
] as const;

type Phase = "typing" | "trimmed";

/** The hero moment: a long URL is typed out, then trimmed into a short link with live-looking stats. */
export default function TrimDemo() {
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(reduce ? EXAMPLES[0].long.length : 0);
  const [phase, setPhase] = useState<Phase>(reduce ? "trimmed" : "typing");
  const ex = EXAMPLES[index];

  useEffect(() => {
    if (reduce) return;
    if (phase === "typing") {
      if (chars < ex.long.length) {
        const id = window.setTimeout(() => setChars((c) => Math.min(ex.long.length, c + 3)), 16);
        return () => window.clearTimeout(id);
      }
      const id = window.setTimeout(() => setPhase("trimmed"), 650);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % EXAMPLES.length);
      setChars(0);
      setPhase("typing");
    }, 3600);
    return () => window.clearTimeout(id);
  }, [chars, phase, ex.long.length, reduce]);

  const max = Math.max(...ex.clicks);
  const trimmed = phase === "trimmed";

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[0_24px_60px_-28px_rgb(var(--c-ink)/0.35)] sm:p-6" aria-hidden>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Long link</p>
      <div className="mt-2 h-[4.6rem] overflow-hidden rounded-lg bg-sunken px-3.5 py-3 font-mono text-[12.5px] leading-snug text-muted">
        <span className={`break-all transition-all duration-500 ${trimmed ? "line-through decoration-danger/60 opacity-50" : "caret"}`}>
          {ex.long.slice(0, chars)}
        </span>
      </div>

      <div className={`mt-5 transition-all duration-500 ${trimmed ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Trimmed</p>
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary-soft px-3.5 py-3">
          <span className="link-code text-base font-semibold text-primary">{ex.short}</span>
          <Copy className="size-4 text-primary" />
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted"><BarChart3 className="size-3.5" /> Last 7 days</p>
            <p className="font-display text-3xl font-bold tabular-nums">{ex.clicks.reduce((a, b) => a + b, 0)}<span className="ml-1.5 text-sm font-medium text-muted">clicks</span></p>
          </div>
          <div className="flex h-14 items-end gap-1.5">
            {ex.clicks.map((c, i) => (
              <div key={i} className="w-3 rounded-sm bg-primary transition-all duration-700" style={{ height: trimmed ? `${(c / max) * 100}%` : "6%", opacity: 0.45 + (i / ex.clicks.length) * 0.55, transitionDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
