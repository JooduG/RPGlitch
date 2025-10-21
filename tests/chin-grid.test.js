const mockCharacters = [{ id: 'c1', title: 'Hero', isPremade: true, description: 'A hero', type: 'character' }];
const mockWorlds = [{ id: 'w1', title: 'Earth', isPremade: true, description: 'Our world', type: 'world' }];


async function loadScripts(html) {
  // Clear the document body before each test
  document.body.innerHTML = html;

  // Re-import modules to get a fresh state
  jest.resetModules();

  const { db } = await import('../apps/rpglitch/js/db.js');
  const utils = await import('../apps/rpglitch/js/utils.js');
  const index = await import('../apps/rpglitch/js/index.js');

  // App object is now constructed from re-imported modules
  const App = {
    ...index,
    ...utils,
  };

  await App.initializeWhenReady();

  return { App, db }; // No need to return dom anymore
}

afterEach(() => {
  // delete global.window;
  // delete global.document;
  delete global.App;
  jest.resetModules();
  jest.clearAllMocks();
});

test('renderStoryList loads items from storage', async () => {
  const html = `<body><div id="chin-container" hidden><div id="chin-story-grid" class="chin" data-chin="stories" hidden></div></div><template id="chin-card-template"><div class="chin-card"><div class="media"></div><h4 class="title"></h4><p class="description"></p></div></template></body>`;
  const { App, db } = await loadScripts(html);

  await db.entities.put({ title: 'My Custom Story', type: 'story' });
  App.chin.open('stories');
  await new Promise(resolve => setTimeout(resolve, 0));
  await App.renderStoryList();
  const text = document.getElementById('chin-story-grid').textContent;
  expect(text).toContain('My Custom Story');
});

test('renderCharacterList loads premade and stored items', async () => {
  const html = `<body><div id="chin-character-grid"></div><template id="chin-card-template"><div class="chin-card"><div class="media"></div><h4 class="title"></h4><p class="description"></p></div></template></body>`;
  const { App, db } = await loadScripts(html);
  await db.entities.bulkPut(mockCharacters);
  await db.entities.put({ title: 'My Hero', type: 'character' });
  await App.renderCharacterList();
  const text = document.getElementById('chin-character-grid').textContent;
  expect(text).toContain('Hero');
  expect(text).toContain('My Hero');
});

test('renderWorldList loads premade and stored items', async () => {
  const html = `<body><div id="chin-world-grid"></div><template id="chin-card-template"><div class="chin-card"><div class="media"></div><h4 class="title"></h4><p class="description"></p></div></template></body>`;
  const { App, db } = await loadScripts(html);
  await db.entities.bulkPut(mockWorlds);
  await db.entities.put({ title: 'My World', type: 'world' });
  await App.renderWorldList();
  const text = document.getElementById('chin-world-grid').textContent;
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
  const { App } = await loadScripts(html);

  App._attachChinSearchHandlers();
  const input = document.querySelector('.chin-search');
  input.value = 'foo';
  input.dispatchEvent(new window.Event('input'));
  const foo = document.querySelector('[data-title="Foo"]');
  const bar = document.querySelector('[data-title="Bar"]');
  expect(foo.hasAttribute('hidden')).toBe(false);
  expect(bar.hasAttribute('hidden')).toBe(true);
});

test('renderDropdown groups premade and custom items', async () => {
  const html = `<select id="sel"><option value="">Choose...</option></select>`;
  const { App, db } = await loadScripts(html);

  await db.entities.bulkPut(mockCharacters);
  await db.entities.put({ title: 'Custom Character', type: 'character' });
  await App.renderDropdown(document, 'sel', 'characters');
  const groupLabels = Array.from(document.querySelectorAll('#sel optgroup')).map((g) => g.label);
  expect(groupLabels).toEqual(expect.arrayContaining(['Premade', 'Custom']));
});
