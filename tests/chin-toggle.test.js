

jest.mock('../apps/rpglitch/js/entity-crud.js', () => ({
  entities: {
    list: jest.fn().mockReturnValue([]),
  },
  seedPremades: jest.fn().mockResolvedValue(),
  _allItemsCache: {},
}));

async function loadApp(html) {
  // Clear the document body before each test
  document.body.innerHTML = html;

  // Re-import modules to get a fresh state
  jest.resetModules();
  const utils = await import('../apps/rpglitch/js/core-utils.js');
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

test('App.chin.open() reveals chin container and selected chin', async () => {
  const html = `<!doctype html><html><body>
    <div id="chin-container" hidden>
      <div class="chin" data-chin="stories" hidden></div>
    </div>
  </body></html>`;
  const { App } = await loadApp(html);

  App.chin.init();
  App.chin.open('stories');
  await new Promise(resolve => setTimeout(resolve, 0));
  // Use global.document directly
  const chinContainer = document.getElementById('chin-container');
  const selectedChin = document.querySelector('[data-chin="stories"]');
  expect(chinContainer.hasAttribute('hidden')).toBe(false);
  expect(selectedChin.hasAttribute('hidden')).toBe(false);
});

test('clicking a button toggles the chin (simplified)', async () => {
  const html = `<!doctype html><html><body>
    <div id="chin-container">
      <div class="chin" data-chin="stories" hidden></div>
    </div>
  </body></html>`;
  const { App } = await loadApp(html);

  // Use global.document directly
  let panel = document.querySelector('.chin[data-chin="stories"]');

  // Open the chin
  App.chin.open('stories');
  await new Promise(resolve => requestAnimationFrame(() => resolve())); // Wait for DOM update
  // Re-query panel after modification
  panel = document.querySelector('.chin[data-chin="stories"]');
  expect(panel.hidden).toBe(false);

  // Close the chin
  App.chin.close('stories');
  await new Promise(resolve => requestAnimationFrame(() => resolve())); // Wait for DOM update
  // Re-query panel after modification
  panel = document.querySelector('.chin[data-chin="stories"]');
  expect(panel.hidden).toBe(true);
});
