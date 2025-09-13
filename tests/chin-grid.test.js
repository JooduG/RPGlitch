import { JSDOM } from 'jsdom';

const mockCharacters = [{ id: 'c1', title: 'Hero', isPremade: true, description: 'A hero' }];
const mockWorlds = [{ id: 'w1', title: 'Earth', isPremade: true, description: 'Our world' }];
const mockStories = [{ id: 's1', title: 'My Story', isPremade: false, description: 'A story' }];

jest.mock('../apps/rpglitch/js/entities.js', () => ({
  getPictureHTML: jest.fn().mockReturnValue('<div></div>'),
  getPremadeItems: jest.fn().mockImplementation(key => {
      if (key === 'characters') return mockCharacters;
      if (key === 'worlds') return mockWorlds;
      return [];
  }),
  entities: {
    get: jest.fn(),
    list: jest.fn((type) => {
      const key = type + 's';
      if (global.window && global.window.localStorage) {
        const fromStorage = JSON.parse(global.window.localStorage.getItem(key) || '[]');
        if (key === 'characters') return [...mockCharacters, ...fromStorage];
        if (key === 'worlds') return [...mockWorlds, ...fromStorage];
        if (key === 'stories') return [...fromStorage];
      }
      return [];
    }),
  },
  _allItemsCache: {},
}));

async function loadScripts(dom) {
  global.window = dom.window;
  global.document = dom.window.document;

  // Mock localStorage
  Object.defineProperty(dom.window, 'localStorage', {
    value: {
      _data: {},
      getItem: jest.fn(function(key) { return this._data[key] || null; }),
      setItem: jest.fn(function(key, value) { this._data[key] = value; }),
      removeItem: jest.fn(function(key) { delete this._data[key]; }),
    },
    writable: true,
  });

  dom.window.alert = () => {};
  dom.window.Dexie = function () {};
  dom.window.DOMPurify = { sanitize: (str) => str };
  global.DOMPurify = { sanitize: (str) => str };
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  const utils = await import('../apps/rpglitch/js/utils.js');
  const index = await import('../apps/rpglitch/js/index.js');

  dom.window.App = {
    ...index,
    ...utils,
  };
}

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
  const entities = require('../apps/rpglitch/js/entities.js');
  for (const key in entities._allItemsCache) {
    delete entities._allItemsCache[key];
  }
  jest.clearAllMocks();
});

test('renderStoryList loads items from storage', async () => {
  const dom = new JSDOM('<body><div id="chin-container" hidden><div id="chin-story-grid" class="chin" data-chin="stories" hidden></div></div><template id="chin-card-template"><div class="chin-card"><div class="media"></div><h4 class="title"></h4><p class="description"></p></div></template></body>', { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.localStorage.setItem('stories', JSON.stringify([{ title: 'My Custom Story' }]));
  dom.window.App.chin.open('stories');
  await new Promise(resolve => setTimeout(resolve, 0));
  dom.window.App.renderStoryList();
  const text = dom.window.document.getElementById('chin-story-grid').textContent;
  expect(text).toContain('My Custom Story');
});

test('renderCharacterList loads premade and stored items', async () => {
  const dom = new JSDOM('<body><div id="chin-character-grid"></div><template id="chin-card-template"><div class="chin-card"><div class="media"></div><h4 class="title"></h4><p class="description"></p></div></template></body>', { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.localStorage.setItem('characters', JSON.stringify([{ title: 'My Hero' }]));
  dom.window.App.renderCharacterList();
  const text = dom.window.document.getElementById('chin-character-grid').textContent;
  expect(text).toContain('Hero');
  expect(text).toContain('My Hero');
});

test('renderWorldList loads premade and stored items', async () => {
  const dom = new JSDOM('<body><div id="chin-world-grid"></div><template id="chin-card-template"><div class="chin-card"><div class="media"></div><h4 class="title"></h4><p class="description"></p></div></template></body>', { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.localStorage.setItem('worlds', JSON.stringify([{ title: 'My World' }]));
  dom.window.App.renderWorldList();
  const text = dom.window.document.getElementById('chin-world-grid').textContent;
  expect(text).toContain('Earth');
  expect(text).toContain('My World');
});

test('chin search hides non-matching cards via hidden attribute', async () => {
  const html = `
    <div class="chin-widget">
      <input class="chin-search" />
      <div class="chin-grid">
        <div data-title="Foo"></div>
        <div data-title="Bar"></div>
      </div>
    </div>`;
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.App._attachChinSearchHandlers();
  const input = dom.window.document.querySelector('.chin-search');
  input.value = 'foo';
  input.dispatchEvent(new dom.window.Event('input'));
  const foo = dom.window.document.querySelector('[data-title="Foo"]');
  const bar = dom.window.document.querySelector('[data-title="Bar"]');
  expect(foo.hasAttribute('hidden')).toBe(false);
  expect(bar.hasAttribute('hidden')).toBe(true);
});

test('renderDropdown groups premade and custom items', async () => {
  const dom = new JSDOM('<select id="sel"><option value="">Choose...</option></select>', { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.localStorage.setItem('characters', JSON.stringify([{ title: 'Custom Character' }]));
  dom.window.App.renderDropdown('sel', 'characters');
  const groupLabels = Array.from(dom.window.document.querySelectorAll('#sel optgroup')).map((g) => g.label);
  expect(groupLabels).toEqual(expect.arrayContaining(['Premade', 'Custom']));
});
