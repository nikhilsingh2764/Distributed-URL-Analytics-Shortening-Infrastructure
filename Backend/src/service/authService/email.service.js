import env, { clientOrigins } from "../../config/env.js";
import logger from "../../config/logger.js";
import { UnrecoverableError } from "bullmq";
import { mailConfigured } from "../../config/mail.js";
import otpTemplate from "../../templates/otp.template.js";
import resetPasswordTemplate from "../../templates/resetPassword.template.js";
import welcomeTemplate from "../../templates/welcome.template.js";

const otpMinutes = Math.round(env.OTP_TTL_SECONDS / 60);

/**
 * Sends one transactional email through Brevo's REST API (POST /v3/smtp/email).
 * Failures throw so BullMQ retries them: network errors, 429 and 5xx are retried; other 4xx
 * (bad API key, unverified sender, invalid address) can't succeed on retry, so they fail immediately.
 */
const deliver = async ({ to, subject, html, devNote }) => {
    if (!mailConfigured) {
        // No Brevo key (local development): print instead of failing, so signup can still be tested.
        logger.warn(`[mail disabled] To: ${to} | ${subject} | ${devNote}`);
        return null;
    }

    const response = await fetch(env.BREVO_API_URL, {
        method: "POST",
        headers: {
            "api-key": env.BREVO_API_KEY,
            "content-type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify({
            sender: { name: env.MAIL_FROM_NAME, email: env.MAIL_FROM_EMAIL },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        const detail = (await response.text().catch(() => "")).slice(0, 300);
        const message = `Brevo API responded ${response.status}: ${detail}`;
        const retryable = response.status === 429 || response.status >= 500;
        throw retryable ? new Error(message) : new UnrecoverableError(message);
    }

    const data = await response.json().catch(() => ({}));
    logger.info({ messageId: data.messageId, to }, "email sent via Brevo");
    return data;
};

export const sendOTPEmail = ({ email, username, otp }) =>
    deliver({
        to: email,
        subject: "Verify your email",
        html: otpTemplate(username, otp, otpMinutes),
        devNote: `OTP: ${otp}`,
    });

export const sendResetPasswordEmail = ({ email, otp }) =>
    deliver({
        to: email,
        subject: "Reset your password",
        html: resetPasswordTemplate(otp, otpMinutes),
        devNote: `RESET OTP: ${otp}`,
    });

export const sendWelcomeEmail = ({ email, username }) =>
    deliver({
        to: email,
        subject: "Welcome to Trimly",
        html: welcomeTemplate(username, clientOrigins[0]),
        devNote: "welcome",
    });
