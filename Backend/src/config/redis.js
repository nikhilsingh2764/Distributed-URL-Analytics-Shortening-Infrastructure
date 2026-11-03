import Redis from "ioredis";
import env from "./env.js";
import logger from "./logger.js";

/**
 * Main connection: cache, OTP storage and rate limiting.
 * Commands fail fast (3 retries) so a Redis outage degrades gracefully instead of hanging requests.
 */
const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });

redis.on("ready", () => logger.info("Redis connected"));
redis.on("error", (error) => logger.error({ err: error }, "Redis error"));

/**
 * BullMQ requires `maxRetriesPerRequest: null`, so queues and workers get their own connections.
 */
export const createBullConnection = () => {
    const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    connection.on("error", (error) => logger.error({ err: error }, "BullMQ Redis error"));
    return connection;
};

export default redis;
