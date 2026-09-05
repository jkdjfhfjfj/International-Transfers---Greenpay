export function formatPayHeroPhone(value: unknown): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
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