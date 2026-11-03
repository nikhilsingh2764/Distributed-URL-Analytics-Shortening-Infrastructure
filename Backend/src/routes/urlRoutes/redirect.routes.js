import express from "express";
import validate from "../../middleware/validator.js";
import { redirectLimiter } from "../../middleware/rateLimiter.middleware.js";
import { shortCodeValidator } from "../../validators/url.validators.js";
import { redirectUrl } from "../../controller/urlController/url.controller.js";

const router = express.Router();

// Public: GET /r/:shortCode  →  302 to the original URL
router.get("/:shortCode", redirectLimiter, shortCodeValidator, validate, redirectUrl);

export default router;
