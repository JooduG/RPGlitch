import { test, expect } from "@playwright/test";

test.describe("RPGlitch Smoke Tests", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("http://localhost:4000");
    await expect(page).toHaveTitle(/RPGlitch/);
  });

  test("should have the main story container", async ({ page }) => {
    await page.goto("http://localhost:4000");
    await expect(page.locator(".app-container")).toBeVisible({ timeout: 10000 });
  });
});
