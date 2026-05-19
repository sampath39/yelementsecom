import "dotenv/config";
import pg from "pg";

async function main() {
  console.log("Testing with env DATABASE_URL");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Success!");
    await client.end();
  } catch (e) {
    console.log("Failed:", e.message);
  }
}
main();
