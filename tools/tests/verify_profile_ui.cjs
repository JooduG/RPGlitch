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

  try {
    await page.waitForSelector('body', { state: 'visible' });

    // Let's wait a bit for any animations.
    await page.waitForTimeout(1000);

    // Attempt to verify CSS changes if we can access the relevant styles
    // Since we cannot easily navigate to the profile modal in this headless, data-less environment,
    // we will check if the CSS rules are present in the document.
    // The styles are inlined in the head or body.

    const isStylePresent = await page.evaluate(() => {
        // Using getComputedStyle on dummy elements is more robust than iterating stylesheets.

        // Check .field-row styles
        const rowDummy = document.createElement('div');
        rowDummy.className = 'field-row';
        document.body.appendChild(rowDummy);
        const rowStyle = window.getComputedStyle(rowDummy);
        const isRowOk = rowStyle.display === 'flex' && rowStyle.flexDirection === 'column';
        document.body.removeChild(rowDummy);

        // Check .field-label styles
        const labelDummy = document.createElement('div');
        labelDummy.className = 'field-label';
        document.body.appendChild(labelDummy);
        const labelStyle = window.getComputedStyle(labelDummy);
        const isLabelOk = labelStyle.display === 'flex' && labelStyle.alignItems === 'baseline';
        document.body.removeChild(labelDummy);

        return isRowOk && isLabelOk;
    });

    console.log(`Styles verification passed: ${isStylePresent}`);

    if (!isStylePresent) {
        console.error("FAILED: CSS verification for .field-row or .field-label failed.");
    }

  } catch (e) {
    console.error("Error verifying:", e);
  }

  // Take screenshot
  await page.screenshot({ path: 'verification/profile_ui_refined.png', fullPage: true });

  await browser.close();
})();
