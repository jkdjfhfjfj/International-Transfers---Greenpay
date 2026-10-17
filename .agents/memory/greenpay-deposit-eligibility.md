---
name: GreenPay deposit eligibility
description: Rules for exposing deposit methods and enforcing availability.
---

Show a deposit method only when the global deposit switch and its method-specific switch are enabled, required provider readiness is true for the authenticated user's country, and method-specific configuration exists. Mobile Money and Card options are available in provider-supported regions, with the selected channel routed through that country's configured provider. Crypto is country-independent and requires an active configured address; bank transfer requires usable bank details. A missing conversion quote may disable a method that needs it, but must not hide unrelated methods or be replaced by a fabricated rate. Enforce the same admin switches on the server.

**Why:** The user asked to show every method that is both admin-enabled and genuinely configured for the authenticated user's country, without false readiness when a quote or provider setup is missing, and explicitly requires crypto to be available in all countries.

**How to apply:** Build country-specific method eligibility from authenticated-user country, server readiness, admin switches, and configured details. Do not apply country gates to crypto; require its global and method switches plus an active address. Carry the selected channel into provider initialization and offer matching; keep UI visibility and server enforcement aligned.
