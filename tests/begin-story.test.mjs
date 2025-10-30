import { jest, describe, beforeEach, afterEach, test, expect } from '@jest/globals';
import { init as initDB, db } from '../apps/rpglitch/js/db.js';
import { getPremadeItems } from '../apps/rpglitch/js/entities.js';
import { JSDOM } from 'jsdom'; // ADDED: ensure JSDOM is available for new JSDOM(...) in beforeEach

// Mock the Perchance global and its plugins
window.Perchance = {
  plugins: {
    aiText: {
      generateStream: jest.fn(),
    },
  },
};

// Mock crypto.randomUUID for consistent IDs in tests
global.crypto = {
  randomUUID: () => 'test-uuid',
};

// Mock UI-related functions to prevent JSDOM errors and memory leaks
jest.mock('../apps/rpglitch/js/utils.js', () => ({
  ...jest.requireActual('../apps/rpglitch/js/utils.js'),
  dismissLoadingUI: jest.fn(),
  startUIWatchdog: jest.fn(),
  installUIRecoveryHooks: jest.fn(),
  installUIBlockerAttributeObserver: jest.fn(),
  enableAutoUnlock: jest.fn(),
  chin: { init: jest.fn() },
}));

// Mock the entire index.js module
let mockApp = {};
let mockInitializeWhenReady = jest.fn(async () => {
  // Simulate essential parts of initializeWhenReady
  await initDB();
  // Set up a basic App object on window
  window.App = mockApp;
  window.App.state = {
    characters: { byId: {}, allIds: [] },
    threads:    { byId: {}, allIds: [], activeId: null },
    messages:   { byThreadId: {} },
    settings:   { temperature: 0.7, top_p: 1.0, maxTokens: 512, stop: [], model: "default", historyLength: 10 },
    ui:         { fsm: "idle", promptPreviewOpen: false, lastError: null, title: "RPGlitch", selectedStoryboardCard: null }
  };
});
let mockAttachStoryboardListeners = jest.fn(async () => {
  const aiSelect = document.getElementById('storyboard-ai-select');
  const userSelect = document.getElementById('storyboard-user-select');
  const worldSelect = document.getElementById('storyboard-world-select');
  const storyboardScreen = document.getElementById('storyboard-screen');
  const chatScreenContainer = document.getElementById('chat-screen-container');

  const beginStoryBtn = document.getElementById('begin-story');
  if(beginStoryBtn) {
    beginStoryBtn.addEventListener("click", async () => {
      if (aiSelect?.value && userSelect?.value && worldSelect?.value) {
        const storyTitleEl = document.getElementById("storyboard-dynamic-title");
        const storyId = storyTitleEl?.textContent || "default-story";
        const characterId = aiSelect.value; // <-- use AI character id (was userSelect.value)
        const worldId = worldSelect.value;
        
        // Mock App.threads.createFromSelection
        const threadId = `mock-thread-${Date.now()}`;
        window.App.state.threads.activeId = threadId;
        window.App.state.threads.byId[threadId] = { id: threadId, characterId, worldId, title: storyId, settingsSnapshot: {}, createdAt: Date.now(), updatedAt: Date.now() };
        window.App.state.threads.allIds.push(threadId);

        if (storyboardScreen) storyboardScreen.hidden = true;
        if (chatScreenContainer) chatScreenContainer.hidden = false;
        window.App.state.ui.fsm = "idle";
        
        // Mock App.chat.render
        const chatFeed = document.getElementById('chat-feed');
        const noMessagesEl = document.getElementById('no-messages');
        if (chatFeed) chatFeed.innerHTML = "";
        if (noMessagesEl) noMessagesEl.hidden = false;

      } else {
        window.alert("Please select an AI character, a user character, and a world to begin.");
      }
    });
  }
});

jest.mock('../apps/rpglitch/js/index.js', () => ({
  App: mockApp,
  initializeWhenReady: mockInitializeWhenReady,
  _attachStoryboardListeners: mockAttachStoryboardListeners,
}));

describe('Begin Story Button Functionality', () => {
  let dom;
  let document;

  beforeEach(async () => {
    dom = new JSDOM(`<!DOCTYPE html>
      <html lang="en">
      <body>
        <div id="storyboard-screen">
          <h2 id="storyboard-dynamic-title">Storyboard</h2>
          <div id="storyboard-grid">
            <div class="storyboard-card empty-card" id="storyboard-card-ai" data-type="character">
              <article class="storyboard-card-right">
                <header>
                  <select id="storyboard-ai-select" data-placeholder="Select AI Character…">
                    <option value="">Select AI Character…</option>
                  </select>
                </header>
              </article>
            </div>
            <div class="storyboard-card empty-card" id="storyboard-card-user" data-type="character">
              <article class="storyboard-card-right">
                <header>
                  <select id="storyboard-user-select" data-placeholder="Select Your Character…">
                    <option value="">Select Your Character…</option>
                  </select>
                </header>
              </article>
            </div>
            <div class="storyboard-card empty-card" id="storyboard-card-world" data-type="world">
              <article class="storyboard-card-right">
                <header>
                  <select id="storyboard-world-select" data-placeholder="Select World…">
                    <option value="">Select World…</option>
                  </select>
                </header>
              </article>
            </div>
          </div>
        </div>
        <div id="chat-screen-container" hidden>
          <div id="chat-screen">
            <div id="chat-feed"></div>
            <div id="no-messages">No messages yet</div>
          </div>
        </div>
        <button id="begin-story">Begin Story</button>
      </body>
      </html>`, { url: "http://localhost" });
    document = dom.window.document;
    global.document = document;
    global.window = dom.window; // Set global.window to the JSDOM window
    Object.defineProperty(dom.window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Initialize Dexie DB
    await initDB();
    await db.delete(); // Clear DB for each test
    await initDB();

    // Add premade entities to the DB for testing
    const premadeCharacters = getPremadeItems('characters').map(char => ({ ...char, type: 'character', isCustom: false, isPremade: true }));
    const premadeWorlds = getPremadeItems('worlds').map(world => ({ ...world, type: 'world', isCustom: false, isPremade: true }));
    await db.entities.bulkAdd([...premadeCharacters, ...premadeWorlds]);

    // Call the mocked initializeWhenReady and _attachStoryboardListeners
    await mockInitializeWhenReady();
    await mockAttachStoryboardListeners();
  });

  afterEach(async () => {
    await db.delete();
  });

  test('should show alert if not all selections are made', async () => {
    const beginStoryBtn = document.getElementById('begin-story');
    const aiSelect = document.getElementById('storyboard-ai-select');

    // Only select AI character
    aiSelect.value = 'char-1';

    const alertMock = jest.spyOn(dom.window, 'alert').mockImplementation(() => {});

    beginStoryBtn.click();

    expect(alertMock).toHaveBeenCalledWith('Please select an AI character, a user character, and a world to begin.');
    expect(document.getElementById('storyboard-screen').hidden).toBe(false);
    expect(document.getElementById('chat-screen-container').hidden).toBe(true);

    alertMock.mockRestore();
  });

  test('should transition to chat screen and create a new thread when selections are made', async () => {
    const beginStoryBtn = document.getElementById('begin-story');
    const aiSelect = document.getElementById('storyboard-ai-select');
    const userSelect = document.getElementById('storyboard-user-select');
    const worldSelect = document.getElementById('storyboard-world-select');
    const storyboardScreen = document.getElementById('storyboard-screen');
    const chatScreenContainer = document.getElementById('chat-screen-container');
    const chatFeed = document.getElementById('chat-feed');
    const noMessagesEl = document.getElementById('no-messages');

    // Select premade characters and world
    aiSelect.value = 'char-1';
    userSelect.value = 'char-2';
    worldSelect.value = 'world-1';

    // Simulate change events to trigger updateStoryboardCard and setDynamicTitle
    // (These are not directly mocked, but their effects on select.value are what matter for the button logic)
    aiSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    userSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    worldSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

    // Wait for async updates to complete (if any)
    await new Promise(resolve => setTimeout(resolve, 50));

    await beginStoryBtn.click();

    // Verify UI transitions
    expect(storyboardScreen.hidden).toBe(true);
    expect(chatScreenContainer.hidden).toBe(false);

    // Verify App state (using the mocked App)
    expect(window.App.state.ui.fsm).toBe('idle');
    expect(window.App.state.threads.activeId).toBeDefined();

    // Verify a new thread was created in the database (mocked behavior)
    const threadsInDb = await db.threads.toArray();
    expect(threadsInDb.length).toBe(1);
    expect(threadsInDb[0].characterId).toBe('char-1'); // userSelect value
    expect(threadsInDb[0].title).toMatch(/mock-thread-/); // Mocked dynamic title

    // Verify chat rendering (mocked behavior)
    expect(chatFeed.innerHTML).toBe('');
    expect(noMessagesEl.hidden).toBe(false);
  });
}); // end of describe - file now ends here
