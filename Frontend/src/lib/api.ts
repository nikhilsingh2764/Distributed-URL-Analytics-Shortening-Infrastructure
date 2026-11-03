import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiEnvelope, FieldError } from "./types";

export const API_URL: string = import.meta.env.VITE_API_URL || "/api/v1";

/** Origin that serves /api/docs and /health (derived from VITE_API_URL). */
export const API_ORIGIN: string = /^https?:\/\//.test(API_URL) ? new URL(API_URL).origin : "";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // the session lives in HttpOnly cookies — JS never sees the tokens
  headers: { "Content-Type": "application/json" },
});

// ───────── silent session refresh ─────────
// On a 401 we call /auth/refresh-token once, then replay the failed request.
// Several simultaneous 401s share ONE refresh call (refresh tokens are single-use).

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const NO_REFRESH = ["/auth/login", "/auth/signup", "/auth/verify-otp", "/auth/resend-otp", "/auth/refresh-token", "/auth/logout", "/auth/forgot-password", "/auth/reset-password"];

let refreshing: Promise<void> | null = null;

const refreshSession = () => {
  if (!refreshing) {
    refreshing = api
      .post("/auth/refresh-token")
      .then(() => undefined)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const url = original?.url ?? "";

    if (error.response?.status === 401 && original && !original._retried && !NO_REFRESH.some((p) => url.includes(p))) {
      original._retried = true;
      try {
        await refreshSession();
        return api(original);
      } catch {
        window.dispatchEvent(new Event("auth:expired"));
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// ───────── helpers ─────────

export const unwrap = async <T>(request: Promise<{ data: ApiEnvelope<T> }>): Promise<T> => (await request).data.data;

export const getErrorMessage = (error: unknown, fallback = "Something went wrong. Please try again."): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Can't reach the server. Check your connection and try again.";
    const body = error.response.data as Partial<ApiEnvelope<unknown>> | undefined;
    if (body?.message) return body.message;
  }
  return fallback;
};

/** Field-level validation messages from a 400 response, keyed by field name. */
export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (!axios.isAxiosError(error)) return {};
  const errors = (error.response?.data as { errors?: FieldError[] } | undefined)?.errors;
  if (!Array.isArray(errors)) return {};
  return errors.reduce<Record<string, string>>((acc, e) => {
    if (e.field && !acc[e.field]) acc[e.field] = e.message;
    return acc;
  }, {});
};
