const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Use file protocol to load the built app
  const appPath = path.resolve('apps/rpglitch/RPGlitch.html');
  await page.goto(`file://${appPath}`);

  // Take a screenshot of the initial load (Chat view)
  await page.screenshot({ path: 'chat_verification.png', fullPage: true });

  console.log('Screenshot taken: chat_verification.png');
  await browser.close();
})();
