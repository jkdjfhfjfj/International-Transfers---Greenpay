import assert from "node:assert/strict";
import test from "node:test";
import {
  canUseManualMpesaWalletDeposit,
  normalizeManualMpesaAmount,
  normalizeManualMpesaReference,
} from "../server/services/manual-mpesa.ts";

test("manual wallet M-Pesa requires the global switch, manual switch, Kenya, and KES", () => {
  const eligible = {
    globalDepositsEnabled: true,
    manualMpesaEnabled: true,
    isKenyanUser: true,
    walletCurrency: "kes",
  };

  assert.equal(canUseManualMpesaWalletDeposit(eligible), true);
  assert.equal(canUseManualMpesaWalletDeposit({ ...eligible, globalDepositsEnabled: false }), false);
  assert.equal(canUseManualMpesaWalletDeposit({ ...eligible, manualMpesaEnabled: false }), false);
  assert.equal(canUseManualMpesaWalletDeposit({ ...eligible, isKenyanUser: false }), false);
  assert.equal(canUseManualMpesaWalletDeposit({ ...eligible, walletCurrency: "USD" }), false);
});

test("manual wallet M-Pesa amounts are positive KES values with at most two decimals", () => {
  assert.equal(normalizeManualMpesaAmount("150"), "150.00");
  assert.equal(normalizeManualMpesaAmount("150.5"), "150.50");
  assert.equal(normalizeManualMpesaAmount("0"), null);
  assert.equal(normalizeManualMpesaAmount("-5"), null);
  assert.equal(normalizeManualMpesaAmount("1.234"), null);
  assert.equal(normalizeManualMpesaAmount("100000000"), null);
});

test("M-Pesa transaction references are normalized and validated", () => {
  assert.equal(normalizeManualMpesaReference(" ab12-cd34 "), "AB12-CD34");
  assert.equal(normalizeManualMpesaReference("ABC"), null);
  assert.equal(normalizeManualMpesaReference("AB 12 CD34"), null);
  assert.equal(normalizeManualMpesaReference("AB12/CD34"), null);
});
