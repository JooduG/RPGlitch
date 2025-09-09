const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

function loadApp() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only'
  });

  // Provide minimal globals inside the JSDOM context
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  dom.window.eval(fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/utils.js'), 'utf8'));

  const script = fs.readFileSync(
    path.resolve(__dirname, '../apps/rpglitch/js/index.js'),
    'utf8'
  );
  dom.window.eval(script);

  // Return the isolated JSDOM context and the loaded App instance
  return { dom, App: dom.window.App };
}

test('hideEl hides by element or id', () => {
  const { dom, App } = loadApp();
  const document = dom.window.document;
  document.body.innerHTML = '<div id="test-el"></div>';
  const el = document.getElementById('test-el');
  expect(typeof App.hideEl).toBe('function');
  App.hideEl(el);
  expect(el.hasAttribute('hidden')).toBe(true);
  el.removeAttribute('hidden');
  // Using the string ID should work the same
  App.hideEl('test-el');
  expect(el.hasAttribute('hidden')).toBe(true);
});

test('showEl reveals element by removing hidden attribute', () => {
  const { dom, App } = loadApp();
  const document = dom.window.document;
  document.body.innerHTML = '<div id="test-el" hidden="hidden"></div>';
  const el = document.getElementById('test-el');
  App.showEl(el);
  expect(el.hasAttribute('hidden')).toBe(false);
  el.setAttribute('hidden', 'hidden');
  App.showEl('test-el');
  expect(el.hasAttribute('hidden')).toBe(false);
});
