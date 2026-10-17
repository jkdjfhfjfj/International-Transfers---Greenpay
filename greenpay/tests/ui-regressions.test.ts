import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../client/", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const bottomNavigation = readFileSync(new URL("src/components/bottom-navigation.tsx", root), "utf8");
const desktopTopbar = readFileSync(new URL("src/components/desktop-topbar.tsx", root), "utf8");
const notifications = readFileSync(new URL("src/components/notifications.tsx", root), "utf8");

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
