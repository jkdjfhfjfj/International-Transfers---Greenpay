---
name: Dependency firewall install
description: Imported Geepay dependencies may remain incomplete when Replit's package security policy blocks transitive npm downloads.
---

Treat a clean Git checkout as separate from a complete dependency install. A failed package install can leave enough tooling for Vite or the mockup server to start while runtime packages such as bcrypt, the database driver, or Helmet provider are still missing.

**Why:** The imported app's install was blocked by security-policy 403 responses for packages in the dependency graph, and the build and workflow then surfaced different missing imports.

**How to apply:** Before debugging application code, run the install and build checks and inspect the exact missing package. Failed package-manager retries can also rewrite dependency manifests, so compare them with Git and restore unintended version changes. Do not bypass the firewall or claim preview verification while tooling is missing.