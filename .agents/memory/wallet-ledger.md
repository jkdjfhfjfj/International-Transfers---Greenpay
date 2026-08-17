---
name: Wallet ledger authority
description: The per-currency wallet ledger is the source of truth for user balances.
---

Wallet balances, including regular holds and withdrawal holds, are authoritative. Legacy user-level balance fields may remain for compatibility responses, but new financial mutations should read and write the matching wallet.

**Why:** Multiple features previously mixed legacy USD/KES fields with per-currency wallets, causing users to see different balances across deposits, exchanges, withdrawals, cards, airtime, and bills.

**How to apply:** Normalize currency codes, resolve the matching wallet, subtract both hold types when checking availability, and use conditional wallet updates for debits. Keep automatic schema migrations additive and non-destructive.