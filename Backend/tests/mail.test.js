import "./helpers.js";
import http from "node:http";
import test from "node:test";
import assert from "node:assert/strict";

// A fake Brevo API: records the request and answers with a configurable status.
let status = 201;
let received;
const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
        received = { method: req.method, url: req.url, headers: req.headers, body: JSON.parse(body) };
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(status < 300 ? { messageId: "<abc@brevo>" } : { code: "unauthorized", message: "Key not found" }));
    });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

process.env.BREVO_API_KEY = "xkeysib-test-key";
process.env.BREVO_API_URL = `http://127.0.0.1:${server.address().port}/v3/smtp/email`;
process.env.MAIL_FROM_EMAIL = "noreply@trimly.test";
process.env.MAIL_FROM_NAME = "Trimly Test";

const { sendOTPEmail, sendResetPasswordEmail } = await import("../src/service/authService/email.service.js");

test.after(() => server.close());

test("OTP email goes to Brevo with the right headers and payload", async () => {
    status = 201;
    const result = await sendOTPEmail({ email: "user@example.com", username: "<b>bob</b>", otp: "482913" });

    assert.equal(result.messageId, "<abc@brevo>");
    assert.equal(received.method, "POST");
    assert.equal(received.url, "/v3/smtp/email");
    assert.equal(received.headers["api-key"], "xkeysib-test-key");
    assert.deepEqual(received.body.sender, { name: "Trimly Test", email: "noreply@trimly.test" });
    assert.deepEqual(received.body.to, [{ email: "user@example.com" }]);
    assert.equal(received.body.subject, "Verify your email");
    assert.match(received.body.htmlContent, /482913/);
    assert.doesNotMatch(received.body.htmlContent, /<b>bob<\/b>/, "username must be HTML-escaped");
});

test("reset email contains the code", async () => {
    status = 201;
    await sendResetPasswordEmail({ email: "user@example.com", otp: "111222" });
    assert.match(received.body.htmlContent, /111222/);
});

test("client errors (bad key / unverified sender) are not retried", async () => {
    status = 401;
    await assert.rejects(() => sendOTPEmail({ email: "u@example.com", username: "u", otp: "123456" }), (e) => {
        assert.equal(e.name, "UnrecoverableError");
        assert.match(e.message, /401/);
        return true;
    });
});

test("rate limits and server errors are retried by BullMQ", async () => {
    for (const code of [429, 503]) {
        status = code;
        await assert.rejects(() => sendOTPEmail({ email: "u@example.com", username: "u", otp: "123456" }), (e) => {
            assert.notEqual(e.name, "UnrecoverableError");
            assert.match(e.message, new RegExp(String(code)));
            return true;
        });
    }
});
