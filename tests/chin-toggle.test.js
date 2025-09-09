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

test('early chin toggle reveals chin container and selected chin', async () => {
  const html = `<!doctype html><html><body>
    <div id="chin-container">
      <div class="chin" data-chin="stories" hidden></div>
    </div>
  </body></html>`;
  const { dom, App } = await loadApp(html);

  App.chin.init();
  App.chin.open('stories');
  const chinContainer = dom.window.document.getElementById('chin-container');
  const selectedChin = dom.window.document.querySelector('[data-chin="stories"]');
  expect(chinContainer.hasAttribute('hidden')).toBe(false);
  expect(selectedChin.hasAttribute('hidden')).toBe(false);
});
