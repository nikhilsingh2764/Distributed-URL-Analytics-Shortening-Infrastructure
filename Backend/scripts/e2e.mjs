/**
 * End-to-end smoke test: boots the real API against a throw-away MongoDB database and Redis DB 15,
 * then walks through signup → analytics → account deletion.
 *
 * Requires MongoDB and Redis running locally.   Run:  npm run test:e2e
 */
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import Redis from "ioredis";
import mongoose from "mongoose";

const PORT = 5055;
const API = `http://127.0.0.1:${PORT}`;
const MONGODB_URI = process.env.E2E_MONGODB_URI || "mongodb://127.0.0.1:27017/url_shortener_e2e";
const REDIS_URL = process.env.E2E_REDIS_URL || "redis://127.0.0.1:6379/15";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ───────── clean slate ─────────
await mongoose.connect(MONGODB_URI);
await mongoose.connection.dropDatabase();
await mongoose.disconnect();
const redis = new Redis(REDIS_URL);
await redis.flushdb();
await redis.quit();

// ───────── boot the server ─────────
let logs = "";
const server = spawn("node", ["src/server.js"], {
    env: {
        ...process.env,
        NODE_ENV: "development",
        PORT: String(PORT),
        BASE_URL: API,
        CLIENT_URL: "http://localhost:5173",
        MONGODB_URI,
        REDIS_URL,
        JWT_ACCESS_SECRET: "e2e-access-secret-e2e-access-secret",
        JWT_REFRESH_SECRET: "e2e-refresh-secret-e2e-refresh-secret",
        BREVO_API_KEY: "",
    },
});
server.stdout.on("data", (d) => (logs += d.toString()));
server.stderr.on("data", (d) => (logs += d.toString()));
const stop = () => server.kill("SIGTERM");
process.on("exit", stop);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) {
    try {
        if ((await fetch(`${API}/health`)).ok) break;
    } catch { /* not up yet */ }
    await sleep(500);
    if (i === 59) { console.error(logs); throw new Error("server did not start"); }
}

// ───────── tiny client with a cookie jar ─────────
const jar = new Map();
const cookieHeader = (path) =>
    [...jar].filter(([name]) => name !== "refreshToken" || path.startsWith("/api/v1/auth"))
        .map(([k, v]) => `${k}=${v}`).join("; ");

const call = async (method, path, { body, headers = {}, raw = false } = {}) => {
    const res = await fetch(API + path, {
        method,
        redirect: "manual",
        headers: { "content-type": "application/json", cookie: cookieHeader(path), ...headers },
        body: body ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(";");
        const [name, ...rest] = pair.split("=");
        const value = rest.join("=");
        if (value === "" || /expires=Thu, 01 Jan 1970/i.test(c)) jar.delete(name);
        else jar.set(name, value);
    }
    if (raw) return res;
    return { status: res.status, json: await res.json().catch(() => null) };
};

const lastOtp = async (label) => {
    for (let i = 0; i < 30; i++) {
        const matches = [...logs.matchAll(new RegExp(`${label}: (\\d{6})`, "g"))];
        if (matches.length) return matches.at(-1)[1];
        await sleep(200);
    }
    throw new Error(`no ${label} found in server log`);
};

let passed = 0;
const step = async (name, fn) => {
    try { await fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n`, e.message); console.error(logs.split("\n").slice(-25).join("\n")); stop(); process.exit(1); }
};

const user = { username: "e2e_user", email: "e2e@example.com", password: "Password@123" };
let urlId;

console.log("Auth");
await step("health is ok", async () => {
    const r = await call("GET", "/health");
    assert.equal(r.status, 200); assert.equal(r.json.redis, "up"); assert.equal(r.json.mongo, "up");
});
await step("signup validates input", async () => {
    const r = await call("POST", "/api/v1/auth/signup", { body: { username: "x", email: "bad", password: "weak" } });
    assert.equal(r.status, 400); assert.ok(r.json.errors.length >= 3);
});
await step("signup sends an OTP", async () => {
    const r = await call("POST", "/api/v1/auth/signup", { body: user });
    assert.equal(r.status, 201);
});
await step("login is blocked before verification", async () => {
    const r = await call("POST", "/api/v1/auth/login", { body: user });
    assert.equal(r.status, 401); // no account yet -> generic credentials error
});
await step("wrong OTP is rejected", async () => {
    const r = await call("POST", "/api/v1/auth/verify-otp", { body: { email: user.email, otp: "000000" } });
    assert.equal(r.status, 400);
});
await step("correct OTP creates the account (no password hash leaked)", async () => {
    const otp = await lastOtp("OTP");
    const r = await call("POST", "/api/v1/auth/verify-otp", { body: { email: user.email, otp } });
    assert.equal(r.status, 201); assert.equal(r.json.data.email, user.email);
    assert.equal(JSON.stringify(r.json).includes("password"), false);
});
await step("login with wrong password gives 401, localised in Hindi on request", async () => {
    const r = await call("POST", "/api/v1/auth/login", { body: { ...user, password: "Wrong@123" }, headers: { "accept-language": "hi" } });
    assert.equal(r.status, 401); assert.match(r.json.message, /गलत/);
});
await step("login sets HttpOnly cookies", async () => {
    const r = await call("POST", "/api/v1/auth/login", { body: user });
    assert.equal(r.status, 200); assert.ok(jar.has("accessToken")); assert.ok(jar.has("refreshToken"));
});
await step("profile works with the cookie", async () => {
    const r = await call("GET", "/api/v1/auth/profile");
    assert.equal(r.status, 200); assert.equal(r.json.data.username, user.username);
});
await step("profile without cookie is 401", async () => {
    const saved = new Map(jar); jar.clear();
    const r = await call("GET", "/api/v1/auth/profile");
    assert.equal(r.status, 401);
    saved.forEach((v, k) => jar.set(k, v));
});

console.log("URLs");
await step("create link with custom alias", async () => {
    const r = await call("POST", "/api/v1/urls", { body: { originalUrl: "https://example.com/long/path?x=1", customAlias: "demo-link" } });
    assert.equal(r.status, 201); urlId = r.json.data.id;
    assert.equal(r.json.data.shortUrl, `${API}/r/demo-link`);
});
await step("random code link", async () => {
    const r = await call("POST", "/api/v1/urls", { body: { originalUrl: "https://example.org" } });
    assert.equal(r.status, 201); assert.match(r.json.data.shortCode, /^[0-9a-zA-Z]{7}$/);
});
await step("duplicate / reserved / invalid / self-referencing inputs are rejected", async () => {
    assert.equal((await call("POST", "/api/v1/urls", { body: { originalUrl: "https://a.com", customAlias: "demo-link" } })).status, 409);
    assert.equal((await call("POST", "/api/v1/urls", { body: { originalUrl: "https://a.com", customAlias: "api" } })).status, 400);
    assert.equal((await call("POST", "/api/v1/urls", { body: { originalUrl: "javascript:alert(1)" } })).status, 400);
    assert.equal((await call("POST", "/api/v1/urls", { body: { originalUrl: `${API}/r/demo-link` } })).status, 400);
    assert.equal((await call("POST", "/api/v1/urls", { body: { originalUrl: "https://a.com", expiresAt: "2001-01-01T00:00:00Z" } })).status, 400);
});
await step("list, search (regex-safe) and pagination", async () => {
    let r = await call("GET", "/api/v1/urls?limit=1");
    assert.equal(r.json.data.urls.length, 1); assert.equal(r.json.data.pagination.total, 2);
    r = await call("GET", "/api/v1/urls?search=demo");
    assert.equal(r.json.data.urls.length, 1);
    r = await call("GET", "/api/v1/urls?search=.*%28");
    assert.equal(r.status, 200); assert.equal(r.json.data.urls.length, 0);
});
await step("get one link", async () => {
    const r = await call("GET", `/api/v1/urls/${urlId}`);
    assert.equal(r.status, 200); assert.equal(r.json.data.shortCode, "demo-link");
});

console.log("Redirect + analytics");
await step("redirect 302s to the destination", async () => {
    const r = await call("GET", "/r/demo-link", { raw: true, headers: { "user-agent": CHROME, referer: "https://news.ycombinator.com/item?id=1", "cf-ipcountry": "IN" } });
    assert.equal(r.status, 302); assert.equal(r.headers.get("location"), "https://example.com/long/path?x=1");
});
await step("bots and unknown codes are handled", async () => {
    const bot = await call("GET", "/r/demo-link", { raw: true, headers: { "user-agent": "Googlebot/2.1" } });
    assert.equal(bot.status, 302);
    assert.equal((await call("GET", "/r/nope1234")).status, 404);
});
await step("click is recorded asynchronously (bot ignored)", async () => {
    await sleep(1500);
    const r = await call("GET", `/api/v1/urls/${urlId}/analytics`);
    assert.equal(r.status, 200);
    const d = r.json.data;
    assert.equal(d.totals.inRange, 1); assert.equal(d.totals.allTime, 1);
    assert.equal(d.totals.uniqueVisitors, 1); assert.equal(d.totals.today, 1);
    assert.equal(d.browsers[0].label, "Chrome"); assert.equal(d.os[0].label, "Windows");
    assert.equal(d.countries[0].label, "IN"); assert.equal(d.referrers[0].label, "news.ycombinator.com");
    assert.equal(d.daily.length, 30); assert.equal(d.daily.at(-1).clicks, 1);
});
await step("summary aggregates all links", async () => {
    const r = await call("GET", "/api/v1/urls/summary");
    assert.equal(r.status, 200); assert.equal(r.json.data.totalLinks, 2); assert.equal(r.json.data.totalClicks, 1);
    assert.equal(r.json.data.daily.length, 14);
});
await step("invalid analytics range is rejected", async () => {
    const r = await call("GET", `/api/v1/urls/${urlId}/analytics?startDate=2020-01-01&endDate=2026-01-01`);
    assert.equal(r.status, 400);
});
await step("editing the destination invalidates the redirect cache", async () => {
    const r = await call("PATCH", `/api/v1/urls/${urlId}`, { body: { originalUrl: "https://example.net/new" } });
    assert.equal(r.status, 200);
    const res = await call("GET", "/r/demo-link", { raw: true, headers: { "user-agent": CHROME } });
    assert.equal(res.headers.get("location"), "https://example.net/new");
});
await step("expired links answer 410, even when cached", async () => {
    const exp = new Date(Date.now() + 2000).toISOString();
    const c = await call("POST", "/api/v1/urls", { body: { originalUrl: "https://example.com/soon", customAlias: "soon-gone", expiresAt: exp } });
    assert.equal(c.status, 201);
    assert.equal((await call("GET", "/r/soon-gone", { raw: true, headers: { "user-agent": CHROME } })).status, 302);
    await sleep(2200);
    assert.equal((await call("GET", "/r/soon-gone", { raw: true, headers: { "user-agent": CHROME } })).status, 410);
    const list = await call("GET", "/api/v1/urls?status=expired");
    assert.equal(list.json.data.urls.length, 1);
});
await step("removing the expiry with null works", async () => {
    const list = await call("GET", "/api/v1/urls?status=expired");
    const r = await call("PATCH", `/api/v1/urls/${list.json.data.urls[0].id}`, { body: { expiresAt: null } });
    assert.equal(r.status, 200); assert.equal(r.json.data.expiresAt, null);
});

console.log("Sessions");
await step("refresh rotates tokens; reusing the old one revokes everything", async () => {
    const oldRefresh = jar.get("refreshToken");
    let r = await call("POST", "/api/v1/auth/refresh-token");
    assert.equal(r.status, 200); assert.notEqual(jar.get("refreshToken"), oldRefresh);
    const fresh = jar.get("refreshToken");
    jar.set("refreshToken", oldRefresh); // attacker replays the old token
    r = await call("POST", "/api/v1/auth/refresh-token");
    assert.equal(r.status, 401);
    jar.set("refreshToken", fresh); // even the legitimate newest token is now dead
    r = await call("POST", "/api/v1/auth/refresh-token");
    assert.equal(r.status, 401);
});
await step("login again", async () => {
    const r = await call("POST", "/api/v1/auth/login", { body: user });
    assert.equal(r.status, 200);
});

console.log("Passwords");
await step("forgot-password is silent about unknown emails", async () => {
    const r = await call("POST", "/api/v1/auth/forgot-password", { body: { email: "ghost@example.com" } });
    assert.equal(r.status, 200);
});
await step("forgot + reset password with OTP", async () => {
    let r = await call("POST", "/api/v1/auth/forgot-password", { body: { email: user.email } });
    assert.equal(r.status, 200);
    const otp = await lastOtp("RESET OTP");
    r = await call("POST", "/api/v1/auth/reset-password", { body: { email: user.email, otp, newPassword: "NewPass@456" } });
    assert.equal(r.status, 200);
    user.password = "NewPass@456";
    jar.clear();
    r = await call("POST", "/api/v1/auth/login", { body: user });
    assert.equal(r.status, 200);
});
await step("change password keeps this session alive", async () => {
    let r = await call("PATCH", "/api/v1/auth/change-password", { body: { currentPassword: user.password, newPassword: "Another@789" } });
    assert.equal(r.status, 200); user.password = "Another@789";
    r = await call("GET", "/api/v1/auth/profile");
    assert.equal(r.status, 200);
});
await step("update username", async () => {
    const r = await call("PATCH", "/api/v1/auth/update-profile", { body: { username: "e2e_renamed" } });
    assert.equal(r.status, 200); assert.equal(r.json.data.username, "e2e_renamed");
});

console.log("Cleanup");
await step("delete a link removes it and its redirect", async () => {
    const r = await call("DELETE", `/api/v1/urls/${urlId}`);
    assert.equal(r.status, 200);
    assert.equal((await call("GET", "/r/demo-link", { raw: true, headers: { "user-agent": CHROME } })).status, 404);
});
await step("logout clears cookies", async () => {
    const r = await call("POST", "/api/v1/auth/logout");
    assert.equal(r.status, 200); assert.equal(jar.has("accessToken"), false);
    await call("POST", "/api/v1/auth/login", { body: user });
});
await step("delete account needs the right password", async () => {
    assert.equal((await call("DELETE", "/api/v1/auth/delete-account", { body: { password: "nope" } })).status, 400);
    assert.equal((await call("DELETE", "/api/v1/auth/delete-account", { body: { password: user.password } })).status, 200);
    assert.equal((await call("POST", "/api/v1/auth/login", { body: user })).status, 401);
});
await step("unknown routes return JSON 404, Swagger UI + spec are served", async () => {
    assert.equal((await call("GET", "/api/v1/nothing")).status, 404);
    const docs = await fetch(`${API}/api/docs/`);
    assert.equal(docs.status, 200);
    const spec = await (await fetch(`${API}/api/docs.json`)).json();
    assert.equal(spec.openapi, "3.0.3");
});

console.log(`\nAll ${passed} checks passed.`);
stop();
await sleep(500);
process.exit(0);
