import "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";

const { parseUserAgent, isBot, getCountry, getReferrer } = await import("../src/utils/userAgent.js");
const { default: generateOtp } = await import("../src/utils/generateOtp.js");
const { safeEqual, hmac } = await import("../src/utils/crypto.js");
const { signAccessToken, verifyAccessToken } = await import("../src/utils/generateToken.js");
const { escapeRegex, escapeHtml } = await import("../src/utils/escapeHtml.js");

test("parseUserAgent detects Chrome on Windows desktop", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    assert.deepEqual(parseUserAgent(ua), { browser: "Chrome", os: "Windows", device: "Desktop" });
});

test("parseUserAgent detects Safari on iPhone", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    assert.deepEqual(parseUserAgent(ua), { browser: "Safari", os: "iOS", device: "Mobile" });
});

test("parseUserAgent prefers Edge over Chrome", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0";
    assert.equal(parseUserAgent(ua).browser, "Edge");
});

test("isBot flags crawlers and empty agents", () => {
    assert.equal(isBot("Googlebot/2.1"), true);
    assert.equal(isBot(""), true);
    assert.equal(isBot("Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0"), false);
});

test("getCountry reads CDN headers and ignores junk", () => {
    assert.equal(getCountry({ "cf-ipcountry": "in" }), "IN");
    assert.equal(getCountry({ "cf-ipcountry": "XX" }), "Unknown");
    assert.equal(getCountry({}), "Unknown");
});

test("getReferrer returns hostname or Direct", () => {
    assert.equal(getReferrer("https://www.google.com/search?q=x"), "google.com");
    assert.equal(getReferrer(undefined), "Direct");
    assert.equal(getReferrer("not a url"), "Direct");
});

test("generateOtp always returns 6 digits (regression: it used to always return 1000000)", () => {
    const seen = new Set();
    for (let i = 0; i < 200; i++) {
        const otp = generateOtp();
        assert.match(otp, /^\d{6}$/);
        seen.add(otp);
    }
    assert.ok(seen.size > 150);
});

test("safeEqual / hmac", () => {
    assert.equal(safeEqual(hmac("a"), hmac("a")), true);
    assert.equal(safeEqual(hmac("a"), hmac("b")), false);
    assert.equal(safeEqual("a", "ab"), false);
});

test("access tokens round-trip with the `sub` claim", () => {
    const token = signAccessToken("abc123");
    assert.equal(verifyAccessToken(token).sub, "abc123");
});

test("escape helpers neutralise regex and HTML", () => {
    assert.equal(escapeRegex("a.b*c"), "a\\.b\\*c");
    assert.equal(escapeHtml("<b>&"), "&lt;b&gt;&amp;");
});
