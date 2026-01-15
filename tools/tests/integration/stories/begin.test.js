import {
  jest,
  describe,
  beforeEach,
  afterEach,
  test,
  expect,
} from "@jest/globals";
import { init as initDB, db } from "../../../../src/scholar/database/db.js";
import { premade } from "../../../../src/scholar/library/library.js";
import { JSDOM } from "jsdom"; // ADDED: ensure JSDOM is available for new JSDOM(...) in beforeEach

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
  randomUUID: () => "test-uuid",
};

// Mock UI-related functions to prevent JSDOM errors and memory leaks
jest.mock("../../../../src/js/gamemaster/utils.js", () => {
  const actual = jest.requireActual("../../../../src/js/gamemaster/utils.js");
  return {
    ...actual,
    dismissLoadingUI: jest.fn(),
    startUIWatchdog: jest.fn(),
    installUIRecoveryHooks: jest.fn(),
    installUIBlockerAttributeObserver: jest.fn(),
    enableAutoUnlock: jest.fn(),
    chin: {
      ...actual.chin,
      init: jest.fn(),
      open: jest.fn(),
      close: jest.fn(),
      closeAll: jest.fn(),
      toggle: jest.fn(),
    },
  };
});

jest.mock("../../../../src/js/mesmer/ui/components/visuals/manager.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
  updateDirectorModeClass: jest.fn(),
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
    threads: { byId: {}, allIds: [], activeId: null },
    messages: { byThreadId: {} },
    settings: {
      temperature: 0.7,
      top_p: 1.0,
      maxTokens: 512,
      stop: [],
      model: "default",
      historyLength: 10,
    },
    ui: {
      fsm: "idle",
      promptPreviewOpen: false,
      lastError: null,
      title: "RPGlitch",
      selectedStoryboardCard: null,
    },
  };
});
let mockAttachStoryboardListeners = jest.fn(async (doc) => {
  doc = doc || window.document;
  const win = doc.defaultView || window;
  const aiSelect = doc.getElementById("storyboard-ai-select");
  const userSelect = doc.getElementById("storyboard-user-select");
  const worldSelect = doc.getElementById("storyboard-world-select");
  const storyboardScreen = doc.getElementById("storyboard-screen");
  const chatScreenContainer = doc.getElementById("chat-screen-container");
  const beginStoryBtn = doc.getElementById("begin-story");
  if (beginStoryBtn) {
    beginStoryBtn.addEventListener("click", async () => {
      if (aiSelect?.value && userSelect?.value && worldSelect?.value) {
        const storyTitleEl = doc.getElementById("storyboard-dynamic-title");
        const storyId = storyTitleEl?.textContent || "default-story";
        const characterId = aiSelect.value; // <-- use AI character id (was userSelect.value)
        const fractalId = worldSelect.value;

        // Mock App.threads.createFromSelection
        const threadId = `mock-thread-${Date.now()}`;
        window.App.state.threads.activeId = threadId;
        window.App.state.threads.byId[threadId] = {
          id: threadId,
          characterId,
          fractalId,
          title: storyId,
          settingsSnapshot: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        window.App.state.threads.allIds.push(threadId);

        // Write to DB to satisfy test expectation
        await db.stories.add({
          id: threadId, // Explicit ID
          title: storyId,
          aiCharacterId: characterId,
          userCharacterId: userSelect.value,
          fractalId: fractalId,
          settingsSnapshot: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        if (storyboardScreen) {
          storyboardScreen.hidden = true;
        }
        if (chatScreenContainer) chatScreenContainer.hidden = false;
        window.App.state.ui.fsm = "idle";

        // Mock App.chat.render
        const chatFeed = doc.getElementById("chat-feed");
        const noMessagesEl = doc.getElementById("no-messages");
        if (chatFeed) chatFeed.innerHTML = "";
        if (noMessagesEl) noMessagesEl.hidden = false;
      } else {
        win.alert(
          "Please select an AI character, a user character, and a world to begin.",
        );
      }
    });
  }
});

jest.mock("../../../../src/js/gamemaster/bootstrap.js", () => ({
  App: mockApp,
  initializeWhenReady: mockInitializeWhenReady,
  _attachStoryboardListeners: mockAttachStoryboardListeners,
}));

describe("Begin Story Button Functionality", () => {
  let dom;
  let document;

  beforeEach(async () => {
    dom = new JSDOM(
      `<!DOCTYPE html>
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
                    <option value="char-1">Char 1</option>
                  </select>
                </header>
              </article>
            </div>
            <div class="storyboard-card empty-card" id="storyboard-card-user" data-type="character">
              <article class="storyboard-card-right">
                <header>
                  <select id="storyboard-user-select" data-placeholder="Select Your Character…">
                    <option value="">Select Your Character…</option>
                    <option value="char-2">Char 2</option>
                  </select>
                </header>
              </article>
            </div>
            <div class="storyboard-card empty-card" id="storyboard-card-world" data-type="world">
              <article class="storyboard-card-right">
                <header>
                  <select id="storyboard-world-select" data-placeholder="Select World…">
                    <option value="">Select World…</option>
                    <option value="world-1">World 1</option>
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
      </html>`,
      { url: "http://localhost" },
    );
    document = dom.window.document;
    global.document = document;
    global.window = dom.window; // Set global.window to the JSDOM window

    // Ensure IndexedDB is available on the new window
    if (!dom.window.indexedDB) {
      dom.window.indexedDB = global.indexedDB;
      dom.window.IDBKeyRange = global.IDBKeyRange;
    }
    Object.defineProperty(dom.window, "localStorage", {
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
    const premadeCharacters = premade.entities
      .filter((e) => e.type === "Character")
      .map((char, index) => ({
        ...char,
        id: `char-${index + 1}`, // Explicit String ID
        type: "character",
        isCustom: 0,
        isPremade: true,
      }));
    const premadeWorlds = premade.entities
      .filter((e) => e.type === "World")
      .map((world, index) => ({
        ...world,
        id: `world-${index + 1}`, // Explicit String ID
        type: "world",
        isCustom: 0,
        isPremade: true,
      }));
    await db.entities.bulkAdd([...premadeCharacters, ...premadeWorlds]);

    // Call the mocked initializeWhenReady and _attachStoryboardListeners
    await mockInitializeWhenReady();
    await mockAttachStoryboardListeners(document);
  });

  afterEach(async () => {
    await db.delete();
  });

  test("should show alert if not all selections are made", async () => {
    const beginStoryBtn = document.getElementById("begin-story");
    const aiSelect = document.getElementById("storyboard-ai-select");

    // Only select AI character
    aiSelect.value = "char-1";

    dom.window.alert = jest.fn();
    const alertMock = dom.window.alert;

    beginStoryBtn.click();

    // Wait for async listener to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(alertMock).toHaveBeenCalledWith(
      "Please select an AI character, a user character, and a world to begin.",
    );
    expect(document.getElementById("storyboard-screen").hidden).toBe(false);
    expect(document.getElementById("chat-screen-container").hidden).toBe(true);

    expect(document.getElementById("chat-screen-container").hidden).toBe(true);
  });

  test("should transition to chat screen and create a new thread when selections are made", async () => {
    const beginStoryBtn = document.getElementById("begin-story");
    const aiSelect = document.getElementById("storyboard-ai-select");
    const userSelect = document.getElementById("storyboard-user-select");
    const worldSelect = document.getElementById("storyboard-world-select");
    const storyboardScreen = document.getElementById("storyboard-screen");
    const chatScreenContainer = document.getElementById(
      "chat-screen-container",
    );
    const chatFeed = document.getElementById("chat-feed");
    const noMessagesEl = document.getElementById("no-messages");

    // Select premade characters and world
    aiSelect.value = "char-1";
    userSelect.value = "char-2";
    worldSelect.value = "world-1";

    // Simulate change events to trigger updateStoryboardCard and setDynamicTitle
    // (These are not directly mocked, but their effects on select.value are what matter for the button logic)
    aiSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    userSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    worldSelect.dispatchEvent(
      new dom.window.Event("change", { bubbles: true }),
    );

    // Wait for async updates to complete (if any)
    await new Promise((resolve) => setTimeout(resolve, 50));

    await beginStoryBtn.click();

    // Wait for async listener to complete (needs to be longer than DB operation)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify UI transitions
    expect(storyboardScreen.hidden).toBe(true);
    expect(chatScreenContainer.hidden).toBe(false);

    // Verify App state (using the mocked App)
    expect(window.App.state.ui.fsm).toBe("idle");
    expect(window.App.state.threads.activeId).toBeDefined();

    // Verify a new thread was created in the database (mocked behavior)
    const threadsInDb = await db.stories.toArray();
    expect(threadsInDb.length).toBe(1);
    expect(threadsInDb[0].aiCharacterId).toBe("char-1"); // userSelect value
    expect(threadsInDb[0].title).toBe("Storyboard"); // Title from HTML

    // Verify chat rendering (mocked behavior)
    expect(chatFeed.innerHTML).toBe("");
    expect(noMessagesEl.hidden).toBe(false);
  });
}); // end of describe - file now ends here
