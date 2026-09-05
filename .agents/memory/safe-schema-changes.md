---
name: Safe schema changes
description: How to handle schema drift when an additive feature triggers an unrelated destructive diff.
---

When schema tooling proposes changing existing data types or truncating data for an unrelated drift, do not approve the destructive operation just to add a new feature table. Apply only the additive development change after confirming the existing data is preserved, and rely on the platform publish flow for production schema migration.

**Why:** The withdrawal-event table was additive, but the local database also had an unrelated `is_suspended` type mismatch that Drizzle wanted to convert with data loss.

**How to apply:** Inspect the generated diff, reject unrelated destructive statements, and use a narrowly scoped additive migration path for development. Never place startup-time DDL or a custom production migration in the app.