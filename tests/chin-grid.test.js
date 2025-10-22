const mockCharacters = [{ id: 'c1', title: 'Hero', isPremade: true, description: 'A hero', type: 'character' }];
const mockWorlds = [{ id: 'w1', title: 'Earth', isPremade: true, description: 'Our world', type: 'world' }];


const TEST_TIMEOUT = 5000; // 5 second timeout for async operations

beforeEach(async () => {
  // Delete any existing IndexedDB databases
  const databases = await window.indexedDB.databases();
  await Promise.all(
    databases.map(({ name }) => 
      new Promise((resolve, reject) => {
        const request = window.indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    )
  );
});

async function loadScripts(html) {
  let dbInstance = null;
  try {
    // Clear the document body before each test
    document.body.innerHTML = html;

    // Close any existing DB connections
    if (global.App && global.App.db && global.App.db.isOpen()) {
      await global.App.db.close();
    }

    // Re-import modules to get a fresh state
    jest.resetModules();

    const { db } = await import('../apps/rpglitch/js/db.js');
    dbInstance = db; // Store reference for cleanup
    const utils = await import('../apps/rpglitch/js/utils.js');
    const index = await import('../apps/rpglitch/js/index.js');

    // App object is now constructed from re-imported modules
    const App = {
      ...index,
      ...utils,
      db: dbInstance // Add db to App for cleanup
    };

    // Initialize with timeout
    await Promise.race([
      App.initializeWhenReady(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialize timeout')), TEST_TIMEOUT)
      )
    ]);

    return { App, db: dbInstance };
  } catch (error) {
    // Ensure DB is closed on error
    if (dbInstance && dbInstance.isOpen && dbInstance.isOpen()) {
      await dbInstance.close();
    }
    throw error;
  }
}

afterEach(async () => {
  if (global.App && global.App.db && global.App.db.isOpen()) {
    await global.App.db.close();
  }
  delete global.App;
  jest.resetModules();
  jest.clearAllMocks();
});

test('renderStoryList loads items from storage', async () => {
  const html = `<body><div id="chin-container" hidden><div id="chin-story-grid" class="chin" data-chin="stories" hidden></div></div><template id="chin-card-template"><div class="chin-card"><div class="media"></div><h4 class="title"></h4><p class="description"></p></div></template></body>`;
  const { App, db } = await loadScripts(html);

  try {
    await Promise.race([
      (async () => {
        await db.entities.put({ title: 'My Custom Story', type: 'story' });
        App.chin.open('stories');
        await new Promise(resolve => setTimeout(resolve, 100)); // Give more time for async operations
        await App.renderStoryList();
        const text = document.getElementById('chin-story-grid').textContent;
        expect(text).toContain('My Custom Story');
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Test operation timeout')), TEST_TIMEOUT))
    ]);
  } finally {
    // Cleanup in case afterEach doesn't run
    if (db.isOpen()) {
      await db.close();
    }
  }
}, TEST_TIMEOUT + 1000); // Jest timeout slightly longer than our operation timeout

test('renderCharacterList loads premade and stored items', async () => {
  const html = `<body><div id="chin-character-grid"></div><template id="chin-card-template"><div class="chin-card"><div class="media"></div><h4 class="title"></h4><p class="description"></p></div></template></body>`;
  const { App, db } = await loadScripts(html);

  try {
    await Promise.race([
      (async () => {
        await db.entities.bulkPut(mockCharacters);
        await db.entities.put({ title: 'My Hero', type: 'character' });
        await App.renderCharacterList();
        const text = document.getElementById('chin-character-grid').textContent;
        expect(text).toContain('Hero');
        expect(text).toContain('My Hero');
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Test operation timeout')), TEST_TIMEOUT))
    ]);
  } finally {
    if (db.isOpen()) {
      await db.close();
    }
  }
}, TEST_TIMEOUT + 1000);

test('renderWorldList loads premade and stored items', async () => {
  const html = `<body><div id="chin-world-grid"></div><template id="chin-card-template"><div class="chin-card"><div class="media"></div><h4 class="title"></h4><p class="description"></p></div></template></body>`;
  const { App, db } = await loadScripts(html);

  try {
    await Promise.race([
      (async () => {
        await db.entities.bulkPut(mockWorlds);
        await db.entities.put({ title: 'My World', type: 'world' });
        await App.renderWorldList();
        const text = document.getElementById('chin-world-grid').textContent;
        expect(text).toContain('Earth');
        expect(text).toContain('My World');
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Test operation timeout')), TEST_TIMEOUT))
    ]);
  } finally {
    if (db.isOpen()) {
      await db.close();
    }
  }
}, TEST_TIMEOUT + 1000);

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
