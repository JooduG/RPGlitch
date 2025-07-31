const { JSDOM } = require('jsdom');

// Import or require the actual App object to test the real implementation
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

test('hideEl hides by element or id', () => {
  const html = '<div id="test-el"></div>';
  const dom = new JSDOM(html);
  global.window = dom.window;
  global.document = dom.window.document;
  
  // Load the actual RPGlitch.js to test the real hideEl function
  const rpgScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'), 'utf8');
  dom.window.eval(rpgScript);
  
  const el = document.getElementById('test-el');
  dom.window.App.hideEl(el);
  expect(el.classList.contains('hidden')).toBe(true);
  
  el.classList.remove('hidden');
  dom.window.App.hideEl('test-el');
  expect(el.classList.contains('hidden')).toBe(true);
});

test('hideEl hides by element or id', () => {
  const html = '<div id="test-el"></div>';
  const dom = new JSDOM(html);
  global.window = dom.window;
  global.document = dom.window.document;
  const el = document.getElementById('test-el');
  hideEl(el);
  expect(el.classList.contains('hidden')).toBe(true);
  el.classList.remove('hidden');
  hideEl('test-el');
  expect(el.classList.contains('hidden')).toBe(true);
});
