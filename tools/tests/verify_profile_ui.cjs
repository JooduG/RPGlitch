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
        // Search through all stylesheets
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.selectorText && rule.selectorText.includes('.field-label')) {
                        // Check if the rule contains the flex property
                        if (rule.style.display === 'flex' && rule.style.alignItems === 'baseline') {
                            return true;
                        }
                    }
                    // Also check .field-row for column direction
                    if (rule.selectorText && rule.selectorText.includes('.field-row')) {
                        if (rule.style.flexDirection === 'column') {
                           // We found at least one of our key layout changes
                           // Ideally we find both, but let's return true if we find the container one
                        }
                    }
                }
            } catch (e) {
                // Ignore cross-origin issues if any (though file:// should be fine)
            }
        }

        // Alternative: Create a dummy element and check computed style
        const dummy = document.createElement('div');
        dummy.className = 'field-label';
        document.body.appendChild(dummy);
        const style = window.getComputedStyle(dummy);
        const isFlex = style.display === 'flex';
        const isBaseline = style.alignItems === 'baseline';
        document.body.removeChild(dummy);

        return isFlex && isBaseline;
    });

    console.log(`Styles verification passed: ${isStylePresent}`);

    if (!isStylePresent) {
        console.error("FAILED: .field-label does not appear to have display: flex and align-items: baseline");
    }

  } catch (e) {
    console.error("Error verifying:", e);
  }

  // Take screenshot
  await page.screenshot({ path: 'verification/profile_ui_refined.png', fullPage: true });

  await browser.close();
})();
