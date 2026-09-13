import { Pool } from "pg";

declare global {
  var pgPool: Pool | undefined;
}

/**
 * Managed providers like Supabase/Neon require TLS but use certificates Node's default trust
 * store won't have, so the chain isn't verified — this is standard practice for these providers
 * and still encrypts the connection. Self-hosted Postgres (e.g. the docker-compose `db` service)
 * has no TLS listener by default, so SSL stays off there unless explicitly requested.
 * Override with DATABASE_SSL=true|false if auto-detection guesses wrong for your setup.
 */
function resolveSsl(connectionString: string): false | { rejectUnauthorized: boolean } {
  const override = process.env.DATABASE_SSL;
  if (override === "false") return false;
  if (override === "true") return { rejectUnauthorized: false };

  const needsSsl = /supabase\.(co|com)|neon\.tech|sslmode=require/.test(connectionString);
  return needsSsl ? { rejectUnauthorized: false } : false;
}

/**
 * pg's own connection-string parser derives its own `ssl` setting from a `sslmode` query param
 * and re-merges it into the config AFTER the `ssl` option we pass explicitly (see
 * ConnectionParameters in pg/lib/connection-parameters.js), silently overriding it — `sslmode=require`
 * in particular gets treated as full certificate-chain verification, which fails against
 * providers like Neon/Supabase whose cert chain Node doesn't trust by default. `channel_binding`
 * (Neon includes this by default) isn't supported by pg's SASL implementation either. Stripping
 * both lets our own `ssl` option above be the only source of truth.
 */
function sanitizeConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return connectionString;
  }
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL chưa được cấu hình");
  }
  return new Pool({
    connectionString: sanitizeConnectionString(connectionString),
    ssl: resolveSsl(connectionString),
  });
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
