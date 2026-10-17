import { storage } from "../storage";
import {
  decryptPaymentCredentialWithRotation,
  encryptPaymentCredential,
  isPaymentCredentialEncryptionConfigured,
} from "./payment-credential-crypto";

export const PAYMENT_CREDENTIAL_CATEGORY = "payment_credentials";

export const PAYMENT_PROVIDER_CREDENTIAL_KEYS = [
  "PAYHERO_USERNAME",
  "PAYHERO_PASSWORD",
  "NEXUSPAY_API_KEY",
  "PAYZA_PUBLIC_KEY",
  "PAYZA_SECRET_KEY",
  "PAYZA_WEBHOOK_SECRET",
  "PAYSTACK_SECRET_KEY_KES",
  "PAYSTACK_SECRET_KEY",
] as const;

export type PaymentProviderCredentialKey =
  (typeof PAYMENT_PROVIDER_CREDENTIAL_KEYS)[number];

export type PaymentCredentialSource =
  | "environment"
  | "encrypted_database"
  | "missing"
  | "locked"
  | "unavailable";

export type PaymentCredentialStatus = {
  configured: boolean;
  envConfigured: boolean;
  fallbackStored: boolean;
  source: PaymentCredentialSource;
  rotationNeeded: boolean;
};

export { isPaymentCredentialEncryptionConfigured };

function isCredentialKey(
  key: string,
): key is PaymentProviderCredentialKey {
  return (PAYMENT_PROVIDER_CREDENTIAL_KEYS as readonly string[]).includes(key);
}

function readSettingValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const candidate = (value as { value?: unknown }).value;
    return typeof candidate === "string" ? candidate : "";
  }
  return "";
}

export async function getPaymentCredential(
  key: PaymentProviderCredentialKey,
): Promise<string | null> {
  const envValue = String(process.env[key] || "").trim();
  if (envValue) return envValue;

  const setting = await storage.getSystemSetting(
    PAYMENT_CREDENTIAL_CATEGORY,
    key,
  );
  const encryptedValue = readSettingValue(setting?.value);
  if (!encryptedValue) return null;
  const decrypted = decryptPaymentCredentialWithRotation(encryptedValue, key);
  if (decrypted.needsRotation) {
    try {
      await storage.setSystemSetting({
        category: PAYMENT_CREDENTIAL_CATEGORY,
        key,
        value: encryptPaymentCredential(decrypted.value, key),
        description: "Encrypted payment-provider credential",
      });
    } catch {
      console.error("[Payment credentials] Could not rotate a saved credential after decrypting it.");
    }
  }
  return decrypted.value;
}

export async function getPaymentCredentialStatus(
  key: PaymentProviderCredentialKey,
): Promise<PaymentCredentialStatus> {
  const envConfigured = Boolean(String(process.env[key] || "").trim());
  let setting: Awaited<ReturnType<typeof storage.getSystemSetting>>;
  try {
    setting = await storage.getSystemSetting(PAYMENT_CREDENTIAL_CATEGORY, key);
  } catch {
    return {
      configured: envConfigured,
      envConfigured,
      fallbackStored: false,
      source: envConfigured ? "environment" : "unavailable",
      rotationNeeded: false,
    };
  }
  const fallbackStored = Boolean(readSettingValue(setting?.value));

  if (envConfigured) {
    return {
      configured: true,
      envConfigured: true,
      fallbackStored,
      source: "environment",
      rotationNeeded: false,
    };
  }
  if (!fallbackStored) {
    return {
      configured: false,
      envConfigured: false,
      fallbackStored: false,
      source: "missing",
      rotationNeeded: false,
    };
  }

  try {
    const decrypted = decryptPaymentCredentialWithRotation(readSettingValue(setting?.value), key);
    const configured = Boolean(decrypted.value.trim());
    return {
      configured,
      envConfigured: false,
      fallbackStored,
      source: configured ? "encrypted_database" : "missing",
      rotationNeeded: decrypted.needsRotation,
    };
  } catch {
    return {
      configured: false,
      envConfigured: false,
      fallbackStored,
      source: "locked",
      rotationNeeded: false,
    };
  }
}

export async function getPaymentCredentialStatuses(): Promise<
  Record<PaymentProviderCredentialKey, PaymentCredentialStatus>
> {
  const entries = await Promise.all(
    PAYMENT_PROVIDER_CREDENTIAL_KEYS.map(async (key) => [
      key,
      await getPaymentCredentialStatus(key),
    ] as const),
  );
  return Object.fromEntries(entries) as Record<
    PaymentProviderCredentialKey,
    PaymentCredentialStatus
  >;
}

export async function savePaymentCredential(
  key: string,
  value: string,
): Promise<void> {
  if (!isCredentialKey(key)) {
    throw new Error("Unsupported payment-provider credential.");
  }
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error("Payment-provider credential cannot be blank.");
  }

  await storage.setSystemSetting({
    category: PAYMENT_CREDENTIAL_CATEGORY,
    key,
    value: encryptPaymentCredential(normalizedValue, key),
    description: "Encrypted payment-provider credential",
  });
}

export async function clearPaymentCredentialFallback(
  key: string,
): Promise<void> {
  if (!isCredentialKey(key)) {
    throw new Error("Unsupported payment-provider credential.");
  }

  await storage.setSystemSetting({
    category: PAYMENT_CREDENTIAL_CATEGORY,
    key,
    value: "",
    description: "Encrypted payment-provider credential",
  });
}

export function isPaymentProviderCredentialKey(
  key: string,
): key is PaymentProviderCredentialKey {
  return isCredentialKey(key);
}
