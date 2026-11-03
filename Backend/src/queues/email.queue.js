import { Queue } from "bullmq";
import { createBullConnection } from "../config/redis.js";

export const EMAIL_QUEUE = "email";

/** Jobs: "sendOtp" | "resetPasswordOtp" | "welcomeEmail" — consumed by worker/email.worker.js */
const emailQueue = new Queue(EMAIL_QUEUE, {
    connection: createBullConnection(),
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 3600, count: 500 },
        removeOnFail: { age: 7 * 24 * 3600, count: 1000 },
    },
});

export default emailQueue;
