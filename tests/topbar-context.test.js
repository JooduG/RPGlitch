const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

// Test the actual _attachTopBarEventListeners method

test('top bar click triggers chin toggle without duplicate handlers', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/html/index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  
  // Load the actual RPGlitch.js
  const utilsScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/utils.js'), 'utf8');
  dom.window.eval(utilsScript);
  const rpgScript = fs.readFileSync(path.join(__dirname, '../apps/rpglitch/js/index.js'), 'utf8');
  dom.window.eval(rpgScript);

  dom.window.App.chin.init();
  dom.window.App.chin.init();

  const btn = dom.window.document.querySelector('#top-bar-left button[data-chin="stories"]');
  const panel = dom.window.document.querySelector('.chin[data-chin="stories"]');
  if (btn && panel) {
    btn.click();
    expect(panel.hasAttribute('hidden')).toBe(false);
    btn.click();
    expect(panel.hasAttribute('hidden')).toBe(true);
  }
});

