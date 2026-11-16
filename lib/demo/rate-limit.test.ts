import { describe, expect, it, vi } from "vitest";
import { clientIp, createDemoLimiter, createMemoryRateLimiter } from "./rate-limit";

describe("createMemoryRateLimiter", () => {
  it("allows up to the limit, then blocks with a retry time", () => {
    let t = 0;
    const rl = createMemoryRateLimiter({ limit: 2, windowMs: 60_000, now: () => t });
    expect(rl.check("ip").allowed).toBe(true);
    t = 10_000;
    expect(rl.check("ip")).toMatchObject({ allowed: true, remaining: 0 });
    t = 20_000;
    expect(rl.check("ip")).toEqual({ allowed: false, remaining: 0, retryAfterSec: 40 });
  });

  it("frees slots as the window slides", () => {
    let t = 0;
    const rl = createMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => t });
    rl.check("ip");
    t = 1000;
    expect(rl.check("ip").allowed).toBe(true);
  });

  it("tracks each IP separately", () => {
    const rl = createMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    rl.check("a");
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
  });
});

describe("createDemoLimiter", () => {
  it("uses memory when the Upstash env vars are missing or blank", async () => {
    expect(createDemoLimiter({}).backend).toBe("memory");
    const rl = createDemoLimiter({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io", UPSTASH_REDIS_REST_TOKEN: " " }, { limit: 1 });
    expect(rl.backend).toBe("memory");
    expect((await rl.check("ip")).allowed).toBe(true);
    expect((await rl.check("ip")).allowed).toBe(false);
  });

  it("uses Upstash's answer and converts reset into seconds", async () => {
    const upstash = vi.fn().mockResolvedValue({ success: false, remaining: 0, reset: 90_500 });
    const rl = createDemoLimiter({}, { upstash, now: () => 0 });
    expect(rl.backend).toBe("upstash");
    expect(await rl.check("1.2.3.4")).toEqual({ allowed: false, remaining: 0, retryAfterSec: 91 });
    expect(upstash).toHaveBeenCalledWith("1.2.3.4");
  });

  it("falls back to memory for a request when Upstash errors", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const upstash = vi.fn().mockRejectedValue(new Error("fetch failed"));
    const rl = createDemoLimiter({}, { upstash, limit: 1 });
    expect((await rl.check("ip")).allowed).toBe(true);
    expect((await rl.check("ip")).allowed).toBe(false);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for entry, then x-real-ip", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
