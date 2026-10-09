import assert from "node:assert/strict";
import test from "node:test";
import { depositBonusMatchesMethod } from "../shared/deposit-bonus-methods.ts";

test("mobile-money offers match legacy M-Pesa and NexusPay bonus settings", () => {
  assert.equal(depositBonusMatchesMethod("mpesa", "mobile_money"), true);
  assert.equal(depositBonusMatchesMethod("nexuspay", "mobile_money"), true);
  assert.equal(depositBonusMatchesMethod("mobile_money", "mpesa"), true);
});

test("card offers do not leak into mobile-money methods", () => {
  assert.equal(depositBonusMatchesMethod("card", "mobile_money"), false);
  assert.equal(depositBonusMatchesMethod("mpesa", "card"), false);
  assert.equal(depositBonusMatchesMethod("card", "card"), true);
});

test("manual M-Pesa offers remain distinct and any-method offers match all", () => {
  assert.equal(depositBonusMatchesMethod("manual_mpesa", "manual_mpesa"), true);
  assert.equal(depositBonusMatchesMethod("manual_mpesa", "mobile_money"), false);
  assert.equal(depositBonusMatchesMethod("mpesa", "manual_mpesa"), true);
  assert.equal(depositBonusMatchesMethod("any", "card"), true);
});
