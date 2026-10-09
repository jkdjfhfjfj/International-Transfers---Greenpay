import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const ENCRYPTION_KEY_ENV = "PAYMENT_CREDENTIALS_ENCRYPTION_KEY";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KDF_SALT = "greenpay:payment-provider-credentials:v1";
const MIN_SECRET_LENGTH = 32;
let cachedSecret: string | undefined;
let cachedEncryptionKey: Buffer | undefined;

function deriveEncryptionKey(): Buffer {
  const secret = String(process.env[ENCRYPTION_KEY_ENV] || "").trim();
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} must be set to a random value of at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }
  if (secret !== cachedSecret || !cachedEncryptionKey) {
    cachedSecret = secret;
    cachedEncryptionKey = scryptSync(secret, KDF_SALT, 32);
  }
  return cachedEncryptionKey;
}

export function isPaymentCredentialEncryptionConfigured(): boolean {
  try {
    deriveEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptPaymentCredential(
  value: string,
  credentialKey: string,
): string {
  if (!value) throw new Error("Cannot encrypt an empty payment credential.");
  if (!credentialKey) throw new Error("Payment credential context is required.");

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, deriveEncryptionKey(), iv);
  cipher.setAAD(Buffer.from(credentialKey, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decryptPaymentCredential(
  encrypted: string,
  credentialKey: string,
): string {
  if (!credentialKey) throw new Error("Payment credential context is required.");
  const [version, encodedIv, encodedAuthTag, encodedCiphertext, ...extra] =
    String(encrypted || "").split(".");
  if (
    version !== "v1" ||
    !encodedIv ||
    !encodedAuthTag ||
    !encodedCiphertext ||
    extra.length > 0
  ) {
    throw new Error("Saved payment credential has an unsupported format.");
  }

  const iv = Buffer.from(encodedIv, "base64");
  const authTag = Buffer.from(encodedAuthTag, "base64");
  const ciphertext = Buffer.from(encodedCiphertext, "base64");
  if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) {
    throw new Error("Saved payment credential is invalid.");
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, deriveEncryptionKey(), iv);
    decipher.setAAD(Buffer.from(credentialKey, "utf8"));
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error(
      `Unable to decrypt an admin-saved payment credential. Confirm ${ENCRYPTION_KEY_ENV} matches the key used when it was saved.`,
    );
  }
}
