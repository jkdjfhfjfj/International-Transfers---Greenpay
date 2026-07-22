import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Resolve the connection string — prefer DATABASE_URL, fall back to individual PG* vars
function resolveConnectionString(): string | null {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace(/^"(.*)"$/, '$1').trim();
  }

  const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;
  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
    const port = PGPORT || '5432';
    return `postgresql://${PGUSER}:${encodeURIComponent(PGPASSWORD)}@${PGHOST}:${port}/${PGDATABASE}?sslmode=require`;
  }

  return null;
}

const connectionString = resolveConnectionString();

export const pool = connectionString ? new Pool({ connectionString }) : null as any;
export const db = connectionString ? drizzle({ client: pool, schema }) : null as any;

// Safely add new columns to existing tables — never drops or recreates anything
async function alterMissingColumns() {
  const migrations = [
    // Multi-currency wallets table
    `CREATE TABLE IF NOT EXISTS wallets (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      currency TEXT NOT NULL,
      label TEXT,
      balance DECIMAL(18,4) DEFAULT 0.0000,
      hold_amount DECIMAL(18,4) DEFAULT 0.0000,
      is_default BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      is_suspended BOOLEAN DEFAULT false,
      suspend_reason TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS wallets_user_currency_idx ON wallets(user_id, currency)`,
    // Migrate existing USD balances to wallets
    `INSERT INTO wallets (user_id, currency, balance, is_default, is_active)
     SELECT id, 'USD', COALESCE(balance, 0), true, true FROM users
     WHERE NOT EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = users.id AND w.currency = 'USD')
     ON CONFLICT DO NOTHING`,
    // Migrate existing KES balances to wallets
    `INSERT INTO wallets (user_id, currency, balance, is_default, is_active)
     SELECT id, 'KES', COALESCE(kes_balance, 0), false, true FROM users
     WHERE NOT EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = users.id AND w.currency = 'KES')
     ON CONFLICT DO NOTHING`,
    // NexusPay API key in api_configurations table (safe fallback)
    `INSERT INTO api_configurations (service_name, config_key, config_value, is_active) VALUES ('nexuspay', 'api_key', '""', true) ON CONFLICT (service_name, config_key) DO NOTHING`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT`,
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT`,
    `ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS freeze_reason TEXT`,
    `ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS block_reason TEXT`,
    // Deposit bonuses table (admin-configured bonus offers per deposit method)
    `CREATE TABLE IF NOT EXISTS deposit_bonuses (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      method TEXT NOT NULL,
      min_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
      bonus_amount DECIMAL(18,2) NOT NULL,
      bonus_type TEXT NOT NULL DEFAULT 'fixed',
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // Advanced KYC documents table
    `CREATE TABLE IF NOT EXISTS advanced_kyc_documents (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      facial_photo_url TEXT,
      address_proof_url TEXT,
      address_proof_type TEXT,
      full_address TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      verification_notes TEXT,
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // Advanced KYC status column on users
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS advanced_kyc_status TEXT DEFAULT 'not_submitted'`,
    // Admin-requested advanced KYC flag
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS advanced_kyc_requested BOOLEAN DEFAULT false`,
    // Google OAuth
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`,
    // Didit.me KYC integration
    `ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS didit_session_id TEXT`,
    `ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS didit_status TEXT`,
    `ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS didit_decision JSONB`,
    // KYC-extracted identity fields on users (auto-populated on verification)
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_full_name TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_date_of_birth TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_id_number TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_nationality TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_gender TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_address TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_document_type TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_id_expiry_date TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_issuing_country TEXT`,
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
  if (!pool) return; // No database configured — MemStorage handles persistence
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
