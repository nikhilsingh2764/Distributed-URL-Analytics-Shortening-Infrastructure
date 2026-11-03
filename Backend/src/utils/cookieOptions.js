import env from "../config/env.js";

const secure = env.isProduction || env.COOKIE_SECURE || env.COOKIE_SAME_SITE === "none";

const base = {
    httpOnly: true,
    secure,
    sameSite: env.COOKIE_SAME_SITE,
    domain: env.COOKIE_DOMAIN || undefined,
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
