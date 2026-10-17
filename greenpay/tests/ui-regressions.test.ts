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
const dashboard = readFileSync(new URL("src/pages/dashboard.tsx", root), "utf8");
const wavyHeader = readFileSync(new URL("src/components/wavy-header.tsx", root), "utf8");

test("pre-React startup shell fills mobile viewport without a default white frame", () => {
  assert.match(html, /html,\s*body,\s*#root\s*\{[^}]*margin:\s*0/s);
  assert.match(html, /#root\s*\{[^}]*min-height:\s*100svh/s);
});

test("authenticated bottom navigation remains visible inside the preview iframe", () => {
  assert.doesNotMatch(bottomNavigation, /window\.parent !== window/);
  assert.match(bottomNavigation, /const showBottomNav = isAuthenticated &&/);
  assert.ok(bottomNavigation.includes("location.startsWith('/auth/virtual-card-purchase')"));
  assert.match(bottomNavigation, /addEventListener\("open-bottom-menu", openMenu\)/);
  assert.match(dashboard, /dispatchEvent\(new CustomEvent\("open-bottom-menu"\)\)/);
});

test("bottom navigation sends users to Send and Settings directly", () => {
  assert.match(bottomNavigation, /id:\s*"send"[\s\S]*?label:\s*"Send"[\s\S]*?path:\s*"\/send-money"/);
  assert.match(bottomNavigation, /id:\s*"settings"[\s\S]*?Icon:\s*Settings2[\s\S]*?label:\s*"Settings"[\s\S]*?path:\s*"\/settings"/);
  assert.match(bottomNavigation, /onClick=\{\(\) => setLocation\(item\.path\)\}/);
  assert.doesNotMatch(bottomNavigation, /item\.id === "settings" \? setMenuOpen\(true\)/);
});

test("desktop notifications control opens the notification panel", () => {
  assert.match(desktopTopbar, /onClick=\{openNotifications\}/);
  assert.match(desktopTopbar, /new Event\("open-notifications"\)/);
  assert.match(notifications, /addEventListener\("open-notifications"/);
});

test("Kenyan card purchase keeps each supported funding option visible", () => {
  assert.match(cardPurchase, /id: "mobile_money"[\s\S]*?testId: "option-mobile-money"/);
  assert.match(cardPurchase, /id: "card"[\s\S]*?testId: "option-card-payment"/);
  assert.match(cardPurchase, /id: "manual"[\s\S]*?testId: "option-manual-payment"/);
  assert.match(cardPurchase, /id: "bank_transfer"[\s\S]*?testId: "option-bank-transfer"/);
  assert.match(cardPurchase, /id: "crypto"/);
  assert.doesNotMatch(cardPurchase, /disabled=\{option\.disabled\}/);
  assert.match(cardPurchase, /paymentOptionsLoading &&/);
});

test("Paybill and Till directions appear in card purchase, not merchant pay", () => {
  assert.match(cardPurchase, /Lipa na M-PESA/);
  assert.match(cardPurchase, /Buy Goods and Services/);
  assert.match(cardPurchase, /check that the merchant name is/);
  assert.match(cardPurchase, /Check current Greenpay\.co\.ke details/);
  assert.doesNotMatch(merchantPay, /PAYMENT_STEPS|Lipa na M-PESA|Buy Goods and Services/);
});

test("Merchant Pay stays focused on merchant instructions and has no back button", () => {
  assert.doesNotMatch(merchantPay, /virtual.?card/i);
  assert.doesNotMatch(merchantPay, /ArrowLeft|Back to dashboard|setLocation/);
  assert.match(merchantPay, /title="Merchant Pay"/);
  assert.match(merchantPay, /button-open-merchant-guidance/);
});

test("wavy header retains its original teal gradient and accents", () => {
  assert.match(wavyHeader, /linearGradient id="waveGrad"/);
  assert.match(wavyHeader, /fill="url\(#waveGrad\)"/);
  assert.match(wavyHeader, /fill=\{BRAND_MID\} opacity="0\.55"/);
  assert.match(wavyHeader, /stroke=\{BRAND_STROKE\}/);
  assert.match(wavyHeader, /opacity="0\.5"/);
});
