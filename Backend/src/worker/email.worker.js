import { Worker } from "bullmq";
import { createBullConnection } from "../config/redis.js";
import logger from "../config/logger.js";
import { EMAIL_QUEUE } from "../queues/email.queue.js";
import {
    sendOTPEmail,
    sendResetPasswordEmail,
    sendWelcomeEmail,
} from "../service/authService/email.service.js";

export const startEmailWorker = () => {
    const worker = new Worker(
        EMAIL_QUEUE,
        async (job) => {
            switch (job.name) {
                case "sendOtp":
                    return sendOTPEmail(job.data);
                case "resetPasswordOtp":
                    return sendResetPasswordEmail(job.data);
                case "welcomeEmail":
                    return sendWelcomeEmail(job.data);
                default:
                    throw new Error(`Unknown email job: ${job.name}`);
            }
        },
        { connection: createBullConnection(), concurrency: 5 }
    );

    worker.on("failed", (job, error) =>
        logger.error({ jobId: job?.id, name: job?.name, err: error }, "email job failed")
    );
    worker.on("error", (error) => logger.error({ err: error }, "email worker error"));
    return worker;
};
