/**
 * Tiny in-memory sliding-window rate limiter.
 *
 * NOTE: process-local — fine for a single instance / dev. For multi-instance
 * production, back this with Redis (e.g. @upstash/ratelimit) using the same
 * (key, limit, windowMs) contract.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    const retryAfterMs = Math.max(0, hits[0] + windowMs - now);
    buckets.set(key, hits);
    return { ok: false, retryAfterMs };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterMs: 0 };
}

// Periodic cleanup so the map can't grow unbounded.
const CLEANUP_MS = 60_000;
let lastCleanup = 0;
export function maybeCleanup(maxWindowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_MS) return;
  lastCleanup = now;
  const cutoff = now - maxWindowMs;
  for (const [k, v] of buckets) {
    const kept = v.filter((t) => t > cutoff);
    if (kept.length === 0) buckets.delete(k);
    else buckets.set(k, kept);
  }
}
