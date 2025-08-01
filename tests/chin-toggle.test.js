const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

test('early chin toggle runs without errors', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.alert = () => {};
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  const hideElScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/utils/hideEl.js'), 'utf8');
  dom.window.eval(hideElScript);

  const rpgScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'), 'utf8');
  dom.window.eval(rpgScript);

  if (typeof dom.window.App.showEl !== 'function') dom.window.App.showEl = () => {};
  if (typeof dom.window.App.hideEl !== 'function') dom.window.App.hideEl = () => {};

  expect(() => dom.window.App._toggleChinContent('stories')).not.toThrow();
});
