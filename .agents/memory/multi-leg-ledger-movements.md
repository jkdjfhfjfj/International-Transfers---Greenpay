---
name: Multi-leg ledger movements
description: Reliability rule for money movements that span more than one ledger account.
---

Every multi-account movement should treat each ledger posting as independently committed and add an idempotent compensating entry if a later leg fails. This applies to exchanges, wallet transfers, virtual-account transfers, and card funding.

**Why:** The ledger posting helper commits one target account at a time, so a failed second posting can otherwise leave a permanent orphaned debit.

**How to apply:** Use one stable movement reference for all leg idempotency keys, mark any pre-created transaction records failed on rollback, and never silently ignore a failed compensation.