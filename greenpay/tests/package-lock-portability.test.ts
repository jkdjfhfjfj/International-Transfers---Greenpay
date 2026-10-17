import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageLock = readFileSync(new URL("../package-lock.json", import.meta.url), "utf8");

test("npm lockfile does not point to Replit-only package hosts", () => {
  assert.doesNotMatch(packageLock, /package-firewall\.replit\.internal/);
});
