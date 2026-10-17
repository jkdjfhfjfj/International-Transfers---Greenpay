import assert from "node:assert/strict";
import test from "node:test";

const testDatabaseUrl = process.env.GREENPAY_TEST_DATABASE_URL;

test("PostgreSQL session-store queries revoke only the intended active user sessions", {
  skip: !testDatabaseUrl,
}, async () => {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: testDatabaseUrl });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TEMP TABLE user_sessions (
        sid text PRIMARY KEY,
        sess jsonb NOT NULL,
        expire timestamp NOT NULL
      )
    `);
    await client.query(`
      INSERT INTO user_sessions (sid, sess, expire) VALUES
        ('current', '{"userId":"user-a"}', NOW() + interval '1 day'),
        ('other-device', '{"userId":"user-a"}', NOW() + interval '1 day'),
        ('other-user', '{"userId":"user-b"}', NOW() + interval '1 day'),
        ('expired', '{"userId":"user-a"}', NOW() - interval '1 day')
    `);

    const active = await client.query(
      "SELECT sid, expire FROM user_sessions WHERE sess->>'userId' = $1 AND expire > NOW() ORDER BY expire DESC",
      ["user-a"],
    );
    assert.deepEqual(active.rows.map(row => row.sid).sort(), ["current", "other-device"]);

    await client.query(
      "DELETE FROM user_sessions WHERE sid = $1 AND sess->>'userId' = $2",
      ["other-device", "user-a"],
    );
    const afterDeviceSignOut = await client.query("SELECT sid FROM user_sessions ORDER BY sid");
    assert.deepEqual(afterDeviceSignOut.rows.map(row => row.sid), ["current", "expired", "other-user"]);

    await client.query(
      "DELETE FROM user_sessions WHERE sess->>'userId' = $1 AND sid != $2",
      ["user-a", "current"],
    );
    const afterSignOutAllOthers = await client.query("SELECT sid FROM user_sessions ORDER BY sid");
    assert.deepEqual(afterSignOutAllOthers.rows.map(row => row.sid), ["current", "other-user"]);

    await client.query("DELETE FROM user_sessions WHERE sess->>'userId' = $1", ["user-a"]);
    const afterAccountDeletion = await client.query("SELECT sid FROM user_sessions ORDER BY sid");
    assert.deepEqual(afterAccountDeletion.rows.map(row => row.sid), ["other-user"]);
  } finally {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});
