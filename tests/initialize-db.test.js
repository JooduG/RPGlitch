const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

function loadApp() {
  const html = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/html/index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.document.addEventListener = jest.fn();
  dom.window.alert = () => {};
  dom.window.Dexie = jest.fn(function(name){
    this.name = name;
    this.version = jest.fn().mockReturnThis();
    this.stores = jest.fn().mockReturnThis();
    this.upgrade = jest.fn().mockReturnThis();
    this.open = jest.fn().mockResolvedValue();
  });
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function(){};
  const utilsScript = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/utils.js'), 'utf8');
  dom.window.eval(utilsScript);
  const script = fs.readFileSync(path.resolve(__dirname, '../apps/rpglitch/js/index.js'), 'utf8');
  dom.window.eval(script);
  if (typeof dom.window.App._getUIElements !== 'function') {
    dom.window.App._getUIElements = jest.fn();
  }
  return { App: dom.window.App, dom };
}

test('initializeDb uses default db name when window.dbName is undefined', async () => {
  const { App, dom } = loadApp();
  App.initialLoad = jest.fn().mockResolvedValue();
  App._attachStoryboardEventListeners = jest.fn();
  await App.initializeWhenReady();
  expect(dom.window.dbName).toBe('rpglitch-db');
});
