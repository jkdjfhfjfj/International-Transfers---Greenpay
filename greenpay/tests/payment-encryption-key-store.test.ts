import assert from "node:assert/strict";
import test from "node:test";
import { storage } from "../server/storage";
import {
  getPaymentEncryptionKeyStatus,
  hydratePaymentEncryptionKey,
  saveDatabasePaymentEncryptionKey,
} from "../server/services/payment-encryption-key-store";

test("stores a wrapped database key and hydrates it when the environment key is absent", {
  skip: Boolean(process.env.DATABASE_URL),
}, async () => {
  const envNames = [
    "SESSION_SECRET",
    "PAYMENT_CREDENTIALS_ENCRYPTION_KEY",
    "PAYMENT_CREDENTIALS_ENCRYPTION_KEY_PREVIOUS",
  ];
  const oldValues = new Map(envNames.map(name => [name, process.env[name]]));

  try {
    process.env.SESSION_SECRET = "unit-test-session-secret-with-at-least-32-characters";
    delete process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
    delete process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY_PREVIOUS;
    await storage.setSystemSetting({
      category: "security",
      key: "payment_credentials_encryption_key",
      value: "",
    });

    const key = "test-database-payment-encryption-key-32chars";
    await saveDatabasePaymentEncryptionKey(key);
    const saved = await storage.getSystemSetting("security", "payment_credentials_encryption_key");
    assert.ok(typeof saved?.value === "string" && saved.value.startsWith("kw1."));
    assert.notEqual(saved?.value, key);

    delete process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
    await hydratePaymentEncryptionKey();
    assert.equal(process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY, key);
    assert.equal((await getPaymentEncryptionKeyStatus()).source, "database");
  } finally {
    for (const [name, value] of oldValues) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
