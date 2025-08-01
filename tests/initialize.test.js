const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

function loadApp(dom) {
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.App = {};
  global.Dexie = function () {};
  global.DOMPurify = {};
  global._hyperscript = {};
  global.$ = function () {};
  const script = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.js'), 'utf8');
  dom.window.eval(script);
  if (typeof dom.window.App._getUIElements !== 'function') {
    dom.window.App._getUIElements = function () {};
  }
  return dom.window.App;
}

test('initializeWhenReady runs without errors', async () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/RPGlitch.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  const App = loadApp(dom);
  App.initialLoad = jest.fn().mockResolvedValue();
  App._attachStoryboardEventListeners = jest.fn();
  await expect(App.initializeWhenReady()).resolves.not.toThrow();
});

test('_getUIElements is defined before initialization', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
  const App = loadApp(dom);
  expect(typeof App._getUIElements).toBe('function');
});
