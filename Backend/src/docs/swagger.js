import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import swaggerUi from "swagger-ui-express";
import { baseUrl } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const specPath = path.join(__dirname, "../../docs/openapi.yaml");

export const loadSpec = () => {
    const spec = YAML.parse(fs.readFileSync(specPath, "utf8"));
    // Point "Try it out" at whatever BASE_URL this instance runs on.
    spec.servers = [{ url: baseUrl, description: "This server" }];
    return spec;
};

export const mountSwagger = (app) => {
    const spec = loadSpec();
    app.get("/api/docs.json", (_req, res) => res.json(spec));
    app.use(
        "/api/docs",
        swaggerUi.serve,
        swaggerUi.setup(spec, {
            customSiteTitle: "Trimly API docs",
            swaggerOptions: { persistAuthorization: true, withCredentials: true },
        })
    );
};
