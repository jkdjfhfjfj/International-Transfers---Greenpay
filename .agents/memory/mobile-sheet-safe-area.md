---
name: Mobile sheet safe area
description: The relationship between GreenPay's fixed bottom navigation and mobile bottom sheets.
---

Use a shared bottom-navigation height and safe sheet utility for authenticated mobile pages. Sheets must reserve the navigation height in both their max-height and scrollable bottom padding; page roots need matching bottom content padding.

**Why:** The navigation is fixed above the app with a high stacking order, so a sheet can look correct while its final actions remain covered or unreachable if it only uses a generic viewport max-height.

**How to apply:** When adding a new transaction confirmation, menu, or detail sheet, use the shared safe sheet class and keep the sheet's inner content scrollable. Avoid isolated `pb-28`/`pb-32` guesses.