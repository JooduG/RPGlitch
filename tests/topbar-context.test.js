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
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  
  // Load the actual RPGlitch.js
  const rpgScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'), 'utf8');
  dom.window.eval(rpgScript);
  
  // Mock the methods that _attachTopBarEventListeners depends on
  dom.window.App.ui.showChin = jest.fn();
  dom.window.App.selectTopBarTab = jest.fn();
  dom.window.App._attachedTopBarButtons = new Set();
  
  // Test the actual method
  dom.window.App._attachTopBarEventListeners();
  dom.window.App._attachTopBarEventListeners();
  
  const btn = dom.window.document.querySelector('#top-bar-left button[data-chin="stories"]');
  if (btn) {
    btn.click();
    expect(dom.window.App.selectTopBarTab).toHaveBeenCalledTimes(1);
    expect(dom.window.App.ui.showChin).toHaveBeenCalledTimes(1);
    expect(dom.window.App.ui.showChin).toHaveBeenCalledWith('stories');
  }
});

