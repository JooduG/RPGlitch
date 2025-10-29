import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen for uncaught exceptions in the page
  page.on('pageerror', error => {
    console.error('Uncaught page error:', error);
  });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.dismiss();
  });

  // Navigate to the local HTML file
  await page.goto(`file://${path.join(process.cwd(), 'build/output/RPGlitch.html')}`);

  // Wait for the dropdowns to be populated
  await page.waitForFunction(() => document.querySelector('select#storyboard-ai-select').options.length > 1);
  await page.waitForFunction(() => document.querySelector('select#storyboard-user-select').options.length > 1);
  await page.waitForFunction(() => document.querySelector('select#storyboard-world-select').options.length > 1);
  console.log('Dropdowns are populated.');

  // Select options
  await page.selectOption('select#storyboard-ai-select', { index: 1 });
  await page.selectOption('select#storyboard-user-select', { index: 1 });
  await page.selectOption('select#storyboard-world-select', { index: 1 });
  console.log('Options selected.');

  // Verify selections
  const values = await page.evaluate(() => ({
    ai: document.querySelector('select#storyboard-ai-select').value,
    user: document.querySelector('select#storyboard-user-select').value,
    world: document.querySelector('select#storyboard-world-select').value,
  }));
  console.log('Selected values:', values);
  if (!values.ai || !values.user || !values.world) {
    console.error('ERROR: One of the select values is empty. Aborting.');
    await page.screenshot({ path: 'frontend_verification_error.png' });
    await browser.close();
    process.exit(1);
  }

  // Click the "Begin Story" button
  await page.click('button#begin-story');
  console.log('Clicked "Begin Story".');

  // Wait for the chat screen to be visible
  console.log('Waiting for chat screen...');
  try {
    await page.waitForSelector('#chat-screen-container:not([hidden])', { timeout: 15000 });
    console.log('Chat screen is visible.');
    await page.screenshot({ path: 'frontend_verification.png' });
    console.log('Frontend verification successful, screenshot taken.');
  } catch (e) {
    console.error('Failed to find chat screen.');
    await page.screenshot({ path: 'frontend_verification_error.png' });
    throw e;
  } finally {
    await browser.close();
  }
})();
