const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * In-memory limiter — resets on cold start / new serverless instance.
 * Acceptable for MVP scale; revisit with a shared store if abuse becomes real.
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  bucket.count += 1;
  return true;
}
