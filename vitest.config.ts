import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Unit tests live beside source; the Playwright e2e/ dir is intentionally excluded.
    include: ["src/**/*.test.ts"],
  },
});
