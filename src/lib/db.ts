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

let cachedPool: Pool | undefined;

/**
 * Created lazily on first real use, not on import — `next build` imports every route module
 * (even ones that never run) to collect its config, and that must succeed without DATABASE_URL
 * being set (e.g. inside the Docker build stage, where .env.local isn't available).
 */
function resolvePool(): Pool {
  // Reuse the pool across hot reloads in dev so we don't leak connections.
  if (process.env.NODE_ENV !== "production") {
    if (!global.pgPool) {
      global.pgPool = createPool();
    }
    return global.pgPool;
  }

  if (!cachedPool) {
    cachedPool = createPool();
  }
  return cachedPool;
}

export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = resolvePool();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
