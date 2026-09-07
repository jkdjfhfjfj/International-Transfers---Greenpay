---
name: Legacy migration ordering
description: How additive startup migrations should behave against older hosted databases
---

Additive migrations must repair the columns needed by a backfill before running that backfill, and independent repairs should not be ordered behind unrelated legacy statements.

**Why:** Existing hosted databases can have a table created by an older version while the current code assumes newer columns. A single missing column otherwise aborts startup and hides later required repairs.

**How to apply:** For every startup migration, create the table if absent, add each required legacy column with an idempotent ALTER, then backfill data. Keep unrelated table repairs independent.