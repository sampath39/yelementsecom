import pg from "pg";
const { Client } = pg;

async function testConn(url) {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    console.log(`Success with url: ${url}`);
    await client.end();
    return true;
  } catch (e) {
    console.log(`Failed with url: ${url} - ${e.message}`);
    return false;
  }
}

async function main() {
  const pwd = encodeURIComponent("Sampath@6139");
  const host = "aws-1-us-east-1.pooler.supabase.com:6543";
  await testConn(`postgresql://postgres.wstudapuxccbrsuruqha:${pwd}@${host}/postgres?sslmode=require`);
  process.exit(0);
}
main();
