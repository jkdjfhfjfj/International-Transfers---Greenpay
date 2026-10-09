export function canUseManualMpesaWalletDeposit(input: {
  globalDepositsEnabled: boolean;
  manualMpesaEnabled: boolean;
  isKenyanUser: boolean;
  walletCurrency: unknown;
}): boolean {
  return input.globalDepositsEnabled &&
    input.manualMpesaEnabled &&
    input.isKenyanUser &&
    String(input.walletCurrency || "").trim().toUpperCase() === "KES";
}

export function normalizeManualMpesaAmount(value: unknown): string | null {
  const amount = String(value ?? "").trim();
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(amount)) return null;
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 99_999_999.99) return null;
  return parsedAmount.toFixed(2);
}

export function normalizeManualMpesaReference(value: unknown): string | null {
  const reference = String(value ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,64}$/.test(reference)) return null;
  return reference;
}
