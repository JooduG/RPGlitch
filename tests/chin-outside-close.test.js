import { JSDOM } from 'jsdom';

jest.mock('../apps/rpglitch/js/entities.js', () => ({
  entities: {
    list: jest.fn(),
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

  // Mock getComputedStyle
  dom.window.getComputedStyle = jest.fn((el) => {
    return {
      pointerEvents: el.style.pointerEvents,
    };
  });

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

test('outside click closes chin and disables container pointer-events', async () => {
  const html = `<!doctype html><html><body>
    <header id="top-bar"></header>
    <div id="chin-container" style="pointer-events: none;">
      <div id="chin-backdrop" hidden></div>
      <div class="chin" data-chin="stories" hidden></div>
      <div class="chin" data-chin="characters" hidden></div>
    </div>
  </body></html>`;
  const { dom, App } = await loadApp(html);

  // Ensure listeners are attached
  App.chin.init();

  // Open the Stories chin
  App.chin.open('stories');
  await new Promise(resolve => setTimeout(resolve, 0));
  const cont = dom.window.document.getElementById('chin-container');
  const panel = dom.window.document.querySelector('.chin[data-chin="stories"]');
  expect(cont.hasAttribute('hidden')).toBe(false);
  // container should be interactive while open
  expect(cont.style.pointerEvents).toBe('auto');
  expect(panel.hasAttribute('hidden')).toBe(false);

  // Click on backdrop (outside chin but within container)
  const bd = dom.window.document.getElementById('chin-backdrop');
  bd.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

  await new Promise(resolve => setTimeout(resolve, 0));
  // Container becomes hidden and non-interactive
  expect(cont.hasAttribute('hidden')).toBe(true);
  expect(cont.style.pointerEvents).toBe('none');
});
