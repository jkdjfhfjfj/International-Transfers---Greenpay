import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptPaymentCredential,
  decryptPaymentCredentialWithRotation,
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

test("decrypts with the previous key during rotation and marks the value for re-encryption", () => {
  const currentName = "PAYMENT_CREDENTIALS_ENCRYPTION_KEY";
  const previousName = "PAYMENT_CREDENTIALS_ENCRYPTION_KEY_PREVIOUS";
  const oldCurrent = process.env[currentName];
  const oldPrevious = process.env[previousName];
  const oldKey = "old-test-payment-credential-key-32-characters";
  const newKey = "new-test-payment-credential-key-32-characters";

  try {
    process.env[currentName] = oldKey;
    delete process.env[previousName];
    const encrypted = encryptPaymentCredential("saved-provider-secret", "PAYSTACK_SECRET_KEY");

    process.env[currentName] = newKey;
    process.env[previousName] = oldKey;
    const recovered = decryptPaymentCredentialWithRotation(encrypted, "PAYSTACK_SECRET_KEY");
    assert.equal(recovered.value, "saved-provider-secret");
    assert.equal(recovered.needsRotation, true);

    const reencrypted = encryptPaymentCredential(recovered.value, "PAYSTACK_SECRET_KEY");
    assert.equal(decryptPaymentCredential(reencrypted, "PAYSTACK_SECRET_KEY"), "saved-provider-secret");
    assert.equal(decryptPaymentCredentialWithRotation(reencrypted, "PAYSTACK_SECRET_KEY").needsRotation, false);
  } finally {
    if (oldCurrent === undefined) delete process.env[currentName];
    else process.env[currentName] = oldCurrent;
    if (oldPrevious === undefined) delete process.env[previousName];
    else process.env[previousName] = oldPrevious;
  }
});
