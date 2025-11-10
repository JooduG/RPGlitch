#!/usr/bin/env node


/**
 * Automation Script: Collect Browser Diagnostics from BrowserTools MCP/Server
 *
 * - Fetches console logs, errors, network logs
 * - Runs accessibility, performance, SEO, and best practices audits
 * - Captures a screenshot
 * - Saves all results to a timestamped folder (JSON and text)
 *
 * Usage: node automation-collect-diagnostics.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SERVER_URL = process.env.BROWSERTOOLS_SERVER_URL || 'http://localhost:3025';
const OUT_DIR = path.join(__dirname, 'diagnostics', new Date().toISOString().replace(/[:.]/g, '-'));

async function fetchAndSave(endpoint, name) {
  try {
    const res = await axios.get(`${SERVER_URL}${endpoint}`);
    const jsonPath = path.join(OUT_DIR, `${name}.json`);
    const txtPath = path.join(OUT_DIR, `${name}.txt`);
    fs.writeFileSync(jsonPath, JSON.stringify(res.data, null, 2));
    fs.writeFileSync(txtPath, typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
    console.log(`Saved ${name}`);
  } catch (err) {
    console.error(`Failed to fetch ${name}:`, err.message);
  }
}

async function fetchScreenshot() {
  try {
    const res = await axios.get(`${SERVER_URL}/screenshot`, { responseType: 'arraybuffer' });
    const imgPath = path.join(OUT_DIR, 'screenshot.png');
    fs.writeFileSync(imgPath, res.data);
    console.log('Saved screenshot');
  } catch (err) {
    console.error('Failed to fetch screenshot:', err.message);
  }
}

async function writeSummary() {
  const summary = `Diagnostics Bundle Summary\n========================\n\nCaptured in this bundle:\n- Console logs (console.log, console.warn, console.error)\n- Console errors\n- Network logs (successes and errors)\n- Selected DOM element\n- Accessibility, performance, SEO, and best practices audits\n- Screenshot\n\nNOT captured (DevTools only):\n- Chrome [Violation] warnings (e.g., non-passive event listeners)\n- [DOM] warnings (e.g., password field not in form)\n- Feature policy warnings (e.g., Unrecognized feature: 'ambient-light-sensor')\n\nTo see these, open Chrome DevTools > Console.\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'summary.txt'), summary, 'utf8');
  console.log(summary);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Saving diagnostics to', OUT_DIR);

  await fetchAndSave('/console-logs', 'console-logs');
  await fetchAndSave('/console-errors', 'console-errors');
  await fetchAndSave('/network-errors', 'network-errors');
  await fetchAndSave('/network-success', 'network-success');
  await fetchAndSave('/all-xhr', 'all-network-logs');
  await fetchAndSave('/selected-element', 'selected-element');

  await fetchAndSave('/accessibility-audit', 'accessibility-audit');
  await fetchAndSave('/performance-audit', 'performance-audit');
  await fetchAndSave('/seo-audit', 'seo-audit');
  await fetchAndSave('/best-practices-audit', 'best-practices-audit');

  await fetchScreenshot();

  await writeSummary();

  console.log('Diagnostics collection complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 