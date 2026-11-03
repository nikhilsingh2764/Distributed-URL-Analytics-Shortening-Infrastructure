import crypto from "crypto";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const signAccessToken = (userId) =>
    jwt.sign({ sub: String(userId) }, env.JWT_ACCESS_SECRET, {
        expiresIn: `${env.JWT_ACCESS_EXPIRES_MINUTES}m`,
    });

// `jti` makes every refresh token unique even if two are issued in the same second.
export const signRefreshToken = (userId) =>
    jwt.sign({ sub: String(userId), jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
        expiresIn: `${env.JWT_REFRESH_EXPIRES_DAYS}d`,
    });

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);
