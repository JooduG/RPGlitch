import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "npm run build && npm run preview",
    port: 4000,
    reuseExistingServer: !process.env.CI,
  },
  testDir: ".agent/skills/warden/scripts/e2e",
});
