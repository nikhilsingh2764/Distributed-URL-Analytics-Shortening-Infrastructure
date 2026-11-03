import "dotenv/config";
import { cleanEnv, str, port, num, bool } from "envalid";

const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ["development", "production", "test"], default: "development" }),
    PORT: port({ default: 5000 }),
    BASE_URL: str({ default: "http://localhost:5000" }),
    CLIENT_URL: str({ default: "http://localhost:5173" }),
    TRUST_PROXY: num({ default: 0 }),

    MONGODB_URI: str({ desc: "MongoDB connection string" }),
    REDIS_URL: str({ default: "redis://127.0.0.1:6379" }),

    JWT_ACCESS_SECRET: str(),
    JWT_REFRESH_SECRET: str(),
    JWT_ACCESS_EXPIRES_MINUTES: num({ default: 15 }),
    JWT_REFRESH_EXPIRES_DAYS: num({ default: 7 }),
    OTP_TTL_SECONDS: num({ default: 600 }),

    COOKIE_SAME_SITE: str({ choices: ["lax", "strict", "none"], default: "lax" }),
    COOKIE_SECURE: bool({ default: false }),
    COOKIE_DOMAIN: str({ default: "" }),

    // Email is sent through Brevo's HTTP API. Leave BREVO_API_KEY empty in development to print OTPs in the log.
    BREVO_API_KEY: str({ default: "" }),
    BREVO_API_URL: str({ default: "https://api.brevo.com/v3/smtp/email" }),
    MAIL_FROM_EMAIL: str({ default: "" }), // must be a verified sender in Brevo
    MAIL_FROM_NAME: str({ default: "Trimly" }),

    SENTRY_DSN: str({ default: "" }),
    RUN_WORKERS_IN_API: bool({ default: true }),
    SWAGGER_ENABLED: bool({ default: true }),
});

if (env.BREVO_API_KEY && !env.MAIL_FROM_EMAIL) {
    throw new Error("MAIL_FROM_EMAIL is required when BREVO_API_KEY is set (use a sender verified in Brevo).");
}

if (env.isProduction) {
    const weak = [env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET].some(
        (s) => s.length < 32 || s.startsWith("change-me")
    );
    if (weak) {
        throw new Error("JWT secrets must be random strings of at least 32 characters in production.");
    }
    if (!env.BREVO_API_KEY) {
        throw new Error("BREVO_API_KEY is required in production so OTP emails can be delivered.");
    }
}

export const clientOrigins = env.CLIENT_URL.split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
export const baseUrl = env.BASE_URL.replace(/\/$/, "");

export default env;
