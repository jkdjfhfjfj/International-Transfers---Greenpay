---
name: GreenPay card payment options
description: Product rule for showing payment choices on virtual-card purchase.
---

Always keep the supported card-purchase payment methods visible, including when a provider is not configured. Show setup/readiness clearly and prevent only unavailable actions. Crypto card payments additionally require the admin global and crypto switches plus an active matching receiving address, rechecked by the server when starting a purchase.

**Why:** The user clarified that payment options should be improved in the UI, not removed when configuration is missing; admin configuration must still control actual payment availability.

**How to apply:** On virtual-card purchase, render the full method list independently of readiness flags. Keep provider status explicit and enforce admin-controlled availability in both the options response and payment endpoint.
