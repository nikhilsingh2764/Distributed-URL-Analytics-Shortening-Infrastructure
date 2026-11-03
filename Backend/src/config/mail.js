import env from "./env.js";

/** True when a Brevo API key is configured. Otherwise emails are only logged (development). */
export const mailConfigured = Boolean(env.BREVO_API_KEY);
