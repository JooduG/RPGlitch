import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "npm run build && npm run preview",
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
  testDir: "tools/tests/e2e",
});
