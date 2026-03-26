import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { execSync } from "child_process";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const fallbackDatabaseUrl = "postgresql://neondb_owner:npg_IiOAUPltu3d8@ep-wild-union-abir03rk-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

// Resolve and expose the connection string early so all tools (drizzle-kit, session store, etc.) can find it
const connectionString = (process.env.DATABASE_URL || fallbackDatabaseUrl).replace(/^"(.*)"$/, '$1').trim();
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = connectionString;
}

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });

// Run drizzle-kit push to create/sync ALL tables and columns on any fresh or existing DB
async function pushSchema() {
  try {
    execSync('npx drizzle-kit push --force', {
      env: { ...process.env, DATABASE_URL: connectionString },
      stdio: 'pipe',
    });
    console.log('✅ Schema push complete (all tables and columns are up to date)');
  } catch (err: any) {
    console.warn('⚠️ Schema push warning:', err.stderr?.toString() || err.message);
  }
}

// Safety net: individual ALTER TABLE statements in case push is skipped or partially fails
async function alterMissingColumns() {
  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`,
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT`,
    `ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS freeze_reason TEXT`,
  ];

  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch (err: any) {
      console.warn(`⚠️ Migration skipped (${sql.slice(0, 50)}...): ${err.message}`);
    }
  }
}

export async function ensureSchema() {
  await pushSchema();
  await alterMissingColumns();
}
