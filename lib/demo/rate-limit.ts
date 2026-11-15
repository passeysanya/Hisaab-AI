// In-memory sliding-window rate limiter keyed by IP. Good enough for a single-instance
// demo; resets on restart and isn't shared across server instances.

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSec: number };

export function createRateLimiter(opts: { limit: number; windowMs: number; now?: () => number }) {
  const { limit, windowMs } = opts;
  const now = opts.now ?? Date.now;
  const hits = new Map<string, number[]>();

  return {
    /** Records a hit for `key` if allowed. */
    check(key: string): RateLimitResult {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((recent[0] + windowMs - t) / 1000) };
      }
      recent.push(t);
      hits.set(key, recent);
      if (hits.size > 10_000) {
        for (const [k, ts] of hits) if (ts.every((x) => t - x >= windowMs)) hits.delete(k);
      }
      return { allowed: true, remaining: limit - recent.length, retryAfterSec: 0 };
    },
  };
}

export const DEMO_RUNS_PER_HOUR = 5;

const g = globalThis as unknown as { __hisaabDemoLimiter?: ReturnType<typeof createRateLimiter> };
/** Shared limiter for /api/demo/extract (survives dev hot reloads). */
export const demoLimiter = (g.__hisaabDemoLimiter ??= createRateLimiter({
  limit: DEMO_RUNS_PER_HOUR,
  windowMs: 60 * 60 * 1000,
}));

/** Best-effort client IP from proxy headers. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
