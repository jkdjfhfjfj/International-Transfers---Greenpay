---
name: GreenPay mobile auth redirects
description: Securely return browser-based sign-in to native GreenPay in both Expo Go and installed builds.
---

Use `Linking.createURL("auth/callback")` for the mobile auth return URI rather than hard-coding the installed app's custom scheme. Expo Go uses an `exp://` URL; installed builds use `greenpay-mobile://`. Carry the URI through the web login flow, validate it server-side against the configured Replit Expo host or installed scheme, then send only the short-lived one-time auth code.

**Why:** A hard-coded custom scheme can leave sign-in inside the browser when testing in Expo Go, and an unrestricted callback URI could leak the one-time code to an untrusted app.

**How to apply:** Keep the native URL, WebBrowser redirect URL, web handoff, and server allowlist in sync. Keep the mobile callback screen as the sole exchange owner, with duplicate-code handling for simultaneous deep-link and browser-session returns.
