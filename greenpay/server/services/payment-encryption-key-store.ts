import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";
import { storage } from "../storage";
import { decryptPaymentCredentialWithRotation } from "./payment-credential-crypto";

const CATEGORY = "security";
const SETTING_KEY = "payment_credentials_encryption_key";
const ENV_KEY = "PAYMENT_CREDENTIALS_ENCRYPTION_KEY";
const PREVIOUS_ENV_KEY = "PAYMENT_CREDENTIALS_ENCRYPTION_KEY_PREVIOUS";
const WRAP_ALGORITHM = "aes-256-gcm";
const WRAP_SALT = "greenpay:payment-encryption-key-wrap:v1";
const MIN_KEY_LENGTH = 32;
let loadedFromDatabase = false;

function wrappingKey(): Buffer {
  const secret = String(process.env.SESSION_SECRET || "").trim();
  if (secret.length < MIN_KEY_LENGTH) {
    throw new Error("SESSION_SECRET must be configured to protect the database encryption key.");
  }
  return scryptSync(secret, WRAP_SALT, 32);
}

function wrapKey(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(WRAP_ALGORITHM, wrappingKey(), iv);
  cipher.setAAD(Buffer.from(SETTING_KEY));
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `kw1.${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${encrypted.toString("base64")}`;
}

function unwrapKey(value: unknown): string {
  const [version, ivText, tagText, encryptedText, ...extra] = String(value || "").split(".");
  if (version !== "kw1" || !ivText || !tagText || !encryptedText || extra.length) {
    throw new Error("Stored encryption key has an unsupported format.");
  }
  const iv = Buffer.from(ivText, "base64");
  const tag = Buffer.from(tagText, "base64");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Stored encryption key is invalid.");
  const decipher = createDecipheriv(WRAP_ALGORITHM, wrappingKey(), iv);
  decipher.setAAD(Buffer.from(SETTING_KEY));
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getDatabasePaymentEncryptionKey(): Promise<string | null> {
  const setting = await storage.getSystemSetting(CATEGORY, SETTING_KEY);
  if (!setting?.value) return null;
  const value = unwrapKey(setting.value);
  if (value.trim().length < MIN_KEY_LENGTH) throw new Error("Stored encryption key is too short.");
  return value;
}

export async function getPaymentEncryptionKeyStatus() {
  let databaseKeyConfigured = false;
  let databaseKeyReadable = false;
  try {
    const value = await getDatabasePaymentEncryptionKey();
    databaseKeyConfigured = Boolean(value);
    databaseKeyReadable = true;
  } catch {
    databaseKeyConfigured = true;
  }
  const hasValidKey = String(process.env[ENV_KEY] || "").trim().length >= MIN_KEY_LENGTH;
  const environmentKeyConfigured = hasValidKey && !loadedFromDatabase;
  const databaseKeyIsActive = hasValidKey && loadedFromDatabase;
  return {
    source: environmentKeyConfigured ? "environment" : databaseKeyIsActive || (databaseKeyConfigured && databaseKeyReadable) ? "database" : databaseKeyConfigured ? "locked" : "missing",
    environmentKeyConfigured,
    databaseKeyConfigured,
    databaseKeyReadable,
    wrappingKeyAvailable: String(process.env.SESSION_SECRET || "").trim().length >= MIN_KEY_LENGTH,
    persistentStorageAvailable: Boolean(process.env.DATABASE_URL),
  } as const;
}

export async function hydratePaymentEncryptionKey(): Promise<void> {
  const environmentKey = String(process.env[ENV_KEY] || "").trim();
  if (environmentKey.length >= MIN_KEY_LENGTH) return;
  try {
    const databaseKey = await getDatabasePaymentEncryptionKey();
    if (databaseKey) {
      process.env[ENV_KEY] = databaseKey;
      loadedFromDatabase = true;
    }
  } catch (error) {
    console.error("[Payment encryption] Database key fallback could not be loaded.");
  }
}

export async function saveDatabasePaymentEncryptionKey(value: string): Promise<void> {
  const key = value.trim();
  if (key.length < MIN_KEY_LENGTH) throw new Error("Encryption key must contain at least 32 characters.");
  const environmentKey = String(process.env[ENV_KEY] || "").trim();
  if (environmentKey.length >= MIN_KEY_LENGTH && environmentKey !== key) {
    throw new Error("The database fallback must match the active environment key while it is configured.");
  }
  const existingSetting = await storage.getSystemSetting(CATEGORY, SETTING_KEY);
  if (existingSetting?.value) {
    let existingDatabaseKey: string;
    try {
      existingDatabaseKey = unwrapKey(existingSetting.value);
    } catch {
      throw new Error("The saved database key cannot be decrypted; it was left unchanged.");
    }
    if (existingDatabaseKey !== key) {
      throw new Error("A database encryption key is already set. Changing it requires credential rotation.");
    }
  }
  if (environmentKey.length < MIN_KEY_LENGTH && !existingSetting?.value) {
    const savedCredentials = (await storage.getSystemSettings()).filter(setting =>
      setting.category === "payment_credentials" &&
      typeof setting.value === "string" &&
      setting.value.length > 0,
    );
    if (savedCredentials.length > 0) {
      const previousActiveKey = process.env[ENV_KEY];
      const previousKey = process.env[PREVIOUS_ENV_KEY];
      try {
        process.env[ENV_KEY] = key;
        delete process.env[PREVIOUS_ENV_KEY];
        for (const setting of savedCredentials) {
          decryptPaymentCredentialWithRotation(setting.value, setting.key);
        }
      } catch {
        throw new Error("This key does not decrypt all saved provider credentials; they were left unchanged.");
      } finally {
        if (previousActiveKey === undefined) delete process.env[ENV_KEY];
        else process.env[ENV_KEY] = previousActiveKey;
        if (previousKey === undefined) delete process.env[PREVIOUS_ENV_KEY];
        else process.env[PREVIOUS_ENV_KEY] = previousKey;
      }
    }
  }
  const wrappedValue = wrapKey(key);
  await storage.setSystemSetting({
    category: CATEGORY,
    key: SETTING_KEY,
    value: wrappedValue,
    description: "Wrapped payment-credential encryption key",
  });
  if (environmentKey.length < MIN_KEY_LENGTH) {
    process.env[ENV_KEY] = key;
    loadedFromDatabase = true;
  }
}
