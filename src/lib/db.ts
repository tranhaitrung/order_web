import { Pool } from "pg";

declare global {
  var pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL chưa được cấu hình");
  }
  return new Pool({ connectionString });
}

// Reuse the pool across hot reloads in dev so we don't leak connections.
export const pool = global.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.pgPool = pool;
}
