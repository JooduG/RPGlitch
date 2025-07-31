const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Test the actual _attachTopBarEventListeners method
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

test('top bar click triggers chin toggle without context errors', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  
  // Load the actual RPGlitch.js
  const rpgScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'), 'utf8');
  dom.window.eval(rpgScript);
  
  // Mock the methods that _attachTopBarEventListeners depends on
  dom.window.App._toggleChinContent = jest.fn();
  dom.window.App.selectTopBarTab = jest.fn();
  
  // Test the actual method
  dom.window.App._attachTopBarEventListeners();
  
  const btn = dom.window.document.querySelector('#top-bar-left button[data-chin="stories"]');
  if (btn) {
    btn.click();
    expect(dom.window.App.selectTopBarTab).toHaveBeenCalled();
  }
});

test('top bar click triggers chin toggle without context errors', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  const App = {
    _toggleChinContent: jest.fn(),
    selectTopBarTab(tab) { this._toggleChinContent(tab); }
  };
  attachTopBarEventListeners(App);
  const btn = dom.window.document.querySelector('#top-bar-left button[data-chin="stories"]');
  btn.click();
  expect(App._toggleChinContent).toHaveBeenCalled();
});
