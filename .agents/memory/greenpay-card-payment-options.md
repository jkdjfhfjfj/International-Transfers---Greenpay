---
name: GreenPay card payment options
description: Product rule for showing payment choices on virtual-card purchase.
---

Always keep the supported card-purchase payment methods visible, including when a provider is not configured. Show the setup/readiness state clearly and prevent only the unavailable payment action; do not remove the method from the UI or imply it can currently complete.

**Why:** The user clarified that payment options should be improved in the UI, not removed when configuration is missing.

**How to apply:** On virtual-card purchase, render the full method list independently of provider-readiness flags. Keep provider status and payment-action availability explicit.
