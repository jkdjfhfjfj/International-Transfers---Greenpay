import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Resolve the connection string — prefer DATABASE_URL, fall back to individual PG* vars
function resolveConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace(/^"(.*)"$/, '$1').trim();
  }

  const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;
  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
    const port = PGPORT || '5432';
    return `postgresql://${PGUSER}:${encodeURIComponent(PGPASSWORD)}@${PGHOST}:${port}/${PGDATABASE}?sslmode=require`;
  }

  throw new Error(
    "No database connection configured. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE environment variables."
  );
}

const connectionString = resolveConnectionString();

// Ensure DATABASE_URL is set so drizzle-kit and other tools can find it
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
    `ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS block_reason TEXT`,
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
    // Tables do not exist — log a warning but do NOT auto-run drizzle-kit push.
    // Running drizzle-kit push automatically can drop and recreate tables, destroying all data.
    // To initialize a fresh database, run: npm run db:push  (manually, once, as a developer)
    console.warn('⚠️  Database tables not found. If this is a fresh database, run "npm run db:push" manually to create the schema.');
  } else {
    // Existing database — only add missing columns, never drop or recreate anything
    await alterMissingColumns();
    console.log('✅ Schema up to date (existing database — no destructive changes)');
  }
}
