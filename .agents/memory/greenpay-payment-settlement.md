---
name: GreenPay payment settlement
description: Payment routing and settlement safety rules for GreenPay.
---

For GreenPay, use the configured provider for the customer's authenticated profile and payment method. A callback's success claim alone is not proof: confirm the provider status and match its charge amount and currency to server-side transaction metadata before settling. If the provider-confirmed response omits either value, do not infer it from local metadata or an unsigned callback; leave the transaction pending for review. Make wallet credit and card activation idempotent, and report success only after the wallet is credited or the card is active. Keep signed PayzaAPI webhook verification in place.

**Why:** The user requires verified provider routing, exact charge validation, and no success message before settlement.

**How to apply:** Apply these checks to every payment callback, status poll, and customer verification route. Never treat client-supplied country, amount, or currency as authoritative.

For manual card payments, the admin-controlled option is instructions-only: showing paybill details must not create a completed transaction or activate a card. The current UI directs users to support for payment verification.

**Why:** The user chose instructions-only rather than receipt upload and admin approval for card purchases.

**How to apply:** Keep manual instructions conditional on the admin setting; maintain the rule that card activation follows verified payment, not display of payment details.

The same admin-controlled manual M-Pesa configuration applies to Kenyan virtual-card purchases and wallet deposits. Wallet manual payments are KES-only and must stay pending until an admin verifies and credits the deposit.

**Why:** The user explicitly chose both flows, while requiring customer funds to remain uncredited until verification.

**How to apply:** Keep wallet deposits gated by the global deposit switch, the manual-M-Pesa switch, Kenyan account country, and a KES destination wallet. Use the shared paybill/account settings; do not activate a card or credit a wallet from displayed instructions alone.
