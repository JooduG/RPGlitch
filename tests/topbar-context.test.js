import { JSDOM } from 'jsdom';

jest.mock('../apps/rpglitch/js/entities.js', () => ({
  entities: {
    list: jest.fn().mockReturnValue([]),
  },
  getPremadeItems: jest.fn().mockReturnValue([]),
  _allItemsCache: {},
}));

async function loadApp(html) {
  const dom = new JSDOM(html, {
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

  const utils = await import('../apps/rpglitch/js/utils.js');
  const index = await import('../apps/rpglitch/js/index.js');

  dom.window.App = {
    ...index,
    ...utils,
  };

  return { dom, App: dom.window.App };
}

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
  const entities = require('../apps/rpglitch/js/entities.js');
  for (const key in entities._allItemsCache) {
    delete entities._allItemsCache[key];
  }
});

test('top bar click triggers chin toggle without duplicate handlers', async () => {
  const html = `<!doctype html><html><body>
    <header id="top-bar">
      <div id="top-bar-left">
        <button data-chin="stories"></button>
      </div>
    </header>
    <div id="chin-container">
      <div class="chin" data-chin="stories" hidden></div>
    </div>
  </body></html>`;
  const { dom, App } = await loadApp(html);

  App.chin.init();
  App.chin.init(); // Call twice to ensure no duplicate handlers

  const btn = dom.window.document.querySelector('#top-bar-left button[data-chin="stories"]');
  const panel = dom.window.document.querySelector('.chin[data-chin="stories"]');
  if (btn && panel) {
    btn.click();
    App.chin.sync();
    expect(panel.hasAttribute('hidden')).toBe(false);
    btn.click();
    App.chin.sync();
    expect(panel.hasAttribute('hidden')).toBe(true);
  }
});
