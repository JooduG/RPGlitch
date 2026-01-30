import { expect, test } from "@playwright/test"

test.describe("Control Panel Cockpit Redesign", () => {
    test.beforeEach(async ({ page }) => {
        // Mock rpgLists to bypass the 5s bootstrap delay
        await page.addInitScript(() => {
            window.rpgLists = {
                // Add minimal mock data if needed, or just empty object
                themes: [],
            }
        })

        // Navigate to the root
        await page.goto("http://localhost:8080")
    })

    test("should open the control panel when settings button is clicked", async ({
        page,
    }) => {
        // Find the settings button in the StoryboardPill
        const settingsBtn = page.getByRole("button", { name: /settings/i })
        await expect(settingsBtn).toBeVisible()

        // Click to open
        await settingsBtn.click()

        // Verify the cockpit panel is visible
        const panel = page.locator(".cockpit-panel")
        await expect(panel).toBeVisible()

        // Check for premium cockpit elements
        await expect(page.getByText(/MISSION BRIEFING/i)).toBeVisible()
        await expect(page.getByText(/GHOSTWRITE/i)).toBeVisible()
        await expect(page.getByText(/SYNC/i)).toBeVisible()
    })

    test("should toggle settings correctly", async ({ page }) => {
        // Open panel
        await page.getByRole("button", { name: /settings/i }).click()

        // Find a toggle label (e.g. DEV MODE)
        const devModeLabel = page
            .locator("label")
            .filter({ hasText: /DEV MODE/i })
        const devModeToggle = devModeLabel.locator("input")

        // Check initial state (should be false by default in AppStore)
        await expect(devModeToggle).not.toBeChecked()

        // Click the label instead of the input (input is hidden)
        await devModeLabel.click()
        await expect(devModeToggle).toBeChecked()

        // Verify state persistence via evaluate if possible
        const devModeState = await page.evaluate(
            () => window.app.settings.devMode
        )
        expect(devModeState).toBe(true)
    })

    test("should allow closing the panel", async ({ page }) => {
        // Open panel
        await page.getByRole("button", { name: /settings/i }).click()
        await expect(page.locator(".cockpit-panel")).toBeVisible()

        // Click close button
        await page.getByRole("button", { name: "×" }).click()

        // Verify panel is gone
        await expect(page.locator(".cockpit-panel")).not.toBeVisible()
    })
})
