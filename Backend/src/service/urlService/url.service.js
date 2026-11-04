import { customAlphabet } from "nanoid";
import ApiError from "../../utils/ApiError.js";
import logger from "../../config/logger.js";
import { baseUrl } from "../../config/env.js";
import { cacheDel, cacheGet, cacheSet } from "../../utils/cache.js";
import { escapeRegex } from "../../utils/escapeHtml.js";
import { RESERVED_ALIASES } from "../../validators/url.validators.js";

import urlRepository from "../../repository/urlRepository/url.repository.js";
import clickRepository from "../../repository/clickRepository/click.repository.js";

const generateCode = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7);
const REDIRECT_CACHE_TTL = 3600;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;

const redirectKey = (shortCode) => `redirect:${shortCode}`;
const isExpired = (expiresAt, now = new Date()) => Boolean(expiresAt) && new Date(expiresAt) <= now;

const startOfUtcDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const dayKey = (date) => date.toISOString().slice(0, 10);

export const toUrlDto = (url) => ({
    id: String(url._id),
    originalUrl: url.originalUrl,
    shortCode: url.shortCode,
    shortUrl: `${baseUrl}/r/${url.shortCode}`,
    clicks: url.clicks,
    lastClickedAt: url.lastClickedAt ?? null,
    expiresAt: url.expiresAt ?? null,
    isExpired: isExpired(url.expiresAt),
    createdAt: url.createdAt,
    updatedAt: url.updatedAt,
});

// ───────── create ─────────

export const createUrlService = async (userId, { originalUrl, expiresAt, customAlias }) => {
    if (customAlias) {
        if (RESERVED_ALIASES.includes(customAlias.toLowerCase())) throw new ApiError(400, "alias_reserved");
        if (await urlRepository.findByShortCode(customAlias)) throw new ApiError(409, "alias_taken");
    }

    // Random codes can (very rarely) collide: retry a few times, relying on the unique index as the real guard.
    for (let attempt = 0; attempt < 5; attempt++) {
        const shortCode = customAlias || generateCode();
        try {
            const url = await urlRepository.create({
                userId,
                originalUrl,
                shortCode,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            });
            return toUrlDto(url);
        } catch (error) {
            if (error.code !== 11000) throw error;
            // Only a collision on shortCode is worth retrying; anything else is a real problem.
            if (!error.keyPattern?.shortCode) {
                logger.error({ err: error, keyPattern: error.keyPattern }, "duplicate key on unexpected index");
                throw error;
            }
            if (customAlias) throw new ApiError(409, "alias_taken");
        }
    }
    throw new ApiError(500, "server_error");
};

// ───────── list ─────────

export const getAllUrlsService = async (userId, query) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const { search = "", sort = "createdAt", order = "desc", status = "all" } = query;

    const now = new Date();
    const conditions = [{ userId }];

    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i"); // escaped: user input is never a raw regex
        conditions.push({ $or: [{ originalUrl: pattern }, { shortCode: pattern }] });
    }
    if (status === "active") {
        conditions.push({ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
    } else if (status === "expired") {
        conditions.push({ expiresAt: { $lte: now } });
    }

    const filter = { $and: conditions };
    const sortObject = { [sort]: order === "asc" ? 1 : -1, _id: -1 };

    const [urls, total] = await Promise.all([
        urlRepository.findAllByUserId(filter, { skip: (page - 1) * limit, limit, sort: sortObject }),
        urlRepository.count(filter),
    ]);

    return {
        urls: urls.map(toUrlDto),
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
};

// ───────── read / update / delete ─────────

export const getUrlByIdService = async (userId, id) => {
    const url = await urlRepository.findByIdAndUserId(id, userId);
    if (!url) throw new ApiError(404, "url_not_found");
    return toUrlDto(url);
};

export const updateUrlService = async (userId, id, { originalUrl, expiresAt }) => {
    const set = {};
    const unset = {};

    if (originalUrl !== undefined) set.originalUrl = originalUrl;
    if (expiresAt === null) unset.expiresAt = 1;
    else if (expiresAt !== undefined) set.expiresAt = new Date(expiresAt);

    if (!Object.keys(set).length && !Object.keys(unset).length) throw new ApiError(400, "nothing_to_update");

    const update = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;

    const url = await urlRepository.updateByIdAndUserId(id, userId, update);
    if (!url) throw new ApiError(404, "url_not_found");

    // The redirect cache holds the OLD destination/expiry — drop it so changes apply immediately.
    await cacheDel(redirectKey(url.shortCode));

    return toUrlDto(url);
};

export const deleteUrlService = async (userId, id) => {
    const url = await urlRepository.deleteByIdAndUserId(id, userId);
    if (!url) throw new ApiError(404, "url_not_found");

    await clickRepository.deleteByUrlIds([url._id]);
    await cacheDel(redirectKey(url.shortCode));
};

// ───────── public redirect (hot path) ─────────

/** Redis first, MongoDB on a miss. Returns what the controller needs to redirect and record the click. */
export const resolveShortCodeService = async (shortCode) => {
    const cached = await cacheGet(redirectKey(shortCode));

    if (cached) {
        const data = JSON.parse(cached);
        // The cache TTL can outlive the link's own expiry, so check it here too.
        if (isExpired(data.expiresAt)) throw new ApiError(410, "url_expired");
        return data;
    }

    const url = await urlRepository.findByShortCode(shortCode);
    if (!url) throw new ApiError(404, "url_not_found");
    if (isExpired(url.expiresAt)) throw new ApiError(410, "url_expired");

    const data = {
        urlId: String(url._id),
        originalUrl: url.originalUrl,
        expiresAt: url.expiresAt ?? null,
    };

    const secondsUntilExpiry = url.expiresAt ? (new Date(url.expiresAt) - Date.now()) / 1000 : Infinity;
    await cacheSet(redirectKey(shortCode), JSON.stringify(data), Math.min(REDIRECT_CACHE_TTL, secondsUntilExpiry));

    return data;
};

// ───────── analytics ─────────

const fillDailySeries = (rows, start, end) => {
    const counts = new Map(rows.map((r) => [r._id, r.count]));
    const series = [];
    for (let d = startOfUtcDay(start); d <= end; d = new Date(d.getTime() + DAY_MS)) {
        const key = dayKey(d);
        series.push({ date: key, clicks: counts.get(key) || 0 });
    }
    return series;
};

const labelled = (rows) => (rows || []).map((r) => ({ label: r._id || "Unknown", count: r.count }));

export const getAnalyticsService = async (userId, urlId, { startDate, endDate } = {}) => {
    const url = await urlRepository.findByIdAndUserId(urlId, userId);
    if (!url) throw new ApiError(404, "url_not_found");

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(startOfUtcDay(end).getTime() - 29 * DAY_MS);

    if (start > end) throw new ApiError(400, "invalid_date_range");
    if ((end - start) / DAY_MS > MAX_RANGE_DAYS) throw new ApiError(400, "range_too_large");

    const [facets, today, recent] = await Promise.all([
        clickRepository.analyticsForUrl(urlId, start, end),
        clickRepository.countSince(urlId, startOfUtcDay(new Date())),
        clickRepository.findRecent(urlId, 10),
    ]);

    return {
        url: toUrlDto(url),
        range: { startDate: start.toISOString(), endDate: end.toISOString() },
        totals: {
            allTime: url.clicks,
            inRange: facets.total[0]?.n || 0,
            uniqueVisitors: facets.unique[0]?.n || 0,
            today,
        },
        daily: fillDailySeries(facets.daily, start, end),
        browsers: labelled(facets.browsers),
        os: labelled(facets.os),
        devices: labelled(facets.devices),
        countries: labelled(facets.countries),
        referrers: labelled(facets.referrers),
        recent,
    };
};

/** Dashboard header numbers + a 14-day clicks chart for all of the user's links. */
export const getSummaryService = async (userId) => {
    const now = new Date();
    const end = now;
    const start = new Date(startOfUtcDay(now).getTime() - 13 * DAY_MS);

    const [totals, top, urls] = await Promise.all([
        urlRepository.totalsByUserId(userId, now),
        urlRepository.findTopByUserId(userId, 5),
        urlRepository.findIdsAndCodesByUserId(userId),
    ]);

    const dailyRows = urls.length
        ? await clickRepository.dailyForUrls(urls.map((u) => u._id), start, end)
        : [];
    const daily = fillDailySeries(dailyRows, start, end);

    return {
        totalLinks: totals.totalLinks,
        activeLinks: totals.totalLinks - totals.expiredLinks,
        expiredLinks: totals.expiredLinks,
        totalClicks: totals.totalClicks,
        clicksLast14Days: daily.reduce((sum, d) => sum + d.clicks, 0),
        daily,
        topLinks: top.map(toUrlDto),
    };
};
