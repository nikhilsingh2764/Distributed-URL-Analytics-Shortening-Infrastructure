import { Queue } from "bullmq";
import { createBullConnection } from "../config/redis.js";

export const CLICK_QUEUE = "clicks";

/** Redirects enqueue a click event here so the redirect itself never waits on MongoDB writes. */
const clickQueue = new Queue(CLICK_QUEUE, {
    connection: createBullConnection(),
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { age: 600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600, count: 5000 },
    },
});

export default clickQueue;
