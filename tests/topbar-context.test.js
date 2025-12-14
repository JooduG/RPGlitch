jest.mock("../apps/rpglitch/js/entity-crud.js", () => ({
  entities: {
    list: jest.fn().mockReturnValue([]),
  },
  seedPremades: jest.fn().mockResolvedValue(),
  _allItemsCache: {},
}));

jest.mock("../apps/rpglitch/js/ui-chat-feed.js", () => ({
  renderChat: jest.fn(),
  setGameplayEntities: jest.fn(),
  showTypingIndicator: jest.fn(),
  removeTypingIndicator: jest.fn(),
  setSendLock: jest.fn(),
  setChatGeneratingState: jest.fn(),
}));

jest.mock("../apps/rpglitch/js/ui-chat-visuals.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
  updateDirectorModeClass: jest.fn(),
}));

async function loadApp(html) {
  // Clear the document body before each test
  document.body.innerHTML = html;

  // Re-import modules to get a fresh state
  jest.resetModules();
  const utils = await import("../apps/rpglitch/js/core-utils.js");
  const index = await import("../apps/rpglitch/js/index.js");

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

test("top bar click triggers chin toggle without duplicate handlers", async () => {
  const html = `<!doctype html><html><body>
    <header id="top-bar">
      <div id="top-bar-left">
        <button data-chin="stories"></button>
      </div>
    </header>
    <div id="chin-container">
      <div class="chin" data-chin="stories" hidden></div>
    </div>
  </body></html>`;
  const { App } = await loadApp(html);

  App.chin.init();
  App.chin.init(); // Call twice to ensure no duplicate handlers

  const btn = document.querySelector(
    '#top-bar-left button[data-chin="stories"]',
  );
  let panel = document.querySelector('.chin[data-chin="stories"]');

  expect(btn).not.toBeNull();
  expect(panel).not.toBeNull();

  btn.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  panel = document.querySelector('.chin[data-chin="stories"]');
  expect(panel.hasAttribute("hidden")).toBe(false);

  btn.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  panel = document.querySelector('.chin[data-chin="stories"]');
  expect(panel.hasAttribute("hidden")).toBe(true);
});
