import crypto from "crypto";
import env from "../config/env.js";

export const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

/** Keyed hash, used for OTPs and anonymous visitor ids. */
export const hmac = (value) =>
    crypto.createHmac("sha256", env.JWT_ACCESS_SECRET).update(String(value)).digest("hex");

export const safeEqual = (a, b) => {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
};
