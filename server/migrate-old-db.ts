import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { Pool } from "@neondatabase/serverless";

const OLD_DB = process.env.OLD_DATABASE_URL;
const NEW_DB = process.env.DATABASE_URL;

if (!OLD_DB || !NEW_DB) {
  throw new Error("OLD_DATABASE_URL and DATABASE_URL are required to run the migration");
}

const tables = [
  "users", "kyc_documents", "virtual_cards", "transactions", "recipients",
  "payment_requests", "chat_messages", "notifications", "support_tickets",
  "conversations", "messages", "admins", "admin_logs", "system_logs",
  "system_settings", "api_configurations", "savings_goals", "qr_payments",
  "scheduled_payments", "budgets", "user_preferences", "login_history",
  "user_sessions", "whatsapp_conversations", "whatsapp_messages", "whatsapp_config",
  "user_activity_log", "bill_payments", "loans"
];

async function migrateData() {
  const oldPool = new Pool({ connectionString: OLD_DB });
  const newPool = new Pool({ connectionString: NEW_DB });

  try {
    console.log("🚀 Starting data migration from old to new database...\n");

    for (const table of tables) {
      try {
        // Get columns from old database
        const columnResult = await oldPool.query(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_name = $1 AND table_schema = 'public' 
           ORDER BY ordinal_position`,
          [table]
        );

        if (columnResult.rows.length === 0) {
          console.log(`⚠️  Table ${table}: No schema found`);
          continue;
        }

        const columns = columnResult.rows.map((r: any) => r.column_name);

        // Get data from old database
        const dataResult = await oldPool.query(`SELECT * FROM "${table}"`);

        if (dataResult.rows.length === 0) {
          console.log(`✅ Table ${table}: No records to migrate`);
          continue;
        }

        // Insert into new database, skipping duplicates
        let inserted = 0;
        for (const row of dataResult.rows) {
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(",");
          const values = columns.map((col) => row[col]);

          try {
            await newPool.query(
              `INSERT INTO "${table}" (${columns.join(",")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
              values
            );
            inserted++;
          } catch (e: any) {
            if (e.code !== "23505") {
              console.error(`Error inserting into ${table}:`, e.message);
            }
          }
        }

        console.log(`✅ Table ${table}: ${inserted}/${dataResult.rows.length} records migrated`);
      } catch (err: any) {
        console.log(`⚠️  Error processing ${table}:`, err.message);
      }
    }

    console.log("\n✅ Migration completed successfully!");
  } catch (err: any) {
    console.error("❌ Migration failed:", err);
  } finally {
    await oldPool.end();
    await newPool.end();
  }
}

migrateData();
