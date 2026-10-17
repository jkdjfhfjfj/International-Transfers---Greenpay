---
name: GreenPay payment copy
description: Project-specific rules for payment wording and configuration boundaries.
---

For GreenPay, keep payment-integration names out of customer-facing payment copy, notices, errors, and transaction descriptions. Provider names and exact credential-variable names may appear on the admin-only setup/readiness screen. Preserve currency-based routing internally. Provider credentials may come from Replit Secrets or an encrypted admin-database fallback; matching Replit Secrets take priority. Keep the encryption key in Replit Secrets and do not return or log credential values.

**Why:** The user asked for generic customer-facing payment text and chose an admin-managed database fallback, while requiring encrypted storage and environment-secret precedence.

**How to apply:** Use generic language in customer UI, transaction descriptions, and public API errors. Keep internal service identifiers intact. In admin-only setup UI, accept provider values only through the encrypted credential flow, show source/readiness without returning saved values, and keep non-secret settings separate. Do not rotate the encryption key without re-encrypting saved credentials.

Do not mention administrator configuration in customer-facing payment availability copy. Explain whether an option can be used now, or that availability could not be checked, without referring users to internal controls.

**Why:** The user asked to remove administrator references from the customer payment flow.

**How to apply:** Keep admin setup language in admin-only screens; use neutral readiness language on card and wallet payment screens.

For card-purchase payment instructions, identify the merchant as **Greenpay.co.ke** and call the payment method **Paybill / Till**, not “manual.” Keep these directions in the virtual-card purchase flow, not on the merchant-payment page.

**Why:** The user clarified that Paybill / Till instructions are for card purchase, not merchant payments, and specified the merchant identity and customer-facing label.

**How to apply:** Show current Paybill / Till details and M-PESA steps in virtual-card purchase. Do not invent merchant numbers; use configured current details or direct users to Greenpay.co.ke. Keep merchant-payment pages separate.
