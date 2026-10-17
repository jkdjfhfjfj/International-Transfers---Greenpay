export function formatPayHeroPhone(value: unknown): string | null {
  const extractPhone = (input: unknown, depth = 0): unknown => {
    if (typeof input === "string" || typeof input === "number") return input;
    if (!input || typeof input !== "object" || depth >= 3) return null;
    for (const key of ["phoneNumber", "phone", "number", "value", "nationalNumber"]) {
      const candidate = extractPhone((input as Record<string, unknown>)[key], depth + 1);
      if (candidate !== null) return candidate;
    }
    return null;
  };
  const phoneValue = extractPhone(value);
  const digits = String(phoneValue ?? "").replace(/\D/g, "");
  let phone = digits;

  if (phone.startsWith("254")) {
    phone = `0${phone.slice(3)}`;
  } else if (phone.startsWith("7") || phone.startsWith("1")) {
    phone = `0${phone}`;
  }

  return /^0[17]\d{8}$/.test(phone) ? phone : null;
}

export function formatPayHeroAmount(value: unknown): number | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const integerAmount = Math.round(amount);
  return integerAmount > 0 ? integerAmount : null;
}