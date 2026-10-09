---
name: GreenPay deposit eligibility
description: Rules for exposing deposit methods and enforcing availability.
---

Show a deposit method only when the global deposit switch and its method-specific switch are enabled, required provider readiness is true for the authenticated user's country, and method-specific configuration exists. Crypto requires an active configured address; bank transfer requires usable bank details. A missing conversion quote may disable a method that needs it, but must not hide unrelated methods or be replaced by a fabricated rate. Enforce the same admin switches on the server.

**Why:** The user asked to show every method that is both admin-enabled and genuinely configured for the authenticated user's country, without false readiness when a quote or provider setup is missing.

**How to apply:** Build the customer method list from authenticated-user country, server readiness, admin switches, and configured addresses/details. Keep UI visibility and server enforcement aligned.
