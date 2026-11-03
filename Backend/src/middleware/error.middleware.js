import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";
import env from "../config/env.js";

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

export const notFoundMiddleware = (_req, _res, next) => next(new ApiError(404, "route_not_found"));

const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message;
    let errors = err.errors || [];

    // Translate well-known library errors into clean API errors.
    if (err.type === "entity.parse.failed") {
        statusCode = 400;
        message = "invalid_json";
    } else if (err.type === "entity.too.large") {
        statusCode = 413;
        message = "payload_too_large";
    } else if (err.code === 11000) {
        statusCode = 409;
        message = "duplicate_value";
    } else if (err.name === "CastError") {
        statusCode = 400;
        message = "invalid_id";
    } else if (err.name === "ValidationError" && err.errors && !(err instanceof ApiError)) {
        statusCode = 400;
        message = "validation_failed";
        errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    }

    const isOperational = statusCode < 500;
    if (!isOperational) {
        logger.error({ err, path: req.originalUrl }, "unhandled error");
        message = "server_error";
        errors = [];
    }

    // i18n keys are translated; free-form messages (validation text) pass through untouched.
    if (typeof message === "string" && KEY_PATTERN.test(message) && typeof req.t === "function") {
        message = req.t(message, { defaultValue: message });
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
        ...(env.isDev && !isOperational ? { stack: err.stack } : {}),
    });
};

export default errorMiddleware;
