const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Use file protocol to load the built app
  const appPath = path.resolve('apps/rpglitch/RPGlitch.html');
  console.log(`Loading app from: file://${appPath}`);

  await page.goto(`file://${appPath}`);

  // Wait for app initialization (splash screen to go away or main element to appear)
  // Assuming .layout-main or similar exists. The memory says "builds... into a standalone RPGlitch.html... inlines CSS and JS".
  // The app likely starts with a welcome screen or similar.
  // We need to navigate to a profile.
  // Since we don't know the exact startup flow, we'll try to find a way to open a profile.
  // Usually there's a "New Character" or similar.

  // Let's dump the body text to see what's there if we get stuck.
  try {
    await page.waitForSelector('body', { state: 'visible' });

    // We need to trigger the profile modal.
    // In `rpglitch`, usually clicking a character or the "New" button works.
    // Let's look for a button to add/create.
    // Based on `orchestrator.js` logic (not seen but inferred), or `bootstrap.js`.

    // Let's try to evaluate script to open a profile directly if possible,
    // but better to interact with UI.
    // If the app is empty, maybe there's a "Create New" button?

    // Let's wait a bit for any animations.
    await page.waitForTimeout(1000);

    // Take a screenshot of the landing page first to debug if needed
    await page.screenshot({ path: 'verification/landing.png' });

    // Try to find a way to open a profile.
    // If it's the "start" screen, maybe we need to click "Start" or something.
    // Looking at `view.js` logic, it renders profile view.
    // Maybe we can inject a script to force open a profile?

    // Let's try to use the exposed global functions if any.
    // `apps/rpglitch/js/ui/orchestrator.js` might expose something.

    // SIMPLER APPROACH:
    // Create a dummy entity in the database (since it uses Dexie/IndexedDB) and open it?
    // Or just invoke the `renderProfileView` or `renderProfileEdit` logic?

    // In the console context of the page:
    await page.evaluate(async () => {
      // Import the orchestrator or use global 'rpglitch' if available?
      // Since it is a module app, globals might be limited.
      // However, `renderProfileEdit` is what we want to test.

      // If we can't easily reach the module, we might need to rely on UI buttons.
      // Let's assume there is a button to create a character.
      // "Create Entity" or "+" button.
    });

    // Let's look for a button with aria-label "Create" or similar?
    // Or just take a screenshot of whatever is there.
    // Actually, the prompt says "Profile UX Module". I need to see the profile modal.

    // Hack: We can try to inject HTML directly to simulate the modal if navigation is hard,
    // but better to use the app.

    // Let's try to click a button that looks like "Add" or "Profile".
    // On a fresh load, `rpglitch` might show a "Getting Started" or empty list.

    // Let's try to trigger a profile edit for a "New" entity.
    // The `edit.js` exports `renderProfileEdit`.

    // If we can't access modules, we can try to find a button.
    // Let's wait for a specific selector: `.btn-main-action` or similar.

    // To ensure we see the modal, let's try to click the first available interactive element
    // that might open a profile.

    // Failing that, I will take a screenshot of the main page and hope it's enough
    // or provides clues.
    // BETTER: I will try to create a profile via the UI.

  } catch (e) {
    console.error("Error navigating:", e);
  }

  // Take screenshot
  await page.screenshot({ path: 'verification/profile_ui.png', fullPage: true });

  await browser.close();
})();
