import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcrypt";
import { MemStorage } from "../server/storage.ts";

test("memory storage normalizes signup emails and hashes plaintext passwords", async () => {
  const storage = new MemStorage();
  const rawPassword = "PreviewUser123!";
  const created = await storage.createUser({
    fullName: "Preview User",
    email: "  Preview.User@Example.com ",
    phone: "+254700000001",
    country: "Kenya",
    password: rawPassword,
  });

  assert.equal(created.email, "preview.user@example.com");
  assert.notEqual(created.password, rawPassword);
  assert.equal(await bcrypt.compare(rawPassword, created.password), true);
  assert.equal((await storage.getUserByEmail("PREVIEW.USER@example.com"))?.id, created.id);
});

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

test("memory storage keeps multi-currency wallets user-scoped and updates the default", async () => {
  const storage = new MemStorage();
  const first = await storage.createWallet({ userId: "preview-user", currency: "USD", isDefault: true });
  const second = await storage.createWallet({ userId: "preview-user", currency: "KES", isActive: true });
  const other = await storage.createWallet({ userId: "another-user", currency: "KES", isDefault: true });

  assert.deepEqual(await storage.getWalletsByUserId("preview-user"), [first, second]);
  assert.equal(await storage.setDefaultWallet("preview-user", other.id), false);
  assert.equal(await storage.setDefaultWallet("preview-user", second.id), true);
  const wallets = await storage.getWalletsByUserId("preview-user");
  assert.equal(wallets.find(wallet => wallet.id === second.id)?.isDefault, true);
  assert.equal(wallets.find(wallet => wallet.id === first.id)?.isDefault, false);
});
