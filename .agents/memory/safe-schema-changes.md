---
name: Safe schema changes
description: How to handle schema drift when an additive feature triggers an unrelated destructive diff.
---

When schema tooling proposes changing existing data types or truncating data for an unrelated drift, do not approve the destructive operation just to add a new feature table. Apply only additive, idempotent migrations. On Render, startup may apply checked-in migrations, but required migration failures must stop startup rather than being logged and ignored.

**Why:** The withdrawal-event table was additive, but the local database also had an unrelated `is_suspended` type mismatch that Drizzle wanted to convert with data loss.

**How to apply:** Inspect the generated diff, reject unrelated destructive statements, use the checked-in initial migration for an empty database, and use additive `CREATE ... IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` steps for legacy databases. Keep migrations idempotent and surface a named error when one fails.