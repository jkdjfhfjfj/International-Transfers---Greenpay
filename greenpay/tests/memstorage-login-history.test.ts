import assert from "node:assert/strict";
import test from "node:test";
import { MemStorage } from "../server/storage.ts";

test("memory storage records and returns recent login history without throwing", async () => {
  const storage = new MemStorage();
  const older = await storage.createLoginHistory({ userId: "preview-user", status: "success" });
  await new Promise(resolve => setTimeout(resolve, 2));
  const newer = await storage.createLoginHistory({ userId: "preview-user", status: "failed" });
  await storage.createLoginHistory({ userId: "another-user", status: "success" });

  assert.equal(older.userId, "preview-user");
  assert.equal(older.status, "success");
  assert.deepEqual(await storage.getLoginHistoryByUserId("preview-user"), [newer, older]);
  assert.deepEqual(await storage.getLoginHistoryByUserId("preview-user", 1), [newer]);
});
