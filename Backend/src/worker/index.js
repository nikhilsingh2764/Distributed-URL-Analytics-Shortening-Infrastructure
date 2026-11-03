// Standalone worker process:  npm run worker
// Use this (with RUN_WORKERS_IN_API=false on the API) when you want to scale workers separately.
import connectDB from "../config/DB.js";
import logger from "../config/logger.js";
import { startEmailWorker } from "./email.worker.js";
import { startClickWorker } from "./click.worker.js";

await connectDB();
const workers = [startEmailWorker(), startClickWorker()];
logger.info("Workers started: email, clicks");

const shutdown = async (signal) => {
    logger.info(`${signal} received, closing workers`);
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
