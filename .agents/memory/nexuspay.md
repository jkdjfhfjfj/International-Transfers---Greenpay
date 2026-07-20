---
name: NexusPay multi-currency integration
description: How NexusPay deposits, multi-currency wallets, and exchange rates are wired together
---

# NexusPay Multi-Currency Integration

## Key decisions

- **USD and KES** stay in `users.balance` / `users.kesBalance` columns — not moved to wallets table (backward compat).
- **All other currencies** (UGX, NGN, GHS, ZAR, XOF, etc.) stored in the `wallets` table per user.
- **NexusPay** is collection-only (deposits), not payout. Base URL: `https://app.makamescopay.com/api`, Bearer auth via `NEXUSPAY_API_KEY`.
- If `NEXUSPAY_API_KEY` is missing, the endpoint returns `{ configured: false }` — UI shows a warning instead of crashing.
- Exchange uses `/api/exchange/convert-multi` — 1.5% fee, admin-set manual rates override live rates.

## Admin panel
- Route: `/admin/wallet-rates` — two tabs: User Wallets (adjust balances) and Exchange Rates (add/edit/delete manual rates).
- `AdminShell` is a **default export** from `admin-shell.tsx` — import as `import AdminShell from "@/components/admin/admin-shell"`.

## Deposit page
- Added `"mobile_money"` as a method type alongside mpesa/crypto/bank_transfer/card.
- `NexusPayForm` component inside deposit.tsx handles country/channel/phone/amount selection.
- Mobile Money is always enabled (no admin toggle needed), others need `{method}_enabled === "true"` in system_settings.

**Why:** NexusPay allows deposits in African currencies directly to per-currency wallets, enabling the exchange flow across 14+ currencies.
