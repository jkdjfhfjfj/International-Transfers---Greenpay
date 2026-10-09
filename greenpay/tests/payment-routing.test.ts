import assert from "node:assert/strict";
import test from "node:test";
import { getPayzaCurrencyForCountry, isKenyanCountry } from "../server/services/payzaapi";
import { matchesProviderPayment } from "../server/services/payment-validation";

test("uses profile country to select Kenya or supported Payza checkout currency", () => {
  assert.equal(isKenyanCountry("Kenya"), true);
  assert.equal(isKenyanCountry("KE"), true);
  assert.equal(isKenyanCountry("Nigeria"), false);
  assert.equal(getPayzaCurrencyForCountry("Nigeria"), "NGN");
  assert.equal(getPayzaCurrencyForCountry("Côte d'Ivoire"), "XOF");
  assert.equal(getPayzaCurrencyForCountry("Sierra Leone"), "SLE");
  assert.equal(getPayzaCurrencyForCountry("South Africa"), "USD");
  assert.equal(getPayzaCurrencyForCountry(""), undefined);
});

test("requires an exact provider, amount, and currency match before settlement", () => {
  const payzaDeposit = {
    type: "deposit",
    amount: "500.00",
    currency: "USD",
    metadata: {
      gateway: "payzaapi",
      paymentAmount: 75000,
      paymentCurrency: "NGN",
    },
  };

  assert.equal(matchesProviderPayment(payzaDeposit, "payzaapi", 75000, "NGN"), true);
  assert.equal(matchesProviderPayment(payzaDeposit, "payzaapi", 74999, "NGN"), false);
  assert.equal(matchesProviderPayment(payzaDeposit, "payzaapi", 75000, "KES"), false);
  assert.equal(matchesProviderPayment(payzaDeposit, "payzaapi", 75000, undefined), false);
  assert.equal(matchesProviderPayment(payzaDeposit, "payzaapi", undefined, "NGN"), false);
  assert.equal(matchesProviderPayment(payzaDeposit, "paystack", 75000, "NGN"), false);
  assert.equal(matchesProviderPayment(
    { ...payzaDeposit, metadata: { paymentAmount: 75000, paymentCurrency: "NGN" } },
    "payzaapi",
    75000,
    "NGN",
  ), false);
});

test("validates Paystack card purchases in minor units and the selected charge currency", () => {
  const purchase = {
    type: "card_purchase",
    amount: "60.00",
    currency: "USD",
    metadata: {
      gateway: "paystack",
      gatewayAmount: "7750",
      gatewayCurrency: "KES",
    },
  };

  assert.equal(matchesProviderPayment(purchase, "paystack", 775000, "KES", true), true);
  assert.equal(matchesProviderPayment(purchase, "paystack", 775001, "KES", true), false);
  assert.equal(matchesProviderPayment(purchase, "paystack", 775000, "USD", true), false);
});

test("validates Kenyan mobile-money deposits against the provider charge amount", () => {
  const deposit = {
    type: "deposit",
    amount: "60.00",
    currency: "USD",
    metadata: {
      gateway: "payhero",
      gatewayAmount: "7740",
      gatewayCurrency: "KES",
    },
  };

  assert.equal(matchesProviderPayment(deposit, "payhero", 7740, "KES"), true);
  assert.equal(matchesProviderPayment(deposit, "payhero", 7741, "KES"), false);
  assert.equal(matchesProviderPayment(deposit, "payhero", 7740, "USD"), false);
  assert.equal(
    matchesProviderPayment(
      { ...deposit, metadata: { ...deposit.metadata, gateway: "makamescopay" } },
      "nexuspay",
      7740,
      "KES",
    ),
    true,
  );
});
