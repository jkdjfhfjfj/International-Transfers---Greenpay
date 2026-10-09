---
name: GreenPay payment copy
description: Project-specific rules for payment wording and configuration boundaries.
---

For GreenPay, keep payment-integration names out of customer-facing payment copy, notices, errors, and transaction descriptions. Provider names and exact credential-variable names may appear on the admin-only setup/readiness screen. Preserve currency-based routing internally. Provider credentials may come from Replit Secrets or an encrypted admin-database fallback; matching Replit Secrets take priority. Keep the encryption key in Replit Secrets and do not return or log credential values.

**Why:** The user asked for generic customer-facing payment text and chose an admin-managed database fallback, while requiring encrypted storage and environment-secret precedence.

**How to apply:** Use generic language in customer UI, transaction descriptions, and public API errors. Keep internal service identifiers intact. In admin-only setup UI, accept provider values only through the encrypted credential flow, show source/readiness without returning saved values, and keep non-secret settings separate. Do not rotate the encryption key without re-encrypting saved credentials.

For customer-facing merchant-payment instructions, name the merchant **Greenpay.co.ke** and call the payment method **Paybill / Till**, not “manual.”

**Why:** The user specified this merchant identity and customer-facing label.

**How to apply:** Use the Greenpay.co.ke link and Paybill / Till wording on the Services entry and instructions page; retain existing internal route and configuration identifiers.
