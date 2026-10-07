export function normalizeMoneyAmount(value: string | number | null | undefined): number {
  const amount = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function getWithdrawalFee(
  currency: string,
  fees: Record<string, string | number | null | undefined>,
  fallback = 0,
): number {
  const normalizedCurrency = String(currency || "").toUpperCase();
  const currencyKey = `withdrawal_fee_${normalizedCurrency}`;
  const currencyValue = fees[currencyKey];
  const configured = currencyValue !== undefined && currencyValue !== null && String(currencyValue).trim() !== ""
    ? currencyValue
    : fees.withdrawal_fee;
  const configuredValue = configured !== undefined && configured !== null && String(configured).trim() !== ""
    ? configured
    : fallback;
  return Math.max(0, normalizeMoneyAmount(configuredValue));
}

export function getWithdrawalTotals(amount: string | number, fee: string | number) {
  const withdrawalAmount = Math.max(0, normalizeMoneyAmount(amount));
  const processingFee = Math.max(0, normalizeMoneyAmount(fee));
  return {
    amount: withdrawalAmount,
    fee: processingFee,
    totalDeduction: withdrawalAmount + processingFee,
  };
}

export function getWithdrawalLedgerKeys(transactionId: string) {
  return {
    settlement: `withdrawal:${transactionId}:settled`,
    refund: `withdrawal:${transactionId}:refund`,
  };
}

export function canTransitionWithdrawal(
  currentStatus: string | null | undefined,
  nextStatus: string,
): boolean {
  if (currentStatus === nextStatus) return true;
  if (currentStatus !== "pending") return false;
  return nextStatus === "completed" || nextStatus === "failed";
}