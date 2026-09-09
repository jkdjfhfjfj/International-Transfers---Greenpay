---
name: Dependency firewall install
description: Imported Geepay dependencies may remain incomplete when Replit's package security policy blocks transitive npm downloads.
---

Treat a clean Git checkout as separate from a complete dependency install. A failed package install can leave enough tooling for Vite to start while runtime packages such as the database driver or Helmet provider are still missing.

**Why:** The imported app's install was blocked by security-policy 403 responses for packages in the dependency graph, leaving both the workflow and production build unable to resolve declared imports.

**How to apply:** Before debugging application code, run the install and build checks and inspect the exact missing package. Do not bypass the package firewall; repair the dependency graph or use an approved safe version before claiming the preview is verified.