import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { BarChart3, ChevronLeft, ChevronRight, ExternalLink, Link2Off, Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useDebounce } from "../hooks/useDebounce";
import { getErrorMessage } from "../lib/api";
import type { LinkQuery, LinkSort, LinkStatus, UrlItem } from "../lib/types";
import { formatCompact, formatDate, stripProtocol, timeAgo } from "../lib/utils";
import { urlService } from "../services/urls";
import CopyButton from "./CopyButton";
import EditLinkModal from "./EditLinkModal";
import Button from "./ui/Button";
import ConfirmDialog from "./ui/ConfirmDialog";
import { Badge, EmptyState, ErrorNotice, Skeleton } from "./ui/Misc";

const PAGE_SIZE = 8;

export default function LinksList() {
  const qc = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LinkStatus>("all");
  const [sortKey, setSortKey] = useState<`${LinkSort}:${"asc" | "desc"}`>("createdAt:desc");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<UrlItem | null>(null);
  const [deleting, setDeleting] = useState<UrlItem | null>(null);

  const debounced = useDebounce(search.trim(), 300);
  const [sort, order] = sortKey.split(":") as [LinkSort, "asc" | "desc"];
  const query: LinkQuery = { page, limit: PAGE_SIZE, search: debounced, status, sort, order };

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["urls", query],
    queryFn: () => urlService.list(query),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id: string) => urlService.remove(id),
    onSuccess: () => {
      toast.success("Link deleted.");
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ["urls"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const filtersActive = !!debounced || status !== "all";
  const resetPage = () => setPage(1);
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <section aria-labelledby="links-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="links-heading" className="text-lg font-semibold">
          All links {data && <span className="ml-1 text-sm font-normal text-muted">({data.pagination.total})</span>}
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:flex-none">
            <label htmlFor="link-search" className="sr-only">Search links</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="link-search" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} placeholder="Search links" className="field-input h-9 py-0 pl-9 text-sm" />
          </div>
          <label className="sr-only" htmlFor="link-status">Status</label>
          <select id="link-status" value={status} onChange={(e) => { setStatus(e.target.value as LinkStatus); resetPage(); }} className="field-input h-9 w-auto py-0 text-sm">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          <label className="sr-only" htmlFor="link-sort">Sort</label>
          <select id="link-sort" value={sortKey} onChange={(e) => { setSortKey(e.target.value as typeof sortKey); resetPage(); }} className="field-input h-9 w-auto py-0 text-sm">
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="clicks:desc">Most clicks</option>
            <option value="clicks:asc">Fewest clicks</option>
          </select>
        </div>
      </div>

      {isError ? (
        <ErrorNotice message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : isPending ? (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface" aria-busy>
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="space-y-2 p-5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-3/4" /></li>
          ))}
        </ul>
      ) : data.urls.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface">
          <EmptyState
            icon={<Link2Off className="size-5" />}
            title={filtersActive ? "No links match" : "No links yet"}
            action={filtersActive ? <Button variant="secondary" onClick={() => { setSearch(""); setStatus("all"); resetPage(); }}>Clear filters</Button> : undefined}
          >
            {filtersActive ? "Try a different search or filter." : "Paste your first long link above and it will show up here."}
          </EmptyState>
        </div>
      ) : (
        <ul className={`divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface transition-opacity ${isFetching ? "opacity-70" : ""}`}>
          {data.urls.map((link) => (
            <li key={link.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <a href={link.shortUrl} target="_blank" rel="noreferrer" className="link-code truncate font-medium text-primary hover:underline" title={link.shortUrl}>
                    {stripProtocol(link.shortUrl)}
                  </a>
                  <CopyButton text={link.shortUrl} className="-my-1" />
                  {link.isExpired ? <Badge tone="warn">Expired</Badge> : link.expiresAt ? <Badge>Expires {formatDate(link.expiresAt)}</Badge> : null}
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted" title={link.originalUrl}>
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{stripProtocol(link.originalUrl)}</span>
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="font-display text-xl font-semibold tabular-nums leading-none">{formatCompact(link.clicks)}</p>
                  <p className="mt-1 text-xs text-muted">{link.lastClickedAt ? `last ${timeAgo(link.lastClickedAt)}` : `created ${formatDate(link.createdAt)}`}</p>
                </div>
                <div className="flex items-center">
                  <Link to={`/links/${link.id}`} aria-label={`Analytics for ${link.shortCode}`} title="Analytics" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-primary">
                    <BarChart3 className="size-[18px]" />
                  </Link>
                  <button onClick={() => setEditing(link)} aria-label={`Edit ${link.shortCode}`} title="Edit" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink">
                    <Pencil className="size-[17px]" />
                  </button>
                  <button onClick={() => setDeleting(link)} aria-label={`Delete ${link.shortCode}`} title="Delete" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger">
                    <Trash2 className="size-[17px]" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-muted">Page {data.pagination.page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={<ChevronLeft className="size-4" />}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="size-4" /></Button>
          </div>
        </nav>
      )}

      <EditLinkModal link={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete this link?"
        confirmLabel="Delete link"
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        description={<>
          <span className="link-code font-medium text-ink">{deleting && stripProtocol(deleting.shortUrl)}</span> will stop working immediately and its click history will be erased. This can't be undone.
        </>}
      />
    </section>
  );
}
