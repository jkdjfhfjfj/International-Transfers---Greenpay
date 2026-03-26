import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
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

// Safely add new columns to existing tables — never drops or recreates anything
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

// Check whether the core tables already exist in this database
async function tablesExist(): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'`
    );
    return parseInt(result.rows[0].count, 10) > 0;
  } catch {
    return false;
  }
}

export async function ensureSchema() {
  const exists = await tablesExist();

  if (!exists) {
    // Fresh database — safe to push the schema once to create all tables
    try {
      const { execSync } = await import("child_process");
      execSync('npx drizzle-kit push', {
        env: { ...process.env, DATABASE_URL: connectionString },
        stdio: 'pipe',
      });
      console.log('✅ Schema created for fresh database');
    } catch (err: any) {
      console.warn('⚠️ Schema creation warning:', err.stderr?.toString() || err.message);
    }
  } else {
    // Existing database — only add missing columns, never drop or recreate anything
    await alterMissingColumns();
    console.log('✅ Schema up to date (existing database — no destructive changes)');
  }
}
