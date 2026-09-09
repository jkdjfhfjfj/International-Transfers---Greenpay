---
name: Dependency firewall install
description: Imported Geepay dependencies may remain incomplete when Replit's package security policy blocks transitive npm downloads.
---

Treat a clean Git checkout as separate from a complete dependency install. A failed package install can leave enough tooling for Vite or the mockup server to start while runtime packages such as bcrypt, the database driver, or Helmet provider are still missing.

**Why:** The imported app's install was blocked by security-policy 403 responses for packages in the dependency graph, and the build and workflow then surfaced different missing imports.

**How to apply:** Before debugging application code, run the install and build checks and inspect the exact missing package. Do not bypass the package firewall; repair the dependency graph or use an approved safe version before claiming the preview is verified.