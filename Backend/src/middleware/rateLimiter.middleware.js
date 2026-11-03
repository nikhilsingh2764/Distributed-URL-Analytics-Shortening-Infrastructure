import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../config/redis.js";
import ApiError from "../utils/ApiError.js";

const MINUTE = 60 * 1000;

/**
 * Every limiter shares Redis, so limits hold across multiple API instances.
 * `byUser` keys by the logged-in user (falls back to IP) — put authMiddleware BEFORE such a limiter.
 */
const createLimiter = ({ prefix, windowMs, limit, messageKey, byUser = false, skipSuccessfulRequests = false, failOpen = false }) =>
    rateLimit({
        store: new RedisStore({
            sendCommand: (...args) => redis.call(...args),
            prefix: `rl:${prefix}:`,
        }),
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        passOnStoreError: failOpen,
        keyGenerator: (req) =>
            byUser && req.user ? `u:${req.user._id}` : ipKeyGenerator(req.ip),
        handler: (_req, _res, next) => next(new ApiError(429, messageKey)),
    });

// ───────── auth ─────────
export const signupLimiter = createLimiter({ prefix: "signup", windowMs: 60 * MINUTE, limit: 10, messageKey: "rl_signup" });
export const verifyOtpLimiter = createLimiter({ prefix: "verify-otp", windowMs: 15 * MINUTE, limit: 10, messageKey: "rl_verify_otp" });
export const resendOtpLimiter = createLimiter({ prefix: "resend-otp", windowMs: 15 * MINUTE, limit: 5, messageKey: "rl_resend_otp" });
export const loginLimiter = createLimiter({ prefix: "login", windowMs: 15 * MINUTE, limit: 10, messageKey: "rl_login", skipSuccessfulRequests: true });
export const forgotPasswordLimiter = createLimiter({ prefix: "forgot", windowMs: 15 * MINUTE, limit: 5, messageKey: "rl_forgot_password" });
export const resetPasswordLimiter = createLimiter({ prefix: "reset", windowMs: 15 * MINUTE, limit: 10, messageKey: "rl_reset_password" });
export const refreshTokenLimiter = createLimiter({ prefix: "refresh", windowMs: MINUTE, limit: 30, messageKey: "rl_refresh" });
export const logoutLimiter = createLimiter({ prefix: "logout", windowMs: 5 * MINUTE, limit: 30, messageKey: "rl_logout" });
export const changePasswordLimiter = createLimiter({ prefix: "change-password", windowMs: 60 * MINUTE, limit: 5, messageKey: "rl_change_password", byUser: true });
export const sensitiveActionLimiter = createLimiter({ prefix: "sensitive", windowMs: 15 * MINUTE, limit: 5, messageKey: "rl_general", byUser: true });

// ───────── urls ─────────
export const createUrlLimiter = createLimiter({ prefix: "create-url", windowMs: 15 * MINUTE, limit: 60, messageKey: "rl_create_url", byUser: true });
// Public hot path: if Redis is unavailable, let visitors through instead of breaking every short link.
export const redirectLimiter = createLimiter({ prefix: "redirect", windowMs: MINUTE, limit: 120, messageKey: "rl_redirect", failOpen: true });
