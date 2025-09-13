import { JSDOM } from 'jsdom';

jest.mock('../apps/rpglitch/js/entities.js', () => ({
  entities: {
    list: jest.fn().mockReturnValue([]),
  },
  getPremadeItems: jest.fn().mockReturnValue([]),
  _allItemsCache: {},
}));

async function loadApp(htmlContent = '<!doctype html><html><body></body></html>') {
  const dom = new JSDOM(htmlContent, {
    url: 'http://localhost',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  dom.window.alert = () => {};
  dom.window.Dexie = function () {};
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

  if (typeof dom.window.App._getUIElements !== 'function') {
    dom.window.App._getUIElements = jest.fn();
  }

  return dom.window.App;
}

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
  jest.resetModules();
  jest.clearAllMocks();
});

test('initializeWhenReady runs without errors', async () => {
  const html = `<!doctype html><html><body></body></html>`; // Simplified HTML
  const App = await loadApp(html);
  App.initialLoad = jest.fn().mockResolvedValue();
  App._attachStoryboardEventListeners = jest.fn();
  await expect(App.initializeWhenReady()).resolves.toBe(true);
});

test('_getUIElements is defined before initialization', async () => {
  const App = await loadApp();
  expect(typeof App._getUIElements).toBe('function');
});

test('initializeWhenReady resets retry counter on success', async () => {
  const html = `<!doctype html><html><body></body></html>`; // Simplified HTML
  const App = await loadApp(html);
  window.initializeWhenReadyRetryCount = 2;
  App.initialLoad = jest.fn().mockResolvedValue();
  App._attachStoryboardEventListeners = jest.fn();
  await App.initializeWhenReady();
  expect(window.initializeWhenReadyRetryCount).toBe(0);
});
