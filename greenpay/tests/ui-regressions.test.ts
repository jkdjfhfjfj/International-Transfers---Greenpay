import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../client/", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const bottomNavigation = readFileSync(new URL("src/components/bottom-navigation.tsx", root), "utf8");
const desktopTopbar = readFileSync(new URL("src/components/desktop-topbar.tsx", root), "utf8");
const notifications = readFileSync(new URL("src/components/notifications.tsx", root), "utf8");
const cardPurchase = readFileSync(new URL("src/pages/auth/virtual-card-purchase.tsx", root), "utf8");
const merchantPay = readFileSync(new URL("src/pages/merchant-pay.tsx", root), "utf8");

test("pre-React startup shell fills mobile viewport without a default white frame", () => {
  assert.match(html, /html,\s*body,\s*#root\s*\{[^}]*margin:\s*0/s);
  assert.match(html, /#root\s*\{[^}]*min-height:\s*100svh/s);
});

test("authenticated bottom navigation remains visible inside the preview iframe", () => {
  assert.match(bottomNavigation, /const isAuthPopup = window\.opener !== null/);
  assert.doesNotMatch(bottomNavigation, /window\.parent !== window/);
  assert.match(bottomNavigation, /!isAuthPopup && isAuthenticated/);
});

test("desktop notifications control opens the notification panel", () => {
  assert.match(desktopTopbar, /onClick=\{openNotifications\}/);
  assert.match(desktopTopbar, /new Event\("open-notifications"\)/);
  assert.match(notifications, /addEventListener\("open-notifications"/);
});

test("Kenyan card purchase keeps each supported funding option visible", () => {
  assert.match(cardPurchase, /id: "mobile_money"[\s\S]*?disabled: !paymentOptions\.mobileMoney/);
  assert.match(cardPurchase, /id: "card"[\s\S]*?disabled: !paymentOptions\.card/);
  assert.match(cardPurchase, /id: "manual"[\s\S]*?testId: "option-manual-payment"/);
  assert.match(cardPurchase, /id: "crypto"/);
});

test("Paybill and Till directions appear in card purchase, not merchant pay", () => {
  assert.match(cardPurchase, /Lipa na M-PESA/);
  assert.match(cardPurchase, /Buy Goods and Services/);
  assert.match(cardPurchase, /check that the merchant name is/);
  assert.match(cardPurchase, /Check current Greenpay\.co\.ke details/);
  assert.doesNotMatch(merchantPay, /PAYMENT_STEPS|Lipa na M-PESA|Buy Goods and Services/);
});
