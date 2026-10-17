import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../client/", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const bottomNavigation = readFileSync(new URL("src/components/bottom-navigation.tsx", root), "utf8");
const desktopTopbar = readFileSync(new URL("src/components/desktop-topbar.tsx", root), "utf8");
const notifications = readFileSync(new URL("src/components/notifications.tsx", root), "utf8");
const cardPurchase = readFileSync(new URL("src/pages/auth/virtual-card-purchase.tsx", root), "utf8");
const serverRoutes = readFileSync(new URL("../server/routes.ts", import.meta.url), "utf8");
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
  assert.match(cardPurchase, /Confirm virtual card purchase/);
  assert.match(cardPurchase, /Your card is activated only after payment is confirmed/);
  assert.match(cardPurchase, /api\/crypto\/transactions/);
  assert.match(cardPurchase, /transaction\?\.status === "completed"/);
  assert.match(cardPurchase, /depositAddress/);
  assert.match(cardPurchase, /cryptoPaymentDetails\.address/);
});

test("card payment returns show the purchase result without a generic success or failure page", () => {
  assert.match(serverRoutes, /cardPurchaseReturn\(String\(actualReference\), "success"\)/);
  assert.match(serverRoutes, /cardPurchaseReturn\(String\(actualReference\), "failed"/);
});

test("crypto card checkout requires a configured receiving address and activates after admin confirmation", () => {
  assert.match(serverRoutes, /cryptoCoins/);
  assert.match(serverRoutes, /Crypto card payments in \$\{normalizedCoin\} are not configured/);
  assert.match(serverRoutes, /toAddress: chosenAddress\.address/);
  assert.match(serverRoutes, /Crypto payment confirmed by administrator/);
  assert.match(serverRoutes, /verifiedConfirmations < Number\(cryptoTx\.requiredConfirmations/);
  assert.match(cardPurchase, /!cryptoConfigured \|\| cryptoCardPurchase\.isPending/);
  assert.match(cardPurchase, /cryptoPaymentDetails\.address/);
  assert.match(readFileSync(new URL("src/pages/admin-crypto.tsx", root), "utf8"), /Verified confirmations/);
});

test("top-right app menu exposes direct wallet, send, card, and history shortcuts", () => {
  assert.match(bottomNavigation, /label: "Wallets", path: "\/dashboard"/);
  assert.match(bottomNavigation, /label: "Send money", path: "\/send-money"/);
  assert.match(bottomNavigation, /label: "Virtual card", path: "\/virtual-card"/);
  assert.match(bottomNavigation, /label: "Transactions", path: "\/transactions"/);
});

test("dashboard wallet creation only offers server-enabled currencies and reports load failures", () => {
  assert.match(dashboard, /currencyData\?\.enabled/);
  assert.match(dashboard, /availableWalletCurrencies\.map/);
  assert.match(dashboard, /Wallets could not be loaded/);
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
  assert.doesNotMatch(merchantPay, /Store|ShieldCheck|title="Merchant Pay"|subtitle="Payment guidance/);
  assert.match(merchantPay, /<WavyHeader\s+size="md"\s*\/>/);
  assert.match(merchantPay, /<main className="mx-auto mt-5/);
  assert.match(merchantPay, /button-open-merchant-guidance/);
  assert.match(bottomNavigation, /location\.startsWith\('\/merchant-pay'\)/);
});

test("password reset actions stay fixed at the bottom with short Android-style labels", () => {
  const forgotPassword = readFileSync(new URL("src/pages/auth/forgot-password.tsx", root), "utf8");
  const resetPassword = readFileSync(new URL("src/pages/auth/reset-password.tsx", root), "utf8");
  assert.match(forgotPassword, /fixed inset-x-0 bottom-0/);
  assert.match(forgotPassword, /Send Reset Code/);
  assert.match(forgotPassword, />\s*Back\s*</);
  assert.match(resetPassword, /fixed bottom-0 left-0 right-0/);
  assert.match(resetPassword, /: "Reset"\}/);
  assert.match(resetPassword, />\s*Back\s*</);
});

test("card purchase methods stay visible while unavailable actions obey admin readiness", () => {
  const virtualCard = readFileSync(new URL("src/pages/virtual-card.tsx", root), "utf8");
  assert.match(virtualCard, /data-testid="button-payment-mobile-money"/);
  assert.match(virtualCard, /data-testid="button-payment-card"/);
  assert.match(virtualCard, /data-testid="button-payment-manual"/);
  assert.match(virtualCard, /data-testid="button-payment-crypto"/);
  assert.match(virtualCard, /disabled=\{!paymentOptions\?\.mobileMoney\}/);
  assert.match(virtualCard, /disabled=\{!paymentOptions\?\.card\}/);
  assert.match(virtualCard, /disabled=\{!manualPaymentEnabled\}/);
  assert.match(virtualCard, /disabled=\{!cryptoConfigured\}/);
});

test("wavy header retains its original teal gradient and accents", () => {
  assert.match(wavyHeader, /linearGradient id="waveGrad"/);
  assert.match(wavyHeader, /fill="url\(#waveGrad\)"/);
  assert.match(wavyHeader, /fill=\{BRAND_MID\} opacity="0\.55"/);
  assert.match(wavyHeader, /stroke=\{BRAND_STROKE\}/);
  assert.match(wavyHeader, /opacity="0\.5"/);
});
