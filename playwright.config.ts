import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3030",
    trace: "on-first-retry",
    // Fake media so getUserMedia / screen-share don't block headless runs.
    launchOptions: {
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
      ],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Reuse the running dev server (started by the loop); otherwise boot one.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3030",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
