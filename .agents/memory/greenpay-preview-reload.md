---
name: GreenPay preview reload prevention
description: Avoid reload loops caused by boot-time cache clearing and automatic reload fallbacks in the Replit preview.
---

Do not automatically clear browser storage or reload when the React root is temporarily empty during startup. Replit's proxied preview can delay client mounting; repeated cache-clearing/reload fallbacks can perpetually reset the page. Keep the pre-React shell and auth loader visible until the app replaces them; never hide a loader on an arbitrary timer. Bound service-worker/cache cleanup waits so a stalled browser API cannot block the app entrypoint. Prefer a visible error with a manual retry. In development, unregister old service workers and clear their caches before importing React: the worker may cache `.tsx` modules and prevent React from mounting, so component-level cleanup is too late.

**Why:** GreenPay's preview loop persisted after fixing a Vite HMR WebSocket mismatch. The underlying reload triggers were boot fallback scripts that redirected to a cache-clearing URL and reloaded on timers, plus a version-mismatch path that cleared all browser storage. A separate two-second loader timer also hid the screen while authentication was still pending, making a slow startup look like a blank page.

**How to apply:** Before adding service-worker, version, or blank-screen recovery behavior, verify it cannot trigger a navigation loop in a proxied iframe. Keep dev cache recovery before the app entrypoint, put a bounded wait around browser cleanup, keep loaders state-driven, preserve local/session storage, and do not use `Clear-Site-Data` as an automatic recovery mechanism. Responsive app navigation must remain visible in the Replit preview iframe; only suppress it in an actual popup window.
