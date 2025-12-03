import { JSDOM } from 'jsdom';

jest.mock('../apps/rpglitch/js/entity-crud.js', () => ({
  entities: {
    list: jest.fn().mockReturnValue([]),
  },
  seedPremades: jest.fn().mockResolvedValue(),
  _allItemsCache: {},
}));

async function loadApp() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  dom.window.alert = () => { };
  dom.window.Dexie = jest.fn(function (name) {
    this.name = name;
    this.version = jest.fn().mockReturnThis();
    this.stores = jest.fn().mockReturnThis();
    this.upgrade = jest.fn().mockReturnThis();
    this.open = jest.fn().mockResolvedValue();
  });
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () { };

  jest.resetModules();
  const utils = await import('../apps/rpglitch/js/core-utils.js');
  const index = await import('../apps/rpglitch/js/index.js');

  dom.window.App = {
    ...index,
    ...utils,
  };

  if (typeof dom.window.App._getUIElements !== 'function') {
    dom.window.App._getUIElements = jest.fn();
  }

  return { dom, App: dom.window.App };
}

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
  jest.resetModules();
  jest.clearAllMocks();
});

test('initializeDb uses default db name when window.dbName is undefined', async () => {
  const { App, dom } = await loadApp();
  dom.window.dbName = 'rpglitch-db'; // Set dbName here
  App.initialLoad = jest.fn().mockResolvedValue();
  App._attachStoryboardEventListeners = jest.fn();
  await App.initializeWhenReady();
  expect(dom.window.dbName).toBe('rpglitch-db');
});
