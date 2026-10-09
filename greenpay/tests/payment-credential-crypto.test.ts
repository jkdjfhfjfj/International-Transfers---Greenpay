import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptPaymentCredential,
  encryptPaymentCredential,
} from "../server/services/payment-credential-crypto";

test("encrypts provider credentials with authenticated encryption", () => {
  const keyName = "PAYMENT_CREDENTIALS_ENCRYPTION_KEY";
  const previousKey = process.env[keyName];

  try {
    process.env[keyName] = "test-payment-credentials-encryption-key-32-chars-minimum";

    const credential = "provider-secret-value-for-test";
    const credentialKey = "PAYSTACK_SECRET_KEY";
    const encrypted = encryptPaymentCredential(credential, credentialKey);
    const secondEncryption = encryptPaymentCredential(credential, credentialKey);

    assert.match(encrypted, /^v1\./);
    assert.notEqual(encrypted, credential);
    assert.notEqual(encrypted, secondEncryption);
    assert.equal(decryptPaymentCredential(encrypted, credentialKey), credential);
    assert.throws(() => decryptPaymentCredential(encrypted, "NEXUSPAY_API_KEY"));

    const parts = encrypted.split(".");
    const ciphertext = Buffer.from(parts[3], "base64");
    ciphertext[0] ^= 1;
    parts[3] = ciphertext.toString("base64");
    assert.throws(() => decryptPaymentCredential(parts.join("."), credentialKey));

    delete process.env[keyName];
    assert.throws(() => encryptPaymentCredential(credential, credentialKey), /PAYMENT_CREDENTIALS_ENCRYPTION_KEY/);

    process.env[keyName] = "too-short";
    assert.throws(() => encryptPaymentCredential(credential, credentialKey), /at least 32 characters/);
  } finally {
    if (previousKey === undefined) delete process.env[keyName];
    else process.env[keyName] = previousKey;
  }
});
