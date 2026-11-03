export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface UrlItem {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  clicks: number;
  lastClickedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UrlListResponse {
  urls: UrlItem[];
  pagination: Pagination;
}

export interface DailyPoint {
  date: string;
  clicks: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface Summary {
  totalLinks: number;
  activeLinks: number;
  expiredLinks: number;
  totalClicks: number;
  clicksLast14Days: number;
  daily: DailyPoint[];
  topLinks: UrlItem[];
}

export interface RecentClick {
  browser: string;
  os: string;
  device: string;
  country: string;
  referrer: string;
  createdAt: string;
}

export interface Analytics {
  url: UrlItem;
  range: { startDate: string; endDate: string };
  totals: { allTime: number; inRange: number; uniqueVisitors: number; today: number };
  daily: DailyPoint[];
  browsers: LabelCount[];
  os: LabelCount[];
  devices: LabelCount[];
  countries: LabelCount[];
  referrers: LabelCount[];
  recent: RecentClick[];
}

export type LinkStatus = "all" | "active" | "expired";
export type LinkSort = "createdAt" | "clicks" | "expiresAt";

export interface LinkQuery {
  page: number;
  limit: number;
  search: string;
  status: LinkStatus;
  sort: LinkSort;
  order: "asc" | "desc";
}
