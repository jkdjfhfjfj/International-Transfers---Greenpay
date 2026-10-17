---
name: GreenPay preview isolation
description: Safe database behavior when running the GreenPay web app locally in this workspace.
---

For local UI previews, clear `DATABASE_URL` and `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE` so the app uses in-memory storage. On a fresh database, GreenPay startup applies checked-in Drizzle migrations; on an existing database, it runs only the idempotent additive SQL in `alterMissingColumns`, not the migration files. Use a dedicated disposable preview database only when persistent, authenticated testing is explicitly needed.

**Why:** Previewing UI should not connect to shared or production data. Existing databases must not blindly replay non-idempotent migration files; additive startup changes preserve existing data.

**How to apply:** Keep the GreenPay preview workflow database-free. Before any DB-enabled preview, verify it points to an approved disposable database. For schema needed by existing databases, add idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements to the additive startup list; don't enable blanket migration replay on existing schemas.
