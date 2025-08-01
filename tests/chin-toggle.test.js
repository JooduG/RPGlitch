const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

test('early chin toggle reveals chin container and selected chin', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.alert = () => {};
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  const utilsScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/utils.js'), 'utf8');
  dom.window.eval(utilsScript);

  const rpgScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'), 'utf8');
  dom.window.eval(rpgScript);


  dom.window.App._toggleChinContent('stories');
  const chinContainer = dom.window.document.getElementById('chin-container');
  const selectedChin = dom.window.document.querySelector('[data-chin="stories"]');
  expect(chinContainer.classList.contains('hidden')).toBe(false);
  expect(selectedChin.classList.contains('hidden')).toBe(false);
});
