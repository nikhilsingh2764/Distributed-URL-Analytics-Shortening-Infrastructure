import TryCatch from "../../middleware/TryCatch.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { hmac } from "../../utils/crypto.js";
import logger from "../../config/logger.js";
import { getCountry, getReferrer, isBot, parseUserAgent } from "../../utils/userAgent.js";
import clickQueue from "../../queues/click.queue.js";
import * as urlService from "../../service/urlService/url.service.js";

const send = (req, res, status, key, data = null) =>
    res.status(status).json(new ApiResponse(status, req.t(key), data));

export const createUrl = TryCatch(async (req, res) => {
    send(req, res, 201, "url_created", await urlService.createUrlService(req.user._id, req.body));
});

export const getAllUrls = TryCatch(async (req, res) => {
    send(req, res, 200, "urls_fetched", await urlService.getAllUrlsService(req.user._id, req.query));
});

export const getSummary = TryCatch(async (req, res) => {
    send(req, res, 200, "summary_fetched", await urlService.getSummaryService(req.user._id));
});

export const getUrlById = TryCatch(async (req, res) => {
    send(req, res, 200, "url_fetched", await urlService.getUrlByIdService(req.user._id, req.params.id));
});

export const updateUrl = TryCatch(async (req, res) => {
    send(req, res, 200, "url_updated", await urlService.updateUrlService(req.user._id, req.params.id, req.body));
});

export const deleteUrl = TryCatch(async (req, res) => {
    await urlService.deleteUrlService(req.user._id, req.params.id);
    send(req, res, 200, "url_deleted");
});

export const getAnalytics = TryCatch(async (req, res) => {
    send(req, res, 200, "analytics_fetched", await urlService.getAnalyticsService(req.user._id, req.params.id, req.query));
});

// ───────── public redirect ─────────

/** Fire-and-forget: a failure to record a click must never break the redirect. */
const trackClick = (req, urlId) => {
    const userAgent = req.get("user-agent") || "";
    if (req.method !== "GET" || isBot(userAgent)) return;

    clickQueue
        .add("click", {
            urlId,
            at: new Date().toISOString(),
            // Raw IPs are never stored — only a keyed hash used to count unique visitors.
            visitorId: hmac(`${req.ip}|${userAgent}`),
            userAgent: userAgent.slice(0, 300),
            ...parseUserAgent(userAgent),
            country: getCountry(req.headers),
            referrer: getReferrer(req.get("referer")),
        })
        .catch((error) => logger.error({ err: error }, "failed to enqueue click"));
};

export const redirectUrl = TryCatch(async (req, res) => {
    const { urlId, originalUrl } = await urlService.resolveShortCodeService(req.params.shortCode);

    trackClick(req, urlId);

    res.set("Cache-Control", "private, no-cache"); // so browsers re-hit us (and we count the click / see edits)
    res.redirect(302, originalUrl);
});
