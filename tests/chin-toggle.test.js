const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

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

  const hideElScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/utils/hideEl.js'), 'utf8');
  dom.window.eval(hideElScript);

  const rpgScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'), 'utf8');
  dom.window.eval(rpgScript);

  if (typeof dom.window.App.showEl !== 'function') {
    dom.window.App.showEl = function (el) {
      if (typeof el === 'string') el = dom.window.document.getElementById(el);
      if (!el) return null;
      el.classList.remove('hidden');
      el.style.visibility = '';
      el.style.display = '';
      return el;
    };
  }

  dom.window.App._toggleChinContent('stories');
  const chinContainer = dom.window.document.getElementById('chin-container');
  const selectedChin = dom.window.document.querySelector('[data-chin="stories"]');
  expect(chinContainer.classList.contains('hidden')).toBe(false);
  expect(selectedChin.classList.contains('hidden')).toBe(false);
});
