import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      // Android phone first: a narrow viewport with touch.
      name: "android",
      use: { ...devices["Pixel 7"], launchOptions: { executablePath: process.env.PW_CHROMIUM } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: process.env.PW_CHROMIUM } },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
