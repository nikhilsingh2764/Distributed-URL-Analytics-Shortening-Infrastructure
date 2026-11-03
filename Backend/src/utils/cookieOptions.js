import env from "../config/env.js";

// When sameSite is "none", secure MUST be true, and domain must be omitted for cross-site cookies.
const isSameSiteNone = env.COOKIE_SAME_SITE === "none" || env.COOKIE_SAME_SITE === "None";
const secure = env.isProduction || env.COOKIE_SECURE || isSameSiteNone;

const base = {
    httpOnly: true,
    secure: secure,
    sameSite: env.COOKIE_SAME_SITE || "lax",
    // CRITICAL: Do NOT set domain if your frontend and backend are on different domains (e.g. Vercel -> Render)
    // Only include domain if you are on subdomains of the same root domain (e.g. api.mydomain.com and app.mydomain.com)
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
};

const accessCookie = { ...base, path: "/" };
// The refresh cookie is only ever sent to the auth endpoints.
const refreshCookie = { ...base, path: "/api/v1/auth" };

export const accessTokenOptions = {
    ...accessCookie,
    maxAge: env.JWT_ACCESS_EXPIRES_MINUTES * 60 * 1000,
};

export const refreshTokenOptions = {
    ...refreshCookie,
    maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
};

// clearCookie must use the same path/domain/flags, but without maxAge.
export const accessTokenClearOptions = accessCookie;
export const refreshTokenClearOptions = refreshCookie;
