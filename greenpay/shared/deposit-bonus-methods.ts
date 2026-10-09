const MOBILE_MONEY_METHODS = new Set(["mobile_money", "mpesa", "nexuspay"]);

export function depositBonusMatchesMethod(bonusMethod: unknown, paymentMethod: unknown): boolean {
  const bonus = String(bonusMethod || "").trim().toLowerCase();
  const payment = String(paymentMethod || "").trim().toLowerCase();
  if (!bonus || !payment) return false;
  if (bonus === "any") return true;

  if (payment === "manual_mpesa") {
    return bonus === "manual_mpesa" || bonus === "mpesa";
  }
  if (MOBILE_MONEY_METHODS.has(payment)) {
    return MOBILE_MONEY_METHODS.has(bonus);
  }
  return bonus === payment;
}
