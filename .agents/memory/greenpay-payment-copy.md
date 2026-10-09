---
name: GreenPay payment copy
description: Project-specific rules for payment wording and configuration boundaries.
---

For GreenPay, keep payment-integration names out of customer-facing payment copy, notices, errors, and transaction descriptions. Provider names and exact secret-variable names may appear on the admin-only setup/readiness screen. Preserve currency-based routing internally. Keep credentials in Replit Secrets; store non-secret requirements and pricing in the database.

**Why:** The user asked for generic customer-facing payment text and also needs administrators to identify which provider credentials to add. Production credentials must not be moved into plaintext application settings.

**How to apply:** Use generic language in customer UI, transaction descriptions, and public API errors. Keep internal service identifiers intact. In admin-only setup UI, show readiness and exact required secret names without accepting, storing, or displaying secret values; add credentials separately in the deployment's Secrets configuration.
