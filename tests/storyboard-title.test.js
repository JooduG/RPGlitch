import { JSDOM } from 'jsdom';

jest.mock('../apps/rpglitch/js/entities.js', () => ({
  entities: {
    list: jest.fn(),
  },
  getPremadeItems: jest.fn().mockReturnValue([]),
  _allItemsCache: {},
}));

async function loadApp() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

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

test('default storyboard title adapts to selections', async () => {
  const { dom, App } = await loadApp();
  const document = dom.window.document;
  document.body.innerHTML = `
    <select id="storyboard-ai-select"><option value=""></option><option value="a1">Alice</option></select>
    <select id="storyboard-user-select"><option value=""></option><option value="u1">Bob</option></select>
    <select id="storyboard-world-select"><option value=""></option><option value="w1">Mars</option></select>
  `;

  App.getAllItems = (key) => {
    const map = {
      characters: [
        { id: 'a1', title: 'Alice' },
        { id: 'u1', title: 'Bob' }
      ],
      worlds: [{ id: 'w1', title: 'Mars' }]
    };
    const items = map[key] || [];
    return items.map(item => ({
      ...item,
      title: item.title ? String(item.title).replace(/[<>&"']/g, '') : ''
    }));
  };
  const originalRandom = dom.window.Math.random;
  dom.window.Math.random = () => 0;
  expect(App._defaultStoryboardTitle()).toBe('Your story begins…');
  document.getElementById('storyboard-ai-select').value = 'a1';
  expect(App._defaultStoryboardTitle()).toBe('Once upon a time Alice');
  document.getElementById('storyboard-user-select').value = 'u1';
  expect(App._defaultStoryboardTitle()).toBe('Once upon a time Alice & Bob');
  document.getElementById('storyboard-world-select').value = 'w1';
  expect(App._defaultStoryboardTitle()).toBe('Once upon a time Alice & Bob in Mars');
  dom.window.Math.random = originalRandom;
});
