import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // The global scan: Look everywhere, but ONLY for specific extensions.
  testDir: ".",
  testMatch: ["**/*.e2e.js", "**/*.spec.js"],

  // Ignore the heavy lifting folders
  testIgnore: ["**/node_modules/**", "**/dist/**", "**/.jules/**", "**/tmp/**"],

  // Fast Fail: Stop the bleeding early.
  // If 3 E2E tests fail, the AI fundamentally broke the engine. Halt and report.
  maxFailures: 3,

  // Forensics folder
  outputDir: "test-results",

  use: {
    // AI FORENSICS: Retain a detailed DOM snapshot ONLY when a test fails.
    // Feed the trace logs to your agent so it knows exactly what broke.
    trace: "retain-on-failure",

    // Fallback visual proof for the human developer
    screenshot: "only-on-failure",

    // Connect to the Vite dev server
    baseURL: "http://localhost:4000",
  },

  // The Browser Matrix (Strictly Chromium as requested)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // The Autoboot: Spin up Vite, run tests, shut down Vite.
  webServer: {
    command: "npm run dev",
    port: 4000,
    reuseExistingServer: !process.env.CI,
    timeout: 15 * 1000, // Give Vite 15 seconds to boot before panicking
  },
});
