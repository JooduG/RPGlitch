import { JSDOM } from 'jsdom';

jest.mock('../apps/rpglitch/js/entities.js', () => ({
  getPictureHTML: jest.fn(),
}));

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

async function loadApp() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  // Provide proper Dexie mock
  dom.window.Dexie = jest.fn(function(name){
    this.name = name;
    this.version = jest.fn().mockReturnThis();
    this.stores = jest.fn().mockReturnThis();
    this.upgrade = jest.fn().mockReturnThis();
    this.open = jest.fn().mockResolvedValue();
  });
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  jest.resetModules();
  const utils = await import('../apps/rpglitch/js/utils.js');
  const index = await import('../apps/rpglitch/js/index.js');

  dom.window.App = {
    ...index,
    ...utils,
  };

  // Return the isolated JSDOM context and the loaded App instance
  return { dom, App: dom.window.App };
}

test('hideEl hides by element or id', async () => {
  const { dom, App } = await loadApp();
  const document = dom.window.document;
  document.body.innerHTML = '<div id="test-el"></div>';
  const el = document.getElementById('test-el');
  expect(typeof App.hideEl).toBe('function');
  App.hideEl(el, document);
  expect(el.hasAttribute('hidden')).toBe(true);
  el.removeAttribute('hidden');
  // Using the string ID should work the same
  App.hideEl('test-el', document);
  expect(el.hasAttribute('hidden')).toBe(true);
});

test('showEl reveals element by removing hidden attribute', async () => {
  const { dom, App } = await loadApp();
  const document = dom.window.document;
  document.body.innerHTML = '<div id="test-el" hidden="hidden"></div>';
  const el = document.getElementById('test-el');
  App.showEl(el, document);
  expect(el.hasAttribute('hidden')).toBe(false);
  el.setAttribute('hidden', 'hidden');
  App.showEl('test-el', document);
  expect(el.hasAttribute('hidden')).toBe(false);
});
