// Demo rate limit, keyed by IP.
// On Vercel every serverless instance has its own memory, so an in-memory counter
// can't enforce a real limit there. When UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are set, the count lives in Upstash Redis (free tier) and
// is shared by every instance. Without them (local dev) it falls back to memory.

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSec: number };

export type RateLimiter = {
  /** "upstash" or "memory", for logs and tests. */
  backend: "upstash" | "memory";
  /** Records a hit for `key` if allowed. */
  check(key: string): Promise<RateLimitResult>;
};

export const DEMO_RUNS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

/** Sliding-window limiter in process memory. Synchronous core, so it's easy to test. */
export function createMemoryRateLimiter(opts: { limit: number; windowMs: number; now?: () => number }) {
  const { limit, windowMs } = opts;
  const now = opts.now ?? Date.now;
  const hits = new Map<string, number[]>();

  return {
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

/** The subset of @upstash/ratelimit's `limit()` response we use. */
export type UpstashLimitFn = (key: string) => Promise<{ success: boolean; remaining: number; reset: number }>;

export type RateLimitEnv = {
  [key: string]: string | undefined;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};

/** Builds the real Upstash sliding-window limiter. Imported lazily so local dev never loads it. */
async function upstashLimitFn(url: string, token: string, limit: number): Promise<UpstashLimitFn> {
  const [{ Ratelimit }, { Redis }] = await Promise.all([import("@upstash/ratelimit"), import("@upstash/redis")]);
  const rl = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, "1 h"),
    prefix: "hisaab:demo",
  });
  return (key) => rl.limit(key);
}

/**
 * Picks Upstash when both env vars are set, otherwise memory. If Upstash errors at
 * request time (network, bad token), that request is counted in memory instead,
 * so the demo keeps working and is still limited per instance.
 */
export function createDemoLimiter(
  env: RateLimitEnv,
  opts: { limit?: number; windowMs?: number; now?: () => number; upstash?: UpstashLimitFn } = {},
): RateLimiter {
  const limit = opts.limit ?? DEMO_RUNS_PER_HOUR;
  const now = opts.now ?? Date.now;
  const memory = createMemoryRateLimiter({ limit, windowMs: opts.windowMs ?? HOUR_MS, now });
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!opts.upstash && !(url && token)) {
    return { backend: "memory", check: async (key) => memory.check(key) };
  }

  const injected = opts.upstash;
  const make = injected ? () => Promise.resolve(injected) : () => upstashLimitFn(url!, token!, limit);
  let fn: Promise<UpstashLimitFn> | null = null;
  return {
    backend: "upstash",
    async check(key) {
      try {
        fn ??= make();
        const r = await (await fn)(key);
        return {
          allowed: r.success,
          remaining: Math.max(0, r.remaining),
          retryAfterSec: r.success ? 0 : Math.max(1, Math.ceil((r.reset - now()) / 1000)),
        };
      } catch (err) {
        console.warn("Upstash rate limit unavailable, using in-memory limit:", err instanceof Error ? err.message : err);
        fn = null;
        return memory.check(key);
      }
    },
  };
}

const g = globalThis as unknown as { __hisaabDemoLimiter?: RateLimiter };
/** Shared limiter for /api/demo/extract (survives dev hot reloads). */
export function demoLimiter(): RateLimiter {
  return (g.__hisaabDemoLimiter ??= createDemoLimiter(process.env));
}

/** Best-effort client IP. On Vercel, x-forwarded-for is set by the platform. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
