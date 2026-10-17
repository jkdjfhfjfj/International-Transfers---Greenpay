---
name: GreenPay account deletion
description: Product and safety rules for user-requested account deletion.
---

Account deletion must be a request with a required reason, current-password confirmation, and explicit typed confirmation. An administrator must approve it. Approval disables sign-in and redacts identifying profile fields, but does not erase financial or KYC records. Block approval while balances, card funds, or pending transactions remain.

**Why:** The user requested strict safeguards, a reason, and admin approval. GreenPay contains financial history that should not be silently removed by cascading account deletion.

**How to apply:** Keep the request and decision auditable, enforce authorization and balance checks on the server, and disclose retained record categories in the user flow.
