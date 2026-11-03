import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import pinoHttp from "pino-http";
import mongoose from "mongoose";
import i18nextMiddleware from "i18next-http-middleware";

import env, { clientOrigins } from "./config/env.js";
import logger from "./config/logger.js";
import i18next from "./config/i18n.js";
import redis from "./config/redis.js";
import Sentry, { sentryEnabled } from "./config/sentry.js";
import errorMiddleware, { notFoundMiddleware } from "./middleware/error.middleware.js";
import { mountSwagger } from "./docs/swagger.js";

import authRoutes from "./routes/authRoutes/auth.routes.js";
import urlRoutes from "./routes/urlRoutes/url.routes.js";
import redirectRoutes from "./routes/urlRoutes/redirect.routes.js";

const app = express();

app.set("trust proxy", env.TRUST_PROXY);
app.disable("x-powered-by");

// Swagger UI ships its own inline scripts, so it is mounted before Helmet's strict CSP.
if (env.SWAGGER_ENABLED) mountSwagger(app);

app.use(helmet());

app.use(
    cors({
        origin: (origin, callback) => {
            // Same-origin / curl / server-to-server requests have no Origin header.
            if (!origin || clientOrigins.includes(origin)) return callback(null, true);
            return callback(null, false);
        },
        credentials: true,
    })
);

app.use(compression());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));
app.use(i18nextMiddleware.handle(i18next));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.get("/", (_req, res) => {
    res.json({ message: "URL Shortener API is running", docs: env.SWAGGER_ENABLED ? "/api/docs" : null });
});

app.get("/health", async (_req, res) => {
    const redisOk = await redis.ping().then((r) => r === "PONG", () => false);
    const mongoOk = mongoose.connection.readyState === 1;
    res.status(mongoOk && redisOk ? 200 : 503).json({
        status: mongoOk && redisOk ? "ok" : "degraded",
        mongo: mongoOk ? "up" : "down",
        redis: redisOk ? "up" : "down",
        uptime: Math.round(process.uptime()),
    });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/urls", urlRoutes);
app.use("/r", redirectRoutes);

app.use(notFoundMiddleware);
if (sentryEnabled) Sentry.setupExpressErrorHandler(app);
app.use(errorMiddleware); // global error handler — always last

export default app;
