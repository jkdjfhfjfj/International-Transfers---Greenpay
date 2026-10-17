import assert from "node:assert/strict";
import test from "node:test";
import { isCryptoAvailableForCountry } from "../shared/crypto-availability";

test("configured crypto deposits are available regardless of customer country", () => {
  const countries = [
    "KE", "US", "GB", "NG", "ZA", "IN", "BR", "DE", "JP", "AU",
    "CA", "GH", "TZ", "UG", "RW", "ET", "EG", "MX", "PH", "unknown",
  ];

  for (const country of countries) {
    assert.equal(isCryptoAvailableForCountry(country, true, true, true), true, country);
  }
});

test("crypto still respects admin switches and receiving-address configuration", () => {
  assert.equal(isCryptoAvailableForCountry("US", false, true, true), false);
  assert.equal(isCryptoAvailableForCountry("KE", true, false, true), false);
  assert.equal(isCryptoAvailableForCountry("GB", true, true, false), false);
});
