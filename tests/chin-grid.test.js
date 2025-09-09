import { JSDOM } from 'jsdom';

jest.mock('../apps/rpglitch/js/entities.js', () => ({
  getPictureHTML: jest.fn(),
  getPremadeItems: jest.fn().mockReturnValue([]),
  entities: {
    get: jest.fn(),
    getAll: jest.fn().mockReturnValue([]),
  },
  _allItemsCache: {},
}));

async function loadScripts(dom) {
  global.window = dom.window;
  global.document = dom.window.document;

  // Mock localStorage
  Object.defineProperty(dom.window, 'localStorage', {
    value: {
      getItem: jest.fn((key) => {
        if (key === 'stories') {
          return JSON.stringify([{ title: 'My Story' }]);
        }
        if (key === 'characters') {
          return JSON.stringify([{ title: 'Hero' }]);
        }
        if (key === 'worlds') {
          return JSON.stringify([{ title: 'Earth' }]);
        }
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

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

test('renderStoryList loads items from storage', async () => {
  const dom = new JSDOM('<div id="chin-story-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.localStorage.setItem('stories', JSON.stringify([{ title: 'My Story' }]));
  dom.window.App.renderStoryList();
  expect(dom.window.document.getElementById('chin-story-grid').textContent).toContain('My Story');
});

test('renderCharacterList loads items from storage', async () => {
  const dom = new JSDOM('<div id="chin-character-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.localStorage.setItem('characters', JSON.stringify([{ title: 'Hero' }]));
  dom.window.App.renderCharacterList();
  expect(dom.window.document.getElementById('chin-character-grid').textContent).toContain('Hero');
});

test('renderWorldList loads items from storage', async () => {
  const dom = new JSDOM('<div id="chin-world-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.localStorage.setItem('worlds', JSON.stringify([{ title: 'Earth' }]));
  dom.window.App.renderWorldList();
  expect(dom.window.document.getElementById('chin-world-grid').textContent).toContain('Earth');
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
  dom.window.localStorage.setItem('stories', JSON.stringify([{ title: 'My Story' }]));
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
  dom.window.localStorage.setItem('characters', JSON.stringify([{ title: 'Custom' }]));
  dom.window.App.renderDropdown('sel', 'characters');
  const groupLabels = Array.from(dom.window.document.querySelectorAll('#sel optgroup')).map((g) => g.label);
  expect(groupLabels).toEqual(expect.arrayContaining(['Custom']));
});


test('renderCharacterList loads items from storage', async () => {
  const dom = new JSDOM('<div id="chin-character-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  dom.window.localStorage.setItem('characters', JSON.stringify([{ title: 'Hero' }]));
  await loadScripts(dom);
  dom.window.App.renderCharacterList();
  expect(dom.window.document.getElementById('chin-character-grid').textContent).toContain('Hero');
});

test('renderWorldList loads items from storage', async () => {
  const dom = new JSDOM('<div id="chin-world-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  dom.window.localStorage.setItem('worlds', JSON.stringify([{ title: 'Earth' }]));
  await loadScripts(dom);
  dom.window.App.renderWorldList();
  expect(dom.window.document.getElementById('chin-world-grid').textContent).toContain('Earth');
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

test('renderStoryList loads items from storage', async () => {
  const dom = new JSDOM('<div id="chin-story-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.localStorage.setItem('stories', JSON.stringify([{ title: 'My Story' }]));
  dom.window.App.renderStoryList();
  expect(dom.window.document.getElementById('chin-story-grid').textContent).toContain('My Story');
});

test('renderCharacterList loads items from storage', async () => {
  const dom = new JSDOM('<div id="chin-character-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.localStorage.setItem('characters', JSON.stringify([{ title: 'Hero' }]));
  dom.window.App.renderCharacterList();
  expect(dom.window.document.getElementById('chin-character-grid').textContent).toContain('Hero');
});

test('renderWorldList loads items from storage', async () => {
  const dom = new JSDOM('<div id="chin-world-grid"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  await loadScripts(dom);
  dom.window.localStorage.setItem('worlds', JSON.stringify([{ title: 'Earth' }]));
  dom.window.App.renderWorldList();
  expect(dom.window.document.getElementById('chin-world-grid').textContent).toContain('Earth');
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
  dom.window.localStorage.setItem('stories', JSON.stringify([{ title: 'My Story' }]));
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
  dom.window.localStorage.setItem('characters', JSON.stringify([{ title: 'Custom' }]));
  dom.window.App.renderDropdown('sel', 'characters');
  const groupLabels = Array.from(dom.window.document.querySelectorAll('#sel optgroup')).map((g) => g.label);
  expect(groupLabels).toEqual(expect.arrayContaining(['Custom']));
});

