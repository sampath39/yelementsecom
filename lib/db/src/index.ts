import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import 'dotenv/config';

// Delete environment variables that pg might pick up from the OS environment:
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGDATABASE;
delete process.env.PGSSLMODE;

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.ffwcjepemcvkipgjfxbb:Sampath@6139@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
export const db = drizzle(pool, { schema });

export * from "./schema";
