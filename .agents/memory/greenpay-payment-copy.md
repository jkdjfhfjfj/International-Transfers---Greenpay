---
name: GreenPay payment copy
description: Project-specific rules for payment wording and configuration boundaries.
---

For GreenPay, do not show payment-integration names in visible payment copy, notices, or errors. Preserve currency-based routing internally. Keep credentials in Replit Secrets; store non-secret requirements and pricing in the database.

**Why:** The user explicitly asked not to mention providers, and production credentials must not be moved into plaintext application settings.

**How to apply:** Use generic language in customer and admin payment UI, transaction descriptions, and public API errors. Keep internal service identifiers intact. Add required values separately in the deployment's Secrets configuration.
