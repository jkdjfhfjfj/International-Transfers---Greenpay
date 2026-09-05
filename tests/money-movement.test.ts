import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransitionWithdrawal,
  getWithdrawalFee,
  getWithdrawalLedgerKeys,
  getWithdrawalTotals,
} from "../server/services/money-movement";

test("uses the currency-specific withdrawal fee before the default fee", () => {
  assert.equal(
    getWithdrawalFee("KES", {
      withdrawal_fee_KES: "25",
      withdrawal_fee: "0.50",
    }),
    25,
  );
  assert.equal(
    getWithdrawalFee("usd", {
      withdrawal_fee_USD: "1.25",
      withdrawal_fee: "0.50",
    }),
    1.25,
  );
});

test("falls back to the default fee when the currency fee is missing", () => {
  assert.equal(getWithdrawalFee("EUR", { withdrawal_fee: "0.75" }), 0.75);
  assert.equal(getWithdrawalFee("GBP", { withdrawal_fee_GBP: "0", withdrawal_fee: "0.75" }), 0);
  assert.equal(getWithdrawalFee("USD", {}, 0.5), 0.5);
});

test("calculates the amount, fee, and total wallet deduction", () => {
  assert.deepEqual(getWithdrawalTotals("100.00", "2.50"), {
    amount: 100,
    fee: 2.5,
    totalDeduction: 102.5,
  });
  assert.deepEqual(getWithdrawalTotals("not-a-number", "-2"), {
    amount: 0,
    fee: 0,
    totalDeduction: 0,
  });
});

test("uses stable idempotency keys for settlement and refund", () => {
  assert.deepEqual(getWithdrawalLedgerKeys("tx-123"), {
    settlement: "withdrawal:tx-123:settled",
    refund: "withdrawal:tx-123:refund",
  });
});

test("only pending withdrawals can transition to completed or failed", () => {
  assert.equal(canTransitionWithdrawal("pending", "completed"), true);
  assert.equal(canTransitionWithdrawal("pending", "failed"), true);
  assert.equal(canTransitionWithdrawal("completed", "failed"), false);
  assert.equal(canTransitionWithdrawal("failed", "completed"), false);
  assert.equal(canTransitionWithdrawal("pending", "pending"), true);
});