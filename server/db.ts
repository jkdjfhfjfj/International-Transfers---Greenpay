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