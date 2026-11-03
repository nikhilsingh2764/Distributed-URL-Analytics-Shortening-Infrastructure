import api, { unwrap } from "../lib/api";
import type { Analytics, LinkQuery, Summary, UrlItem, UrlListResponse } from "../lib/types";

export interface CreateUrlInput {
  originalUrl: string;
  customAlias?: string;
  expiresAt?: string;
}

export interface UpdateUrlInput {
  originalUrl?: string;
  expiresAt?: string | null;
}

export const urlService = {
  create: (body: CreateUrlInput) => unwrap<UrlItem>(api.post("/urls", body)),
  list: (params: LinkQuery) =>
    unwrap<UrlListResponse>(api.get("/urls", { params: { ...params, search: params.search || undefined } })),
  summary: () => unwrap<Summary>(api.get("/urls/summary")),
  update: (id: string, body: UpdateUrlInput) => unwrap<UrlItem>(api.patch(`/urls/${id}`, body)),
  remove: (id: string) => unwrap<null>(api.delete(`/urls/${id}`)),
  analytics: (id: string, days: number) => {
    const end = new Date();
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - (days - 1)));
    return unwrap<Analytics>(
      api.get(`/urls/${id}/analytics`, { params: { startDate: start.toISOString(), endDate: end.toISOString() } }),
    );
  },
};
