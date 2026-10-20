---
name: GreenPay mobile preview API
description: Same-origin API routing for the GreenPay mobile web preview.
---

In development web preview, the mobile app should use Metro's same-origin `/api` proxy. Native mobile builds and production builds should continue using the configured API host.

**Why:** Browser sign-in and signup repeatedly failed with `Failed to fetch` even though the API host and CORS preflight worked independently. Same-origin proxying also keeps the API session cookie on the preview origin.

**How to apply:** When changing the mobile API client or Metro configuration, keep the `/api` proxy limited to development and preserve direct API-host requests for native and production runtimes.
