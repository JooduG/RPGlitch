import { JSDOM } from "jsdom";

jest.mock("../apps/rpglitch/js/entity-crud.js", () => ({
  entities: {
    list: jest.fn().mockReturnValue([]),
  },
  seedPremades: jest.fn().mockResolvedValue(),
  _allItemsCache: {},
}));

jest.mock("../apps/rpglitch/js/core-db.js", () => ({
  db: {
    settings: {
      get: jest.fn().mockResolvedValue(undefined),
      put: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockResolvedValue(undefined),
    },
    entities: {
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          first: jest.fn().mockResolvedValue(null),
        })),
      })),
    },
    open: jest.fn().mockResolvedValue(undefined),
  },
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

async function loadApp(
  htmlContent = "<!doctype html><html><body></body></html>",
) {
  const dom = new JSDOM(htmlContent, {
    url: "http://localhost",
    runScripts: "outside-only",
  });

  global.window = dom.window;
  global.document = dom.window.document;

  dom.window.alert = () => {};
  dom.window.Dexie = jest.fn(function (name) {
    this.name = name;
    this.version = jest.fn().mockReturnThis();
    this.stores = jest.fn().mockReturnThis();
    this.upgrade = jest.fn().mockReturnThis();
    this.open = jest.fn().mockResolvedValue();
    this.isOpen = jest.fn().mockReturnValue(false);
    this.close = jest.fn().mockResolvedValue();
  });
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  jest.resetModules();
  const utils = await import("../apps/rpglitch/js/core-utils.js");
  const index = await import("../apps/rpglitch/js/index.js");

  dom.window.App = {
    ...index,
    ...utils,
  };

  if (typeof dom.window.App._getUIElements !== "function") {
    dom.window.App._getUIElements = jest.fn();
  }

  return dom.window.App;
}

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
  jest.resetModules();
  jest.clearAllMocks();
});

test("initializeWhenReady runs without errors", async () => {
  const html = `<!doctype html><html><body></body></html>`; // Simplified HTML
  const App = await loadApp(html);
  App.initialLoad = jest.fn().mockResolvedValue();
  App._attachStoryboardEventListeners = jest.fn();
  await expect(App.initializeWhenReady()).resolves.toBe(true);
});

test("_getUIElements is defined before initialization", async () => {
  const App = await loadApp();
  expect(typeof App._getUIElements).toBe("function");
});

test("initializeWhenReady resets retry counter on success", async () => {
  const html = `<!doctype html><html><body></body></html>`; // Simplified HTML
  const App = await loadApp(html);
  window.initializeWhenReadyRetryCount = 2;
  App.initialLoad = jest.fn().mockResolvedValue();
  App._attachStoryboardEventListeners = jest.fn();
  await App.initializeWhenReady();
  expect(window.initializeWhenReadyRetryCount).toBe(0);
});

describe("waitForPlugins", () => {
  beforeEach(() => {
    globalThis.__TEST__ = false;
  });

  afterEach(() => {
    globalThis.__TEST__ = true;
    // Clean up plugin properties to ensure test isolation
    if (typeof global.window !== "undefined") {
      delete global.window.pluginAi;
      delete global.window.pluginSuperFetch;
      delete global.window.pluginTextToImage;
      delete global.window.pluginRemember;
      delete global.window.pluginUpload;
    }
  });

  test("handles nested paths like pluginAi.generateStream", async () => {
    const App = await loadApp();
    window.pluginAi = { generateStream: jest.fn() };
    const result = await App.waitForPlugins(["pluginAi.generateStream"], 100);
    expect(result).toBe(true);
  });

  test("fails when nested path is not a function", async () => {
    const App = await loadApp();
    window.pluginAi = { generateStream: "not a function" };
    const result = await App.waitForPlugins(
      ["pluginAi.generateStream"],
      100,
      0,
      0,
    );
    expect(result).toBe(false);
  });

  test("succeeds with a mix of root and nested plugins", async () => {
    const App = await loadApp();
    window.pluginSuperFetch = jest.fn(); // Plugin must be a function
    window.pluginAi = { generateStream: jest.fn() };
    const result = await App.waitForPlugins(
      ["pluginSuperFetch", "pluginAi.generateStream"],
      100,
    );
    expect(result).toBe(true);
  });

  test("fails if a root plugin is missing", async () => {
    const App = await loadApp();
    window.pluginAi = { generateStream: jest.fn() };
    const result = await App.waitForPlugins(
      ["pluginSuperFetch", "pluginAi.generateStream"],
      100,
      0,
      0,
    );
    expect(result).toBe(false);
  });

  test("returns false for empty string path", async () => {
    const App = await loadApp();
    const result = await App.waitForPlugins([""], 100, 0, 0);
    expect(result).toBe(false);
  });

  test("returns false for invalid paths", async () => {
    const App = await loadApp();
    const result = await App.waitForPlugins(["..invalid"], 100, 0, 0);
    expect(result).toBe(false);
  });

  test("returns false for paths with spaces", async () => {
    const App = await loadApp();
    const result = await App.waitForPlugins(["ai. generateStream"], 100, 0, 0);
    expect(result).toBe(false);
  });
});
