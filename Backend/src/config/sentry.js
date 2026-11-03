import * as Sentry from "@sentry/node";
import env from "./env.js";

// Sentry is optional: it only starts when SENTRY_DSN is set.
export const sentryEnabled = Boolean(env.SENTRY_DSN);

if (sentryEnabled) {
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        tracesSampleRate: env.isProduction ? 0.1 : 1.0,
    });
}

export default Sentry;
