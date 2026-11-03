import redis from "../config/redis.js";
import logger from "../config/logger.js";

/**
 * Cache helpers that never throw: if Redis is down the app keeps working from MongoDB.
 * (Do NOT use these for security-critical data like OTPs.)
 */
export const cacheGet = async (key) => {
    try {
        return await redis.get(key);
    } catch (error) {
        logger.warn({ err: error, key }, "cache get failed");
        return null;
    }
};

export const cacheSet = async (key, value, ttlSeconds) => {
    try {
        await redis.set(key, value, "EX", Math.max(1, Math.floor(ttlSeconds)));
    } catch (error) {
        logger.warn({ err: error, key }, "cache set failed");
    }
};

export const cacheDel = async (...keys) => {
    if (keys.length === 0) return;
    try {
        await redis.del(...keys);
    } catch (error) {
        logger.warn({ err: error, keys }, "cache delete failed");
    }
};
