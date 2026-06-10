import { describe, it, expect } from "vitest";
import { electHost } from "./sync";

describe("electHost", () => {
  it("prefers the owner whenever present", () => {
    expect(electHost(["c", "owner", "a"], "owner", "a")).toBe("owner");
  });
  it("falls back to the lowest identity when the owner is absent", () => {
    expect(electHost(["c", "a", "b"], "owner", "c")).toBe("a");
  });
  it("is deterministic regardless of which client computes it", () => {
    const present = ["c", "a", "b"];
    const fromA = electHost(present, "owner", "a");
    const fromB = electHost(present, "owner", "b");
    expect(fromA).toBe(fromB);
    expect(fromA).toBe("a");
  });
  it("a solo participant elects itself", () => {
    expect(electHost(["a"], "owner", "a")).toBe("a");
  });
  it("uses the fallback id when no one is present", () => {
    expect(electHost([], "owner", "me")).toBe("me");
  });
  it("models migration: a viewer becomes host once the owner leaves", () => {
    expect(electHost(["owner", "a", "b"], "owner", "a")).toBe("owner"); // owner present
    expect(electHost(["a", "b"], "owner", "a")).toBe("a"); // owner gone → lowest
  });
});
