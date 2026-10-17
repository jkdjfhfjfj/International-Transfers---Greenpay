import assert from "node:assert/strict";
import test from "node:test";
import { resolveConnectionString } from "../server/db";

test("production uses Render database when DATABASE_URL is absent", () => {
  const url = "postgresql://example.invalid/greenpay";
  assert.equal(
    resolveConnectionString({ NODE_ENV: "production", RENDER_DATABASE_URL: url }),
    url,
  );
});

test("development preview ignores the shared Render database", () => {
  assert.equal(
    resolveConnectionString({ NODE_ENV: "development", RENDER_DATABASE_URL: "postgresql://example.invalid/greenpay" }),
    null,
  );
});

test("DATABASE_URL takes precedence over the Render fallback", () => {
  assert.equal(
    resolveConnectionString({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://primary.invalid/greenpay",
      RENDER_DATABASE_URL: "postgresql://fallback.invalid/greenpay",
    }),
    "postgresql://primary.invalid/greenpay",
  );
});
