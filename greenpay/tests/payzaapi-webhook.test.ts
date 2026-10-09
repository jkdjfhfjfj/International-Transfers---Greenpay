import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { PayzaApiService, verifyPayzaWebhookSignature } from "../server/services/payzaapi";

test("accepts the documented PayzaAPI raw-body HMAC-SHA256 signature", () => {
  const rawBody = '{"event":"payment.success","reference":"ORDER_1001"}';
  const secret = "test-webhook-signing-secret";
  const signature = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  assert.equal(verifyPayzaWebhookSignature(rawBody, signature, secret), true);
});

test("rejects changed bodies, malformed signatures, and missing secrets", () => {
  const rawBody = '{"event":"payment.success","reference":"ORDER_1001"}';
  const secret = "test-webhook-signing-secret";
  const signature = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  assert.equal(verifyPayzaWebhookSignature(`${rawBody} `, signature, secret), false);
  assert.equal(verifyPayzaWebhookSignature(rawBody, "not-a-signature", secret), false);
  assert.equal(verifyPayzaWebhookSignature(rawBody, signature, ""), false);
});

test("PayzaAPI readiness requires both API keys and the webhook signing secret", async () => {
  const secretNames = ["PAYZA_PUBLIC_KEY", "PAYZA_SECRET_KEY", "PAYZA_WEBHOOK_SECRET"] as const;
  const originalValues = new Map(secretNames.map(name => [name, process.env[name]]));
  const service = new PayzaApiService();

  try {
    for (const name of secretNames) delete process.env[name];
    assert.equal(await service.isConfigured(), false);

    process.env.PAYZA_PUBLIC_KEY = "test-public-key";
    process.env.PAYZA_SECRET_KEY = "test-api-secret";
    assert.equal(await service.isConfigured(), false);

    process.env.PAYZA_WEBHOOK_SECRET = "test-webhook-signing-secret";
    assert.equal(await service.isConfigured(), true);
  } finally {
    for (const [name, value] of originalValues) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
