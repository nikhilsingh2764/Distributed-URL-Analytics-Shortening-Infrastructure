import { clsx, type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const shortFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const numFmt = new Intl.NumberFormat();
const compactFmt = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const formatShortDate = (iso: string) => shortFmt.format(new Date(iso.length === 10 ? `${iso}T00:00:00` : iso));
export const formatNumber = (n: number) => numFmt.format(n);
export const formatCompact = (n: number) => (n >= 10_000 ? compactFmt.format(n) : numFmt.format(n));

export const timeAgo = (iso: string): string => {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(-Math.round(seconds / size), unit);
  }
  return "just now";
};

/** "https://example.com/a/b?c=1" -> "example.com/a/b?c=1" */
export const stripProtocol = (url: string) => url.replace(/^https?:\/\//, "");

export const countryName = (code: string): string => {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  try {
    return new Intl.DisplayNames(undefined, { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** <input type="datetime-local"> value (local time) -> ISO string */
export const localInputToIso = (value: string) => new Date(value).toISOString();

/** ISO string -> value for <input type="datetime-local"> in the user's timezone */
export const isoToLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const nowLocalInput = () => isoToLocalInput(new Date(Date.now() + 60_000).toISOString());

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / older browsers.
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
};

export const PASSWORD_RULES = [
  { id: "len", label: "8–72 characters", test: (v: string) => v.length >= 8 && v.length <= 72 },
  { id: "upper", label: "An uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "lower", label: "A lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { id: "digit", label: "A number", test: (v: string) => /[0-9]/.test(v) },
  { id: "symbol", label: "A special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export const isStrongPassword = (v: string) => PASSWORD_RULES.every((r) => r.test(v));
