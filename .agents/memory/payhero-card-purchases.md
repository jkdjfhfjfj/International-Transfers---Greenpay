---
name: PayHero card purchase completion
description: PayHero card purchases depend on an early pending transaction, resilient callback parsing, and idempotent activation.
---

PayHero can callback immediately after an STK request and may send payment fields either at the top level or under a response object. Card activation must therefore be idempotent and status polling must be able to complete the same pending transaction.

**Why:** Creating the transaction after sending the response can lose a fast callback, while webhook retries or polling can otherwise generate duplicate cards.

**How to apply:** Persist the provider reference before or during initialization, accept both callback payload shapes, reload database credentials before provider status checks, and keep card generation safe to repeat.