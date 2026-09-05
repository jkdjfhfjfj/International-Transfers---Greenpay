import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from "ws";
import path from "node:path";
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
    `CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      two_factor_secret TEXT,
      two_factor_enabled BOOLEAN DEFAULT false,
      last_login_at TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS system_settings (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value JSON NOT NULL,
      description TEXT,
      updated_by VARCHAR REFERENCES admins(id),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS api_configurations (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      provider TEXT,
      display_name TEXT,
      api_key TEXT,
      api_secret TEXT,
      base_url TEXT,
      webhook_secret TEXT,
      is_enabled BOOLEAN DEFAULT true,
      configuration JSONB,
      last_tested TIMESTAMP,
      test_status TEXT,
      test_message TEXT,
      updated_by VARCHAR REFERENCES admins(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS provider TEXT`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS display_name TEXT`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS api_key TEXT`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS api_secret TEXT`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS base_url TEXT`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS webhook_secret TEXT`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS configuration JSONB`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS last_tested TIMESTAMP`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS test_status TEXT`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS test_message TEXT`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS updated_by VARCHAR`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE api_configurations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
    // These are the tables used by account and withdrawal flows. They are
    // additive guards for databases created before the current schema.
    `CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency TEXT NOT NULL,
      recipient_id VARCHAR REFERENCES users(id),
      recipient_details JSONB,
      status TEXT DEFAULT 'pending',
      failure_reason TEXT,
      fee DECIMAL(10,2) DEFAULT 0.00,
      exchange_rate DECIMAL(10,4),
      description TEXT,
      reference TEXT,
      paystack_reference TEXT,
      metadata JSONB,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS recipients (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      account_number TEXT,
      bank_name TEXT,
      bank_code TEXT,
      country TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'KES',
      recipient_type TEXT DEFAULT 'mobile_wallet',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_global BOOLEAN DEFAULT false,
      user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
      is_read BOOLEAN DEFAULT false,
      action_url TEXT,
      metadata JSONB,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS withdrawal_events (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id VARCHAR NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      provider TEXT,
      provider_reference TEXT,
      retry_count INTEGER DEFAULT 0,
      refund_status TEXT DEFAULT 'not_applicable',
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_details JSONB`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS failure_reason TEXT`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fee DECIMAL(10,2) DEFAULT 0.00`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4)`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference TEXT`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paystack_reference TEXT`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS phone TEXT`,
    `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS email TEXT`,
    `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS account_number TEXT`,
    `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS bank_name TEXT`,
    `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS bank_code TEXT`,
    `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS country TEXT`,
    `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES'`,
    `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS recipient_type TEXT DEFAULT 'mobile_wallet'`,
    `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE recipients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info'`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id VARCHAR`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE withdrawal_events ADD COLUMN IF NOT EXISTS provider TEXT`,
    `ALTER TABLE withdrawal_events ADD COLUMN IF NOT EXISTS provider_reference TEXT`,
    `ALTER TABLE withdrawal_events ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0`,
    `ALTER TABLE withdrawal_events ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'not_applicable'`,
    `ALTER TABLE withdrawal_events ADD COLUMN IF NOT EXISTS metadata JSONB`,
    `ALTER TABLE withdrawal_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true`,
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
    `ALTER TABLE wallets ADD COLUMN IF NOT EXISTS withdrawal_hold_amount DECIMAL(18,4) DEFAULT 0.0000`,
    `UPDATE wallets SET withdrawal_hold_amount = 0.0000 WHERE withdrawal_hold_amount IS NULL`,
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
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT`,
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT`,
    // Virtual cards table - auto-created on existing databases that predate card support
    `CREATE TABLE IF NOT EXISTS virtual_cards (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      card_number TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      cvv TEXT NOT NULL,
      balance DECIMAL(10,2) DEFAULT 0.00,
      status TEXT DEFAULT 'active',
      freeze_reason TEXT,
      block_reason TEXT,
      purchase_amount DECIMAL(10,2) DEFAULT 60.00,
      paystack_reference TEXT,
      purchase_date TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS freeze_reason TEXT`,
    `ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS block_reason TEXT`,

    // Admin-configured virtual account details shared by approved users
    `CREATE TABLE IF NOT EXISTS virtual_account_settings (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      currency TEXT NOT NULL UNIQUE,
      account_name TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      routing_number TEXT,
      sort_code TEXT,
      iban TEXT,
      swift_code TEXT,
      bank_address TEXT,
      beneficiary_address TEXT,
      payment_instructions TEXT,
      is_active BOOLEAN DEFAULT true,
      updated_by VARCHAR REFERENCES admins(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // User applications for approved access to virtual account details
    `CREATE TABLE IF NOT EXISTS virtual_account_applications (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      currency TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      source_of_income TEXT NOT NULL,
      monthly_volume TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expected_senders TEXT,
      declarations JSONB NOT NULL,
      admin_notes TEXT,
      reviewed_by VARCHAR REFERENCES admins(id),
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS virtual_account_applications_user_currency_idx ON virtual_account_applications(user_id, currency)`,
    // User-owned virtual accounts and their separately held balances
    `CREATE TABLE IF NOT EXISTS virtual_accounts (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      application_id VARCHAR NOT NULL UNIQUE REFERENCES virtual_account_applications(id) ON DELETE CASCADE,
      currency TEXT NOT NULL,
      balance DECIMAL(18,4) DEFAULT 0.0000,
      hold_amount DECIMAL(18,4) DEFAULT 0.0000,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS virtual_accounts_user_currency_idx ON virtual_accounts(user_id, currency)`,
    // Append-only ledger for wallets, virtual accounts, and virtual cards.
    `CREATE TABLE IF NOT EXISTS ledger_entries (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      currency TEXT NOT NULL,
      wallet_id VARCHAR REFERENCES wallets(id) ON DELETE CASCADE,
      virtual_account_id VARCHAR REFERENCES virtual_accounts(id) ON DELETE CASCADE,
      card_id VARCHAR REFERENCES virtual_cards(id) ON DELETE CASCADE,
      amount DECIMAL(18,4) NOT NULL,
      entry_type TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      transaction_id VARCHAR REFERENCES transactions(id) ON DELETE SET NULL,
      description TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS ledger_entries_wallet_idx ON ledger_entries(wallet_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS ledger_entries_virtual_account_idx ON ledger_entries(virtual_account_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS ledger_entries_card_idx ON ledger_entries(card_id, created_at)`,
    // Seed one immutable opening entry for each existing cached balance. This
    // makes the migration lossless while all future changes use the ledger.
    `INSERT INTO ledger_entries (user_id, currency, wallet_id, amount, entry_type, idempotency_key, description)
     SELECT user_id, currency, id, COALESCE(balance, 0), 'opening_balance', 'wallet-opening:' || id, 'Opening balance migrated to ledger'
     FROM wallets
     WHERE NOT EXISTS (
       SELECT 1 FROM ledger_entries le WHERE le.idempotency_key = 'wallet-opening:' || wallets.id
     )`,
    `INSERT INTO ledger_entries (user_id, currency, card_id, amount, entry_type, idempotency_key, description)
     SELECT user_id, 'USD', id, COALESCE(balance, 0), 'opening_balance', 'card-opening:' || id, 'Card balance migrated to ledger'
     FROM virtual_cards
     WHERE NOT EXISTS (
       SELECT 1 FROM ledger_entries le WHERE le.idempotency_key = 'card-opening:' || virtual_cards.id
     )`,
    `INSERT INTO system_settings (key, value, category)
      SELECT 'virtual_account_currencies', to_json('USD,GBP,EUR'::text), 'virtual_accounts'
      WHERE NOT EXISTS (
        SELECT 1 FROM system_settings WHERE key = 'virtual_account_currencies'
      )`,
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

  for (let index = 0; index < migrations.length; index++) {
    const sql = migrations[index];
    try {
      await pool.query(sql);
    } catch (err: any) {
      const migrationName = `additive-${String(index + 1).padStart(3, "0")}`;
      throw new Error(
        `Database migration ${migrationName} failed. Startup was stopped to prevent runtime schema errors: ${err.message}`,
        { cause: err },
      );
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
    // A fresh database is safe to initialize because there are no existing
    // tables or data to destroy. The checked-in SQL is generated from the
    // Drizzle schema and is applied transactionally by the migrator.
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "migrations") });
    console.log('✅ Fresh database initialized from checked-in migrations');
  } else {
    // Existing database — only add missing columns, never drop or recreate anything
    await alterMissingColumns();
    console.log('✅ Schema up to date (existing database — additive migrations complete)');
  }
}
