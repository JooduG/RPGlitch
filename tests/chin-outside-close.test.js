import { JSDOM } from 'jsdom';

jest.mock('../apps/rpglitch/js/entities.js', () => ({
  entities: {
    list: jest.fn(),
  },
  getPremadeItems: jest.fn().mockReturnValue([]),
  _allItemsCache: {},
}));

async function loadApp(htmlContent = '<!doctype html><html><body></body></html>') {
  // Clear the document body before each test
  document.body.innerHTML = htmlContent;

  // Re-import modules to get a fresh state
  jest.resetModules();
  const utils = await import('../apps/rpglitch/js/utils.js');
  const index = await import('../apps/rpglitch/js/index.js');

  // App object is now constructed from re-imported modules
  const App = {
    ...index,
    ...utils,
  };

  return { App }; // No need to return dom anymore
}

afterEach(() => {
  // delete global.window;
  // delete global.document;
  delete global.App;
  jest.resetModules();
  jest.clearAllMocks();
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
  const { App } = await loadApp(html);

  // Ensure listeners are attached
  App.chin.init();

  // Open the Stories chin
  App.chin.open('stories');
  await new Promise(resolve => setTimeout(resolve, 0));
  // Re-query elements after modification
  let cont = document.getElementById('chin-container');
  let panel = document.querySelector('.chin[data-chin="stories"]');
  expect(cont.hasAttribute('hidden')).toBe(false);
  // container should be interactive while open
  expect(cont.style.pointerEvents).toBe('auto');
  expect(panel.hasAttribute('hidden')).toBe(false);

  // Click on backdrop (outside chin but within container)
  const bd = document.getElementById('chin-backdrop');
  bd.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

  await new Promise(resolve => setTimeout(resolve, 0));
  // Re-query elements after modification
  cont = document.getElementById('chin-container');
  expect(cont.hasAttribute('hidden')).toBe(true);
  expect(cont.style.pointerEvents).toBe('none');
});