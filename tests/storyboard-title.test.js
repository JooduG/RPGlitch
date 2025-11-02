const mockCharacters = [
  { id: 'a1', name: 'Alice', isPremade: true },
  { id: 'u1', name: 'Bob', isPremade: false }
];
const mockWorlds = [{ id: 'w1', name: 'Mars', isPremade: true }];

jest.mock('../apps/rpglitch/js/entities.js', () => ({
  getPremadeItems: jest.fn().mockImplementation(key => {
    if (key === 'characters') return mockCharacters.filter(c => c.isPremade);
    if (key === 'worlds') return mockWorlds;
    return [];
  }),
  entities: {
    list: jest.fn((type) => {
      if (type === 'character') return mockCharacters;
      if (type === 'world') return mockWorlds;
      return [];
    }),
  },
  _allItemsCache: {},
}));

async function loadApp() {
  // Clear the document body before each test
  document.body.innerHTML = `<!doctype html><html><body></body></html>`;

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

test('default storyboard title adapts to selections', async () => {
  const { App } = await loadApp();
  // Use global.document directly
  document.body.innerHTML = `
    <select id="storyboard-card-ai-select"><option value=""></option><option value="a1">Alice</option></select>
    <select id="storyboard-card-user-select"><option value=""></option><option value="u1">Bob</option></select>
    <select id="storyboard-card-world-select"><option value=""></option><option value="w1">Mars</option></select>
  `;

  await App.initializeWhenReady();
  const originalRandom = window.Math.random; // Use global window
  window.Math.random = () => 0; // Use global window
  expect(await App._defaultStoryboardTitle()).toBe('Your story begins…');
  document.getElementById('storyboard-card-ai-select').value = 'a1';
  expect(await App._defaultStoryboardTitle()).toBe('Once upon a time Alice');
  document.getElementById('storyboard-card-user-select').value = 'u1';
  expect(await App._defaultStoryboardTitle()).toBe('Once upon a time Alice & Bob');
  document.getElementById('storyboard-card-world-select').value = 'w1';
  expect(await App._defaultStoryboardTitle()).toBe('Once upon a time Alice & Bob in Mars');
  window.Math.random = originalRandom; // Use global window
});