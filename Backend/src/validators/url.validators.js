import { body, param, query } from "express-validator";
import { baseUrl } from "../config/env.js";

export const RESERVED_ALIASES = ["api", "r", "docs", "health", "admin", "login", "register", "dashboard", "assets", "static"];

const urlField = (required) => {
    let chain = body("originalUrl");
    chain = required
        ? chain.trim().notEmpty().withMessage("Original URL is required").bail()
        : chain.optional().trim();
    return chain
        .isLength({ max: 2048 }).withMessage("URL is too long (max 2048 characters)").bail()
        .isURL({ protocols: ["http", "https"], require_protocol: true, require_valid_protocol: true })
        .withMessage("Enter a valid http:// or https:// URL").bail()
        .custom((value) => {
            // Prevent redirect loops: a short link pointing back at this service.
            if (new URL(value).host === new URL(baseUrl).host) {
                throw new Error("You can't shorten a link that points to this service");
            }
            return true;
        });
};

const expiresAtField = (nullable) =>
    body("expiresAt")
        .optional(nullable ? { values: "null" } : undefined)
        .isISO8601().withMessage("Invalid expiry date").bail()
        .custom((value) => {
            if (new Date(value) <= new Date()) throw new Error("Expiry must be in the future");
            return true;
        });

const idParam = param("id").isMongoId().withMessage("Invalid URL ID");

export const createUrlValidator = [
    urlField(true),
    body("customAlias")
        .optional({ values: "falsy" })
        .trim()
        .matches(/^[A-Za-z0-9_-]{3,32}$/).withMessage("Alias must be 3–32 letters, numbers, - or _"),
    expiresAtField(false),
];

export const updateUrlValidator = [idParam, urlField(false), expiresAtField(true)];

export const urlIdValidator = [idParam];

export const shortCodeValidator = [
    param("shortCode").matches(/^[A-Za-z0-9_-]{3,32}$/).withMessage("Invalid short code"),
];

export const getUrlsValidator = [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("search").optional().trim().isLength({ max: 100 }).withMessage("Search is too long"),
    query("sort").optional().isIn(["createdAt", "clicks", "expiresAt"]).withMessage("Invalid sort field"),
    query("order").optional().isIn(["asc", "desc"]).withMessage("Order must be asc or desc"),
    query("status").optional().isIn(["all", "active", "expired"]).withMessage("Status must be all, active or expired"),
];
