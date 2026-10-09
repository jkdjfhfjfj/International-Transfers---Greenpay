---
name: GreenPay payment settlement
description: Payment routing and settlement safety rules for GreenPay.
---

For GreenPay, use the configured provider for the customer's authenticated profile and payment method. A callback's success claim alone is not proof: confirm the provider status and match its charge amount and currency to server-side transaction metadata before settling. If the provider-confirmed response omits either value, do not infer it from local metadata or an unsigned callback; leave the transaction pending for review. Make wallet credit and card activation idempotent, and report success only after the wallet is credited or the card is active. Keep signed PayzaAPI webhook verification in place.

**Why:** The user requires verified provider routing, exact charge validation, and no success message before settlement.

**How to apply:** Apply these checks to every payment callback, status poll, and customer verification route. Never treat client-supplied country, amount, or currency as authoritative.
