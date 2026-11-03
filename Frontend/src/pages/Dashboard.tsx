import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClicksChart } from "../components/charts";
import CreateLinkForm from "../components/CreateLinkForm";
import LinksList from "../components/LinksList";
import { ErrorNotice, Skeleton } from "../components/ui/Misc";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getErrorMessage } from "../lib/api";
import { formatCompact, formatNumber, stripProtocol } from "../lib/utils";
import { urlService } from "../services/urls";

export default function Dashboard() {
  useDocumentTitle("Links");
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: ["summary"], queryFn: urlService.summary });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold">Hi, {user?.username}</h1>
        <p className="mt-1 text-muted">Here's how your links are doing.</p>
      </div>

      {isError ? (
        <ErrorNotice message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section aria-label="Clicks, last 14 days" className="rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:col-span-2">
            <p className="text-sm font-medium text-muted">Clicks · last 14 days</p>
            {isPending ? (
              <><Skeleton className="mt-3 h-10 w-28" /><Skeleton className="mt-4 h-40 w-full" /></>
            ) : (
              <>
                <p className="mt-1 font-display text-5xl font-bold tabular-nums">{formatNumber(data.clicksLast14Days)}</p>
                <div className="-mx-1 mt-3">
                  <ClicksChart data={data.daily} height={150} compact />
                </div>
              </>
            )}
          </section>

          <section aria-label="Totals" className="flex flex-col rounded-2xl border border-line bg-surface p-5 sm:p-6">
            {isPending ? (
              <div className="space-y-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            ) : (
              <>
                <dl className="divide-y divide-line text-sm">
                  {[
                    ["Total clicks", formatCompact(data.totalClicks)],
                    ["Links", formatNumber(data.totalLinks)],
                    ["Active", formatNumber(data.activeLinks)],
                    ["Expired", formatNumber(data.expiredLinks)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between py-2.5 first:pt-0">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-display text-xl font-semibold tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
                {data.topLinks.some((l) => l.clicks > 0) && (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Top links</p>
                    <ul className="space-y-1.5">
                      {data.topLinks.filter((l) => l.clicks > 0).slice(0, 3).map((l) => (
                        <li key={l.id}>
                          <Link to={`/links/${l.id}`} className="flex items-center justify-between gap-3 rounded-md text-sm hover:text-primary">
                            <span className="link-code truncate">{stripProtocol(l.shortUrl)}</span>
                            <span className="tabular-nums text-muted">{formatCompact(l.clicks)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      <CreateLinkForm />
      <LinksList />
    </div>
  );
}
