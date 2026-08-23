import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL chưa được cấu hình");
  }

  const schemaPath = path.join(dirname, "..", "db", "schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(schemaSql);
    console.log("[migrate] Áp dụng schema thành công");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("[migrate] Thất bại:", error);
  process.exitCode = 1;
});
