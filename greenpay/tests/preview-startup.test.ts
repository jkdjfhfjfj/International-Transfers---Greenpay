import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { clearStalePreviewCaches } from "../client/src/preview-recovery";

const bootstrap = readFileSync(new URL("../client/src/preview-bootstrap.ts", import.meta.url), "utf8");
const html = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

test("development preview removes stale worker caches before importing React", () => {
  assert.match(bootstrap, /import\.meta\.env\.DEV/);
  assert.ok(bootstrap.indexOf("clearStalePreviewCaches") < bootstrap.indexOf('await import("./main")'));
});

test("startup shell stays visible while React loads and recovery is manual", () => {
  assert.match(html, /data-boot-shell/);
  assert.match(html, /setTimeout\(\(\) => \{/);
  assert.match(html, /\}, 30000\)/);
  assert.match(html, /Clear stale preview cache and start GreenPay/);
  assert.doesNotMatch(html, /localStorage\.clear|sessionStorage\.clear|Clear-Site-Data/);
  assert.doesNotMatch(html, /window\.location\.reload\(\)/);
});

test("stale worker registrations and cache entries are removed before retry", async () => {
  const events: string[] = [];
  const workers = {
    async getRegistrations() {
      events.push("get-registrations");
      return [
        { async unregister() { events.push("unregister-1"); return true; } },
        { async unregister() { events.push("unregister-2"); return true; } },
      ];
    },
  };
  const cacheStorage = {
    async keys() {
      events.push("get-cache-names");
      return ["old-app-cache", "old-api-cache"];
    },
    async delete(name: string) {
      events.push(`delete:${name}`);
      return true;
    },
  };

  await clearStalePreviewCaches(workers, cacheStorage);
  assert.deepEqual(events, [
    "get-registrations",
    "unregister-1",
    "unregister-2",
    "get-cache-names",
    "delete:old-app-cache",
    "delete:old-api-cache",
  ]);
});
