import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Friday Movie Night")).toBe("friday-movie-night");
  });
  it("trims leading/trailing separators and symbols", () => {
    expect(slugify("  Hello!! World  ")).toBe("hello-world");
  });
  it("collapses runs of non-alphanumerics", () => {
    expect(slugify("a___b   c")).toBe("a-b-c");
  });
  it("returns empty string for symbol-only input", () => {
    expect(slugify("!!!")).toBe("");
  });
  it("truncates to 40 characters", () => {
    expect(slugify("a".repeat(60))).toHaveLength(40);
  });
});
