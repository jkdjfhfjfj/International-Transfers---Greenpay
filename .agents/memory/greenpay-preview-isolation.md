---
name: GreenPay preview isolation
description: Safe database behavior when running the GreenPay web app locally in this workspace.
---

For local UI previews, clear `DATABASE_URL` and `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE` so the app uses in-memory storage. GreenPay startup automatically applies checked-in migrations when its users-table check finds no users table. Use a dedicated disposable preview database only when persistent, authenticated testing is explicitly needed.

**Why:** Previewing UI should not connect to shared or production data or mutate a schema as a side effect.

**How to apply:** Keep the GreenPay preview workflow database-free. Before any DB-enabled preview, verify it points to an approved disposable database.
