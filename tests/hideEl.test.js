const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function loadApp() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only'
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.Dexie = function () {};
  global.DOMPurify = {};
  global._hyperscript = {};
  global.$ = function () {};

  const hideElScript = fs.readFileSync(
    path.resolve(__dirname, '../apps/rpglitch/utils/hideEl.js'),
    'utf8'
  );
  dom.window.eval(hideElScript);

  const script = fs.readFileSync(
    path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'),
    'utf8'
  );
  dom.window.eval(script);
  return dom.window.App;
}

test('hideEl hides by element or id', () => {
  const App = loadApp();
  document.body.innerHTML = '<div id="test-el"></div>';
  const el = document.getElementById('test-el');

  expect(typeof window.App.hideEl).toBe('function');
  App.hideEl(el);
  expect(el.classList.contains('hidden')).toBe(true);

  el.classList.remove('hidden');
  App.hideEl('test-el');
  expect(el.classList.contains('hidden')).toBe(true);
});
