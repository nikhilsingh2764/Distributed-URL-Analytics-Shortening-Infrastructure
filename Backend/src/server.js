import "./config/env.js"; // loads .env and validates it first
import "./config/sentry.js"; // Sentry must initialise before the rest of the app
import mongoose from "mongoose";

import app from "./app.js";
import env from "./config/env.js";
import connectDB from "./config/DB.js";
import logger from "./config/logger.js";
import redis from "./config/redis.js";
import emailQueue from "./queues/email.queue.js";
import clickQueue from "./queues/click.queue.js";
import { startEmailWorker } from "./worker/email.worker.js";
import { startClickWorker } from "./worker/click.worker.js";

process.on("uncaughtException", (error) => {
    logger.fatal(error, "Uncaught exception");
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    logger.fatal(reason, "Unhandled rejection");
    process.exit(1);
});

const workers = [];
let server;

const shutdown = async (signal) => {
    logger.info(`${signal} received: shutting down gracefully`);
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();

    try {
        if (server) await new Promise((resolve) => server.close(resolve));
        await Promise.all(workers.map((w) => w.close()));
        await Promise.all([emailQueue.close(), clickQueue.close()]);
        await mongoose.disconnect();
        redis.disconnect();
        process.exit(0);
    } catch (error) {
        logger.error(error, "error during shutdown");
        process.exit(1);
    }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

const startServer = async () => {
    try {
        await connectDB();
        await redis.ping(); // fail fast if Redis is unreachable

        if (env.RUN_WORKERS_IN_API) {
            workers.push(startEmailWorker(), startClickWorker());
            logger.info("Background workers running inside the API process");
        }

        server = app.listen(env.PORT, () => {
            logger.info(`API listening on http://localhost:${env.PORT}`);
            if (env.SWAGGER_ENABLED) logger.info(`API docs: http://localhost:${env.PORT}/api/docs`);
        });
    } catch (error) {
        logger.error(error, "failed to start server");
        process.exit(1);
    }
};

startServer();
