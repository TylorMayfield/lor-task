import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  globalSetup: undefined,

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command:
      "MONGODB_URI=mongodb://localhost:27017/lor-task-test NEXTAUTH_SECRET=test-secret NEXTAUTH_URL=http://localhost:3000 npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      MONGODB_URI:
        process.env.MONGODB_URI || "mongodb://localhost:27017/lor-task-test",
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET || "test-secret-key-for-playwright",
      NEXTAUTH_URL: "http://localhost:3000",
      PLAYWRIGHT_TEST: "true",
    },
  },
});
