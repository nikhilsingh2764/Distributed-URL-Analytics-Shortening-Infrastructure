import "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";
import SwaggerParser from "@apidevtools/swagger-parser";
import { specPath } from "../src/docs/swagger.js";

test("openapi.yaml is a valid OpenAPI 3 document", async () => {
    const api = await SwaggerParser.validate(specPath);
    assert.ok(api.paths["/api/v1/urls"]);
    assert.ok(api.paths["/r/{shortCode}"]);
});
