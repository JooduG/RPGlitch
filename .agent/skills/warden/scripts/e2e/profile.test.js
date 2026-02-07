import { expect, test } from "@playwright/test"

test.describe("Profile Component Refactor", () => {
    test.beforeEach(async ({ page }) => {
        page.on("console", (msg) => console.log("PAGE LOG:", msg.text()))
        // Mock characters and settings to ensure app state is ready
        await page.addInitScript(() => {
            window.rpgLists = {
                themes: [{ id: "default", name: "Default", colors: {} }],
                sounds: [],
                voices: [],
            }
        })

        // Navigate to the root
        await page.goto("http://localhost:4000")

        // Wait for app to be ready and database to seed
        await page.waitForLoadState("domcontentloaded")

        // Give the bootstrap logic a moment to persist data to Dexie
        await page.waitForTimeout(1000)

        // Wait for at least one storyboard card to be visible (always renders)
        console.log("Test: Waiting for storyboard-card in beforeEach...")
        try {
            await expect(
                page.getByTestId("storyboard-card").first()
            ).toBeVisible({
                timeout: 30000,
            })
            console.log("Test: storyboard-card found!")
        } catch (e) {
            console.error("Test: FAILED to find storyboard-card after 30s")
            await page.screenshot({ path: "beforeEach_failure.png" })
            throw e
        }
    })

    test("should open the profile from a storyboard card", async ({ page }) => {
        const viewProfileBtn = page.locator(".card-top").first()
        await viewProfileBtn.click({ force: true })

        // Verify the profile components via test-id
        await expect(page.getByTestId("profile-header")).toBeVisible({
            timeout: 10000,
        })
        await expect(page.getByTestId("profile-traits")).toBeVisible()
        await expect(page.getByTestId("profile-footer")).toBeVisible()
    })

    test("should enter and exit edit mode", async ({ page }) => {
        // Open profile
        await page.locator(".card-top").first().click({ force: true })

        // Find Edit button via test-id
        const editBtn = page.getByTestId("edit-btn")
        await expect(editBtn).toBeVisible({ timeout: 10000 })
        await editBtn.click({ force: true })

        // Check if header becomes editable
        await expect(page.locator("h1.name.edit")).toBeVisible()

        // Check if traits become textarea inputs
        await expect(
            page.locator("[data-testid='profile-traits'] textarea").first()
        ).toBeVisible()

        // Verify Footer has Save/Delete
        await expect(page.getByTestId("save-btn")).toBeVisible()
        await expect(page.getByTestId("delete-btn")).toBeVisible()

        // Click Save
        await page.getByTestId("save-btn").click({ force: true })

        // Verify back to readonly
        await expect(page.locator("h1.name:not(.edit)")).toBeVisible()
    })

    test.only("should show Dev Wing when dev mode is enabled", async ({
        page,
    }) => {
        // Redundant goto removed since beforeEach handles it

        // Open panel to enable dev mode
        await page.getByTestId("settings-button").click({ force: true })
        const devModeToggle = page.getByTestId("developer-mode-toggle")
        const devModeLabel = page
            .locator("label")
            .filter({ has: devModeToggle })

        const isChecked = await devModeToggle.isChecked()
        if (!isChecked) {
            await devModeLabel.click({ force: true })
        }
        // Close modal via Escape key (modal has onclose handler but no close button)
        await page.keyboard.press("Escape")
        await expect(page.getByTestId("cockpit-panel")).toBeHidden({
            timeout: 5000,
        })

        // Populate cards via Shuffle button (cards are empty by default)
        console.log("Test: Clicking Shuffle All to populate cards...")
        await page
            .getByRole("button", { name: "Shuffle All" })
            .click({ force: true })
        await page.waitForTimeout(500) // Allow state to propagate

        // Open profile
        console.log("Test: Waiting for storyboard card...")
        const card = page.getByTestId("storyboard-card").first()
        await expect(card).toBeVisible({ timeout: 10000 })

        // Wait for populated state (card-top only exists when entity is selected)
        console.log("Test: Waiting for populated .card-top...")
        await expect(card.locator(".card-top")).toBeVisible({ timeout: 10000 })

        console.log("Test: Clicking card top...")
        await card.locator(".card-top").click({ force: true })

        console.log("Test: Clicking edit button...")
        // Enter edit mode
        await page.getByTestId("edit-btn").click({ force: true })

        console.log("Test: Verifying isEditing state...")
        // Verify state synchronization to DOM
        await expect(page.getByTestId("profile-container")).toHaveAttribute(
            "data-is-editing",
            "true"
        )

        console.log("Test: Waiting for dev-wing...")
        // Verify wings are present
        await expect(page.getByTestId("visual-wing")).toBeVisible({
            timeout: 10000,
        })
        await expect(page.getByTestId("dev-wing")).toBeVisible({
            timeout: 10000,
        })
        console.log("Test: Dev-wing is visible!")
    })
})
