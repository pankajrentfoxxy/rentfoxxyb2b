import { readFileSync } from "node:fs";
import { Client } from "pg";

const url =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:51214/postgres";

let sql = readFileSync(new URL("../prisma/init_from_empty.sql", import.meta.url), "utf8");
sql = sql.replace(/^\uFEFF/, "");

const client = new Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
  console.log("Applied prisma/init_from_empty.sql");
} finally {
  await client.end();
}
