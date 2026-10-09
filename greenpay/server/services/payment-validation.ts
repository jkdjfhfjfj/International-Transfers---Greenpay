type ProviderTransaction = {
  type: string;
  amount: string;
  currency: string;
  metadata: unknown;
};

type SupportedProvider = "paystack" | "payzaapi" | "payhero" | "nexuspay";

function normalizeCurrency(value: unknown, provider: SupportedProvider): string {
  const currency = String(value || "").trim().toUpperCase();
  return provider === "payzaapi" && currency === "SLL" ? "SLE" : currency;
}

export function expectedProviderPayment(transaction: ProviderTransaction) {
  const metadata = (transaction.metadata || {}) as Record<string, any>;
  if (transaction.type === "card_purchase") {
    return {
      amount: Number(metadata.gatewayAmount),
      currency: String(metadata.gatewayCurrency || metadata.paymentCurrency || "KES"),
    };
  }
  if (transaction.type === "deposit") {
    const localMoneyGateway = ["payhero", "nexuspay"].includes(canonicalProvider(metadata.gateway));
    if (localMoneyGateway && metadata.gatewayAmount !== undefined) {
      return {
        amount: Number(metadata.gatewayAmount),
        currency: String(metadata.gatewayCurrency || metadata.paymentCurrency || "KES"),
      };
    }
    return {
      amount: Number(metadata.paymentAmount ?? transaction.amount),
      currency: String(metadata.paymentCurrency || transaction.currency),
    };
  }
  return null;
}

function canonicalProvider(value: unknown): string {
  const provider = String(value || "").trim().toLowerCase();
  return ["makamesco", "makamescopay"].includes(provider) ? "nexuspay" : provider;
}

export function matchesProviderPayment(
  transaction: ProviderTransaction,
  provider: SupportedProvider,
  actualAmount: unknown,
  actualCurrency: unknown,
  amountIsMinorUnits = false,
): boolean {
  const metadata = (transaction.metadata || {}) as Record<string, any>;
  const expected = expectedProviderPayment(transaction);
  const amount = Number(actualAmount);
  const normalizedAmount = amountIsMinorUnits ? amount / 100 : amount;
  const configuredProvider = canonicalProvider(metadata.gateway);
  const actualProvider = canonicalProvider(provider);
  const currency = normalizeCurrency(actualCurrency, provider);
  const expectedCurrency = normalizeCurrency(expected?.currency, provider);

  return Boolean(
    expected &&
    configuredProvider === actualProvider &&
    Number.isFinite(expected.amount) &&
    expected.amount > 0 &&
    Number.isFinite(normalizedAmount) &&
    Math.abs(normalizedAmount - expected.amount) < 0.01 &&
    expectedCurrency &&
    currency === expectedCurrency,
  );
}
