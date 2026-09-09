---
name: Maintenance asset bypass
description: Constraints for serving a React maintenance screen without blank pages or reload loops
---

Maintenance mode should return a `503` for API requests while allowing the document, JavaScript, CSS, Vite resources, and service-worker files to load. Service-worker update events must not unconditionally reload the page.

**Why:** Blocking non-API requests during maintenance prevents the React bundle from loading, and an unconditional `controllerchange` reload can repeatedly refresh clients while the service worker is updating.

**How to apply:** Keep the maintenance gate API-scoped, let the client render the maintenance page, and prefer a user-triggered refresh or a guarded update flow over automatic `window.location.reload()` on service-worker changes.