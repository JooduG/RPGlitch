import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "npm run build && npm run preview",
    port: 4000,
    reuseExistingServer: !process.env.CI,
  },
  testDir: ".agents/skills/governance/tests/playwright",
  outputDir: "tmp",
});
