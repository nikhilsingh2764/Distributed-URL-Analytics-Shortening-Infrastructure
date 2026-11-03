/**
 * Operational error with an HTTP status code.
 * `message` should be an i18n key (e.g. "otp_invalid"); the error middleware translates it.
 */
class ApiError extends Error {
    constructor(statusCode, message = "server_error", errors = []) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;
