---
name: External settings normalization
description: Handling JSON-quoted values read from the external Neon system_settings table.
---

Normalize values read from `system_settings` before using them as booleans, comma-separated lists, or currency codes.

**Why:** The external Neon database stores some settings through JSON conversion, so text values can arrive with surrounding quotes. Direct comparisons then silently disable valid currencies or features.

**How to apply:** Strip JSON quote characters, trim whitespace, and normalize case before splitting lists or comparing values. Prefer the authoritative supported-currency list for user wallet creation rather than a stale settings subset.