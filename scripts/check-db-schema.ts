import { db } from "../lib/db/src/index";
import { ordersTable } from "../lib/db/src/schema/orders";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Connecting to database...");
    
    // Check connection and list columns of orders table
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'orders';
    `);
    
    console.log("Columns in 'orders' table:");
    console.log(JSON.stringify(result.rows, null, 2));

  } catch (err: any) {
    console.error("Database diagnostics failed:", err.message, err.stack);
  }
  process.exit(0);
}

main();
