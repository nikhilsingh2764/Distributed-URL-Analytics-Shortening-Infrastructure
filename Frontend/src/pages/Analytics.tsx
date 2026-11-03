import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, MousePointerClick } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BarList, ClicksChart } from "../components/charts";
import CopyButton from "../components/CopyButton";
import { Badge, EmptyState, ErrorNotice, Skeleton } from "../components/ui/Misc";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getErrorMessage } from "../lib/api";
import { cn, countryName, formatDate, formatDateTime, formatNumber, stripProtocol } from "../lib/utils";
import { urlService } from "../services/urls";

const RANGES = [7, 30, 90] as const;

export default function Analytics() {
  const { id = "" } = useParams();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["analytics", id, days],
    queryFn: () => urlService.analytics(id, days),
    enabled: !!id,
  });
  useDocumentTitle(data ? `/${data.url.shortCode}` : "Analytics");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All links
      </Link>

      {isError ? (
        <ErrorNotice message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : isPending ? (
        <Loading />
      ) : (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="link-code truncate text-2xl font-bold sm:text-3xl" style={{ fontFamily: "inherit" }}>
                  <span className="font-display">{stripProtocol(data.url.shortUrl)}</span>
                </h1>
                <CopyButton text={data.url.shortUrl} />
                {data.url.isExpired && <Badge tone="warn">Expired</Badge>}
              </div>
              <a href={data.url.originalUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm text-muted hover:text-ink">
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{data.url.originalUrl}</span>
              </a>
              <p className="mt-1 text-xs text-muted">Created {formatDate(data.url.createdAt)}{data.url.expiresAt && ` · expires ${formatDateTime(data.url.expiresAt)}`}</p>
            </div>

            <div role="group" aria-label="Date range" className="inline-flex rounded-lg border border-line bg-surface p-1 self-start sm:self-auto">
              {RANGES.map((r) => (
                <button key={r} onClick={() => setDays(r)} aria-pressed={days === r} className={cn("rounded-md px-3.5 py-1.5 text-sm font-medium transition", days === r ? "bg-primary text-primary-ink" : "text-muted hover:text-ink")}>
                  {r}d
                </button>
              ))}
            </div>
          </header>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
            {[
              [`Clicks (${days}d)`, data.totals.inRange],
              ["Unique visitors", data.totals.uniqueVisitors],
              ["Today (UTC)", data.totals.today],
              ["All time", data.totals.allTime],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface p-5">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-1 font-display text-3xl font-bold tabular-nums">{formatNumber(Number(value))}</dd>
              </div>
            ))}
          </dl>

          <section aria-label="Clicks over time" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Clicks over time</h2>
            {data.totals.inRange === 0 ? (
              <EmptyState icon={<MousePointerClick className="size-5" />} title="No clicks in this range yet">
                Share the short link and visits will appear here within a few seconds. Bots and link-preview crawlers aren't counted.
              </EmptyState>
            ) : (
              <ClicksChart data={data.daily} height={280} />
            )}
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Referrers"><BarList items={data.referrers} /></Panel>
            <Panel title="Countries">
              <BarList items={data.countries} kind="country" />
              {data.countries.length === 1 && data.countries[0].label === "Unknown" && (
                <p className="mt-4 text-xs text-muted">Country needs a CDN or proxy that sends a country header (Cloudflare, Vercel, CloudFront).</p>
              )}
            </Panel>
            <Panel title="Browsers"><BarList items={data.browsers} /></Panel>
            <Panel title="Operating systems"><BarList items={data.os} /></Panel>
            <Panel title="Devices"><BarList items={data.devices} /></Panel>

            <Panel title="Recent clicks">
              {data.recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">Nothing yet.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {data.recent.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                      <span className="min-w-0 truncate">{c.browser} · {c.os} · {countryName(c.country)}</span>
                      <time dateTime={c.createdAt} className="shrink-0 text-xs text-muted">{formatDateTime(c.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Loading() {
  return (
    <div className="space-y-6" aria-busy>
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
