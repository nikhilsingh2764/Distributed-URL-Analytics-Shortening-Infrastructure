/**
 * Tiny dependency-free user-agent parser. Good enough for dashboard breakdowns.
 */
const BOT_PATTERN =
    /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|curl|wget|python-requests|go-http-client|okhttp|axios|node-fetch|monitor|uptime/i;

export const isBot = (ua = "") => !ua || BOT_PATTERN.test(ua);

export const parseUserAgent = (ua = "") => {
    let browser = "Other";
    if (/Edg(e|A|iOS)?\//.test(ua)) browser = "Edge";
    else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
    else if (/SamsungBrowser\//.test(ua)) browser = "Samsung Internet";
    else if (/Firefox\/|FxiOS\//.test(ua)) browser = "Firefox";
    else if (/Chrome\/|CriOS\//.test(ua)) browser = "Chrome";
    else if (/Safari\//.test(ua)) browser = "Safari";
    else if (/MSIE |Trident\//.test(ua)) browser = "Internet Explorer";

    let os = "Other";
    if (/Windows/.test(ua)) os = "Windows";
    else if (/Android/.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
    else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
    else if (/CrOS/.test(ua)) os = "ChromeOS";
    else if (/Linux|X11/.test(ua)) os = "Linux";

    let device = "Desktop";
    if (/iPad|Tablet|PlayBook|Silk/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) device = "Tablet";
    else if (/Mobi|iPhone|iPod|Android/.test(ua)) device = "Mobile";

    return { browser, os, device };
};

const COUNTRY_HEADERS = ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code"];

/** Country comes from CDN/proxy headers (Cloudflare, Vercel, CloudFront). No GeoIP database is bundled. */
export const getCountry = (headers = {}) => {
    for (const name of COUNTRY_HEADERS) {
        const value = headers[name];
        if (typeof value === "string" && /^[A-Za-z]{2}$/.test(value) && value.toUpperCase() !== "XX") {
            return value.toUpperCase();
        }
    }
    return "Unknown";
};

export const getReferrer = (referer) => {
    if (!referer) return "Direct";
    try {
        return new URL(referer).hostname.replace(/^www\./, "") || "Direct";
    } catch {
        return "Direct";
    }
};
