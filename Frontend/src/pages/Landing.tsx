import { ArrowRight, Clock3, Globe2, Lock, MonitorSmartphone, Route, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { BarList } from "../components/charts";
import TrimDemo from "../components/TrimDemo";
import { buttonClass } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const SAMPLE_BROWSERS = [
  { label: "Chrome", count: 482 },
  { label: "Safari", count: 311 },
  { label: "Firefox", count: 96 },
  { label: "Edge", count: 58 },
];
const SAMPLE_SOURCES = [
  { label: "linkedin.com", count: 340 },
  { label: "Direct", count: 275 },
  { label: "news.ycombinator.com", count: 190 },
  { label: "t.co", count: 120 },
];

const STEPS = [
  { title: "Paste your link", body: "Any http or https address. Add a custom name or an expiry date if you want one." },
  { title: "Share the short version", body: "Redirects are served from a Redis cache, so people land on your page almost instantly." },
  { title: "Watch the clicks", body: "Clicks are recorded in the background and show up in your dashboard within seconds." },
];

export default function Landing() {
  useDocumentTitle();
  const { user } = useAuth();
  const cta = user ? { to: "/dashboard", label: "Open your dashboard" } : { to: "/register", label: "Create your first link" };

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] font-medium text-muted">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden /> Short links with honest analytics
          </p>
          <h1 className="text-[2.75rem] font-bold leading-[1.02] sm:text-6xl lg:text-[4.25rem]">
            Make long links short.<br />
            <span className="text-primary">See who clicks them.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Trimly turns any address into a short one you can share anywhere — then shows you clicks by day, device, country and source, without tracking your visitors' IP addresses.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={cta.to} className={buttonClass("primary", "lg")}>{cta.label} <ArrowRight className="size-4" /></Link>
            {!user && <Link to="/login" className={buttonClass("secondary", "lg")}>Sign in</Link>}
          </div>
        </div>
        <TrimDemo />
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Every link gets its own report.</h2>
            <p className="mt-4 max-w-lg text-muted">Know which channel actually sends people and what they browse with — then double down on what works.</p>
            <ul className="mt-8 space-y-5">
              {[
                [Globe2, "Where they come from", "Referrer sites and countries, side by side."],
                [MonitorSmartphone, "What they use", "Browser, operating system and device type."],
                [Clock3, "When it happens", "Daily trends over 7, 30 or 90 days, with unique visitors."],
              ].map(([Icon, title, body]) => {
                const I = Icon as typeof Globe2;
                return (
                  <li key={title as string} className="flex gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><I className="size-5" aria-hidden /></span>
                    <div><p className="font-semibold">{title as string}</p><p className="text-sm text-muted">{body as string}</p></div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2" aria-label="Sample analytics">
            <div className="rounded-2xl border border-line bg-bg p-5">
              <p className="mb-4 text-sm font-semibold">Browsers</p>
              <BarList items={SAMPLE_BROWSERS} />
            </div>
            <div className="rounded-2xl border border-line bg-bg p-5">
              <p className="mb-4 text-sm font-semibold">Referrers</p>
              <BarList items={SAMPLE_SOURCES} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="bg-surface p-6 sm:p-7">
              <span className="font-mono text-sm text-primary">0{i + 1}</span>
              <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary p-8 text-primary-ink sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to trim your first link?</h2>
            <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm opacity-85">
              <span className="inline-flex items-center gap-1.5"><Zap className="size-4" />Cached redirects</span>
              <span className="inline-flex items-center gap-1.5"><Lock className="size-4" />Email-verified accounts</span>
              <span className="inline-flex items-center gap-1.5"><Route className="size-4" />Custom names & expiry</span>
            </p>
          </div>
          <Link to={cta.to} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-surface px-6 font-medium text-ink transition hover:brightness-95">
            {cta.label} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
