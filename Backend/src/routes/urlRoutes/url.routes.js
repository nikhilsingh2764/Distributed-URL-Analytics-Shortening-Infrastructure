import express from "express";

import authMiddleware from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validator.js";
import { createUrlLimiter } from "../../middleware/rateLimiter.middleware.js";
import {
    createUrlValidator,
    getUrlsValidator,
    urlIdValidator,
    updateUrlValidator,
} from "../../validators/url.validators.js";
import { analyticsValidator } from "../../validators/analytics.validators.js";
import {
    createUrl,
    getAllUrls,
    getSummary,
    getUrlById,
    updateUrl,
    deleteUrl,
    getAnalytics,
} from "../../controller/urlController/url.controller.js";

const router = express.Router();

router.use(authMiddleware); // every /urls route needs a logged-in user

router.post("/", createUrlLimiter, createUrlValidator, validate, createUrl);
router.get("/", getUrlsValidator, validate, getAllUrls);

// Must be declared BEFORE "/:id", otherwise "summary" would be treated as an id.
router.get("/summary", getSummary);

router.get("/:id", urlIdValidator, validate, getUrlById);
router.patch("/:id", updateUrlValidator, validate, updateUrl);
router.delete("/:id", urlIdValidator, validate, deleteUrl);
router.get("/:id/analytics", analyticsValidator, validate, getAnalytics);

export default router;
