import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const fallbackDatabaseUrl = "postgresql://neondb_owner:npg_IiOAUPltu3d8@ep-wild-union-abir03rk-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

if (!process.env.DATABASE_URL && !fallbackDatabaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Clean the DATABASE_URL and ensure it is not used as a partial object in Pool
const connectionString = (process.env.DATABASE_URL || fallbackDatabaseUrl).replace(/^"(.*)"$/, '$1').trim();
export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });

// Auto-migration: ensure all required columns exist in the database
export async function ensureSchema() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP
    `);
    await pool.query(`
      ALTER TABLE announcements 
      ADD COLUMN IF NOT EXISTS image_url TEXT
    `);
    await pool.query(`
      ALTER TABLE virtual_cards 
      ADD COLUMN IF NOT EXISTS freeze_reason TEXT
    `);
    console.log('✅ Database schema ensured (auto-migration complete)');
  } catch (err: any) {
    console.warn('⚠️ Auto-migration warning:', err.message);
  }
}
