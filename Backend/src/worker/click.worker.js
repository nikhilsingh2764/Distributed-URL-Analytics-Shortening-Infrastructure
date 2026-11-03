import { Worker } from "bullmq";
import { createBullConnection } from "../config/redis.js";
import logger from "../config/logger.js";
import { CLICK_QUEUE } from "../queues/click.queue.js";
import clickRepository from "../repository/clickRepository/click.repository.js";
import urlRepository from "../repository/urlRepository/url.repository.js";

export const startClickWorker = () => {
    const worker = new Worker(
        CLICK_QUEUE,
        async (job) => {
            const { urlId, at, ...details } = job.data;
            const when = new Date(at);
            await clickRepository.create({ urlId, ...details, createdAt: when });
            await urlRepository.recordClick(urlId, when);
        },
        { connection: createBullConnection(), concurrency: 20 }
    );

    worker.on("failed", (job, error) =>
        logger.error({ jobId: job?.id, err: error }, "click job failed")
    );
    worker.on("error", (error) => logger.error({ err: error }, "click worker error"));
    return worker;
};
