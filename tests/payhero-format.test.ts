import assert from "node:assert/strict";
import test from "node:test";
import { formatPayHeroAmount, formatPayHeroPhone } from "../server/services/payhero-format";

test("formats PayHero phone numbers as Kenyan local numbers", () => {
  assert.equal(formatPayHeroPhone("+254 787 677 676"), "0787677676");
  assert.equal(formatPayHeroPhone("787677676"), "0787677676");
  assert.equal(formatPayHeroPhone("0787677676"), "0787677676");
});

test("rejects phone numbers that do not match PayHero's documented format", () => {
  assert.equal(formatPayHeroPhone("+1 202 555 0144"), null);
  assert.equal(formatPayHeroPhone("078767767"), null);
  assert.equal(formatPayHeroPhone(""), null);
});

test("formats PayHero amounts as positive integers", () => {
  assert.equal(formatPayHeroAmount("100.4"), 100);
  assert.equal(formatPayHeroAmount(100), 100);
  assert.equal(formatPayHeroAmount(0), null);
  assert.equal(formatPayHeroAmount("not-an-amount"), null);
});