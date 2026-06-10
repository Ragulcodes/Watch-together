import { describe, it, expect } from "vitest";
import { rateLimit } from "./rateLimit";

describe("rateLimit", () => {
  it("allows up to the limit, then blocks with a retry hint", () => {
    const key = `t-${Date.now()}-a`;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 10_000).ok).toBe(true);
    }
    const blocked = rateLimit(key, 5, 10_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("keeps separate keys independent", () => {
    const a = rateLimit(`t-${Date.now()}-b`, 1, 10_000);
    const b = rateLimit(`t-${Date.now()}-c`, 1, 10_000);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it("a fresh key with limit 1 allows exactly one hit", () => {
    const key = `t-${Date.now()}-d`;
    expect(rateLimit(key, 1, 10_000).ok).toBe(true);
    expect(rateLimit(key, 1, 10_000).ok).toBe(false);
  });
});
