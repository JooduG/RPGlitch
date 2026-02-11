import { expect, test } from "@playwright/test"

test.describe("Control Panel Cockpit Redesign", () => {
    test.beforeEach(async ({ page }) => {
        // Mock rpgLists to bypass any bootstrap delays
        await page.addInitScript(() => {
            window.rpgLists = {
                themes: [],
            }
        })

        // Navigate to the root
        await page.goto("http://localhost:8080")
        // Wait for app to be ready
        await page.waitForLoadState("networkidle")
    })

    test("should open the control panel when settings button is clicked", async ({
        page,
    }) => {
        // Find the settings button in the StoryboardPill
        const settingsBtn = page.getByTestId("settings-button")

        // Ensure button is ready and click it with force to bypass any overlay issues
        await expect(settingsBtn).toBeVisible({ timeout: 15000 })
        await settingsBtn.click({ force: true })

        // Verify the cockpit panel via test-id
        const panel = page.getByTestId("cockpit-panel")

        // Wait for animation to stabilize
        await page.waitForTimeout(500)

        // Use a longer timeout and ensure visibility
        await expect(panel).toBeVisible({ timeout: 15000 })

        // Check for premium cockpit elements available in Lobby
        await expect(page.getByText(/CALL MODE/i)).toBeVisible({
            timeout: 10000,
        })
        await expect(page.getByText(/Story Library/i)).toBeVisible({
            timeout: 10000,
        })

        // GHOSTWRITE is only in story mode, so we don't check for it here
    })

    test("should toggle settings correctly", async ({ page }) => {
        // Open panel
        await page.getByTestId("settings-button").click({ force: true })
        await expect(page.getByTestId("cockpit-panel")).toBeVisible({
            timeout: 15000,
        })

        // Find the toggle
        const devModeToggle = page.getByTestId("developer-mode-toggle")
        await expect(devModeToggle).toBeAttached()

        // Initial state
        await expect(devModeToggle).not.toBeChecked()

        // Click the label
        const devModeLabel = page
            .locator("label")
            .filter({ has: devModeToggle })
        await devModeLabel.click({ force: true })

        // Verify state
        await expect(devModeToggle).toBeChecked({ timeout: 10000 })
    })

    test("should allow closing the panel", async ({ page }) => {
        // Open panel
        await page.getByTestId("settings-button").click({ force: true })
        await expect(page.getByTestId("cockpit-panel")).toBeVisible({
            timeout: 15000,
        })

        // Click close button
        await page.getByTestId("close-modal").click({ force: true })

        // Verify panel is gone
        await expect(page.getByTestId("cockpit-panel")).not.toBeVisible({
            timeout: 15000,
        })
    })
})
