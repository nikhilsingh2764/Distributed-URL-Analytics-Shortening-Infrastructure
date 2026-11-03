import { createRequire } from "module";
import pino from "pino";
import env from "./env.js";

const require = createRequire(import.meta.url);
const hasPretty = (() => {
    try {
        require.resolve("pino-pretty");
        return true;
    } catch {
        return false; // production install (--omit=dev): fall back to JSON logs
    }
})();

const logger = pino({
    level: env.isTest ? "silent" : env.isProduction ? "info" : "debug",
    redact: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']"],
    transport:
        env.isDev && hasPretty
            ? {
                  target: "pino-pretty",
                  options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
              }
            : undefined,
});

export default logger;
