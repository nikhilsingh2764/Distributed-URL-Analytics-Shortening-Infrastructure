import { Link } from "react-router-dom";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M6 11h14M6 16h20M6 21h9" className="stroke-primary-ink" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="21" r="2.4" className="fill-accent" />
    </svg>
  );
}

export default function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg" aria-label="Trimly home">
      <LogoMark />
      <span className="font-display text-[22px] font-bold tracking-tight">Trimly</span>
    </Link>
  );
}
