import bcrypt from "bcrypt";
import redis from "../../config/redis.js";
import env from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";
import generateOtp from "../../utils/generateOtp.js";
import { hmac, safeEqual, sha256 } from "../../utils/crypto.js";
import { cacheDel } from "../../utils/cache.js";
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from "../../utils/generateToken.js";

import userRepository from "../../repository/authRepository/auth.repository.js";
import refreshTokenRepository from "../../repository/authRepository/refreshToken.repository.js";
import urlRepository from "../../repository/urlRepository/url.repository.js";
import clickRepository from "../../repository/clickRepository/click.repository.js";
import emailQueue from "../../queues/email.queue.js";

const SALT_ROUNDS = 12;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// Used to burn the same CPU time when the email doesn't exist, so response time doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

const signupKey = (email) => `signup:${email}`;
const resetKey = (email) => `reset:${email}`;
const cooldownKey = (kind, email) => `cooldown:${kind}:${email}`;

const toUserDto = (user) => ({
    id: String(user._id),
    username: user.username,
    email: user.email,
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
});

// ───────── OTP helpers ─────────

const otpHash = (email, otp) => hmac(`${email}:${otp}`);

/** Starts a cooldown; throws 429 if one is already running. */
const enforceCooldown = async (kind, email) => {
    const ok = await redis.set(cooldownKey(kind, email), "1", "EX", OTP_RESEND_COOLDOWN_SECONDS, "NX");
    if (!ok) throw new ApiError(429, "otp_cooldown");
};

/** Checks an OTP stored under `key`; deletes the record after too many wrong guesses. */
const checkOtp = async (key, email, otp, expiredError) => {
    const raw = await redis.get(key);
    if (!raw) throw new ApiError(400, expiredError);

    const record = JSON.parse(raw);

    if (!safeEqual(record.otpHash, otpHash(email, otp))) {
        record.attempts = (record.attempts || 0) + 1;
        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            await redis.del(key);
            throw new ApiError(429, "otp_attempts_exceeded");
        }
        const ttl = await redis.ttl(key);
        if (ttl > 0) await redis.set(key, JSON.stringify(record), "EX", ttl);
        throw new ApiError(400, "otp_invalid");
    }
    return record;
};

// ───────── sessions ─────────

const issueSession = async (user, userAgent) => {
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    await refreshTokenRepository.create({
        userId: user._id,
        tokenHash: sha256(refreshToken),
        userAgent: userAgent?.slice(0, 300),
        expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
};

// ───────── signup flow ─────────

export const signupService = async ({ username, email, password }) => {
    const existing = await userRepository.findByUsernameOrEmail(username, email);
    if (existing) {
        throw new ApiError(409, existing.email === email ? "email_taken" : "username_taken");
    }

    await enforceCooldown("signup", email);

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await redis.set(
        signupKey(email),
        JSON.stringify({ username, email, passwordHash, otpHash: otpHash(email, otp), attempts: 0 }),
        "EX",
        env.OTP_TTL_SECONDS
    );

    await emailQueue.add("sendOtp", { email, username, otp });

    return { email };
};

export const resendOtpService = async ({ email }) => {
    const raw = await redis.get(signupKey(email));
    if (!raw) throw new ApiError(400, "signup_expired");

    await enforceCooldown("signup", email);

    const record = JSON.parse(raw);
    const otp = generateOtp();

    await redis.set(
        signupKey(email),
        JSON.stringify({ ...record, otpHash: otpHash(email, otp), attempts: 0 }),
        "EX",
        env.OTP_TTL_SECONDS
    );

    await emailQueue.add("sendOtp", { email, username: record.username, otp });

    return { email };
};

export const verifyOtpService = async ({ email, otp }) => {
    const record = await checkOtp(signupKey(email), email, otp, "otp_expired");

    let user;
    try {
        user = await userRepository.create({
            username: record.username,
            email: record.email,
            password: record.passwordHash,
            isVerified: true,
        });
    } catch (error) {
        if (error.code === 11000) throw new ApiError(409, "user_exists");
        throw error;
    }

    await redis.del(signupKey(email));
    await emailQueue.add("welcomeEmail", { email: user.email, username: user.username });

    return toUserDto(user);
};

// ───────── login / session ─────────

export const loginService = async ({ email, password }, userAgent) => {
    const user = await userRepository.findByEmailWithPassword(email);

    const passwordMatches = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
    if (!user || !passwordMatches) throw new ApiError(401, "invalid_credentials");

    // Checked only AFTER the password matched, so these states can't be probed by strangers.
    if (!user.isVerified) throw new ApiError(403, "email_not_verified");
    if (!user.isActive) throw new ApiError(403, "account_is_deactivated");

    const tokens = await issueSession(user, userAgent);
    await userRepository.setLastLogin(user._id);

    return { user: toUserDto(user), ...tokens };
};

export const refreshAccessTokenService = async (refreshToken, userAgent) => {
    if (!refreshToken) throw new ApiError(401, "refresh_token_missing");

    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new ApiError(401, "invalid_refresh_token");
    }

    // One-time use: the token is deleted as it is read.
    const stored = await refreshTokenRepository.consumeByHash(sha256(refreshToken));
    if (!stored) {
        // A valid JWT that is no longer stored means it was already used → likely stolen. Kill every session.
        await refreshTokenRepository.deleteByUserId(decoded.sub);
        throw new ApiError(401, "invalid_refresh_token");
    }

    const user = await userRepository.findById(decoded.sub);
    if (!user || !user.isActive) throw new ApiError(401, "unauthorized");

    return issueSession(user, userAgent);
};

export const logoutService = async (refreshToken, { allDevices = false, userId } = {}) => {
    if (allDevices && userId) {
        await refreshTokenRepository.deleteByUserId(userId);
    } else if (refreshToken) {
        await refreshTokenRepository.deleteByHash(sha256(refreshToken));
    }
};

export const profileService = async (user) => toUserDto(user);

// ───────── account management ─────────

export const updateProfileService = async (userId, { username }) => {
    if (await userRepository.usernameExists(username, userId)) {
        throw new ApiError(409, "username_taken");
    }

    let user;
    try {
        user = await userRepository.updateProfile(userId, { username });
    } catch (error) {
        if (error.code === 11000) throw new ApiError(409, "username_taken");
        throw error;
    }
    if (!user) throw new ApiError(404, "user_not_found");
    return toUserDto(user);
};

export const changePasswordService = async (userId, { currentPassword, newPassword }, userAgent) => {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw new ApiError(404, "user_not_found");

    if (!(await bcrypt.compare(currentPassword, user.password))) {
        throw new ApiError(400, "wrong_password");
    }
    if (currentPassword === newPassword) throw new ApiError(400, "password_same_as_old");

    await userRepository.setPassword(userId, await bcrypt.hash(newPassword, SALT_ROUNDS));

    // Sign out every other device, but keep this one signed in with a fresh session.
    await refreshTokenRepository.deleteByUserId(userId);
    return issueSession(user, userAgent);
};

export const deactivateAccountService = async (userId) => {
    const user = await userRepository.deactivate(userId);
    if (!user) throw new ApiError(404, "user_not_found");
    await refreshTokenRepository.deleteByUserId(userId);
};

export const deleteAccountService = async (userId, password) => {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw new ApiError(404, "user_not_found");

    if (!(await bcrypt.compare(password, user.password))) throw new ApiError(400, "wrong_password");

    // Remove everything the user owns: links, their click history, cached redirects, sessions.
    const urls = await urlRepository.findIdsAndCodesByUserId(userId);
    if (urls.length > 0) {
        await clickRepository.deleteByUrlIds(urls.map((u) => u._id));
        await cacheDel(...urls.map((u) => `redirect:${u.shortCode}`));
    }
    await urlRepository.deleteAllByUserId(userId);
    await refreshTokenRepository.deleteByUserId(userId);
    await userRepository.deleteById(userId);
};

// ───────── forgot / reset password ─────────

export const forgotPasswordService = async ({ email }) => {
    // Always answer the same way so the endpoint can't be used to discover registered emails.
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isVerified || !user.isActive) return;

    try {
        await enforceCooldown("reset", email);
    } catch {
        return; // cooldown running: stay silent
    }

    const otp = generateOtp();
    await redis.set(
        resetKey(email),
        JSON.stringify({ otpHash: otpHash(email, otp), attempts: 0 }),
        "EX",
        env.OTP_TTL_SECONDS
    );

    await emailQueue.add("resetPasswordOtp", { email, otp });
};

export const resetPasswordService = async ({ email, otp, newPassword }) => {
    await checkOtp(resetKey(email), email, otp, "otp_expired");

    const user = await userRepository.findByEmail(email);
    if (!user) throw new ApiError(400, "otp_expired");

    await userRepository.setPassword(user._id, await bcrypt.hash(newPassword, SALT_ROUNDS));
    await redis.del(resetKey(email));
    await refreshTokenRepository.deleteByUserId(user._id);
};
