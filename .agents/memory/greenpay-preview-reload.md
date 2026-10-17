---
name: GreenPay preview reload prevention
description: Avoid reload loops caused by boot-time cache clearing and automatic reload fallbacks in the Replit preview.
---

Do not automatically clear browser storage or reload when the React root is temporarily empty during startup. Replit's proxied preview can delay client mounting; repeated cache-clearing/reload fallbacks can perpetually reset the page. Prefer a visible error with a manual retry. Development service-worker cleanup should unregister and clear caches without triggering navigation.

**Why:** GreenPay's preview loop persisted after fixing a Vite HMR WebSocket mismatch. The underlying reload triggers were boot fallback scripts that redirected to a cache-clearing URL and reloaded on timers, plus a version-mismatch path that cleared all browser storage.

**How to apply:** Before adding service-worker, version, or blank-screen recovery behavior, verify it cannot trigger a navigation loop in a proxied iframe. Preserve local/session storage; do not use `Clear-Site-Data` as an automatic recovery mechanism.
