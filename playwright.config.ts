import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100";
const parsedBaseURL = new URL(baseURL);
const port = parsedBaseURL.port || (parsedBaseURL.protocol === "https:" ? "443" : "80");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `pnpm dev -p ${port}`,
        url: `${baseURL}/feed`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
      }
});
