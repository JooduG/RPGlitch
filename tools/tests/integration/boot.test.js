import { describe, test, expect, afterEach, jest } from "@jest/globals";

// === EXTENSIVE MOCKING TO PREVENT CRASHES ===

// 1. Data Layer
jest.mock("../../../../apps/rpglitch/js/data/repo.js", () => ({
  entities: { list: jest.fn().mockReturnValue([]) },
  seedPremades: jest.fn().mockResolvedValue(),
  _allItemsCache: {},
}));

jest.mock("../../../../apps/rpglitch/js/core/db.js", () => ({
  db: {
    open: jest.fn().mockResolvedValue(),
    isOpen: jest.fn().mockReturnValue(false),
    settings: {
      get: jest.fn().mockResolvedValue(undefined),
      put: jest.fn().mockResolvedValue(),
      add: jest.fn().mockResolvedValue(),
    },
    entities: {
      where: jest.fn(() => ({
        equals: jest.fn(() => ({ first: jest.fn().mockResolvedValue(null) })),
      })),
    },
  },
  init: jest.fn().mockResolvedValue(),
}));

// 2. UI/Engine Layers (Critical to mock these to avoid DOM/Window access at top level)
jest.mock("../../../../apps/rpglitch/js/ui/orchestrator.js", () => ({
  initViews: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../../apps/rpglitch/js/engine/director.js", () => ({
  StoryController: {},
}));

jest.mock("../../../../apps/rpglitch/js/ui/components/settings.js", () => ({
  StoryOptionsController: { init: jest.fn() },
}));

jest.mock("../../../../apps/rpglitch/js/ui/setup.js", () => ({
  initStoryboardStage: jest.fn(),
  StoryboardController: {},
}));

jest.mock("../../../../apps/rpglitch/js/ui/components/chat/input.js", () => ({
  initChatInput: jest.fn(),
}));

jest.mock("../../../../apps/rpglitch/js/core/state.js", () => ({
  state: { settings: { directorMode: false } },
  applyPatch: jest.fn(),
}));

jest.mock("../../../../apps/rpglitch/js/ui/components/chat/feed.js", () => ({
  renderChat: jest.fn(),
  setGameplayEntities: jest.fn(),
  showTypingIndicator: jest.fn(),
  removeTypingIndicator: jest.fn(),
  setSendLock: jest.fn(),
  setChatGeneratingState: jest.fn(),
}));

jest.mock("../../../../apps/rpglitch/js/ui/services/visuals.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
  updateDirectorModeClass: jest.fn(),
}));

jest.mock("../../../../apps/rpglitch/js/core/utils.js", () => ({
  log: jest.fn(),
  error: jest.fn(),
  initDebugMode: jest.fn(),
  mockPlugins: jest.fn(),
}));

async function loadApp() {
  jest.resetModules();
  // Import Dynamic to ensure mocks are applied
  const bootstrap =
    await import("../../../../apps/rpglitch/js/core/bootstrap.js");
  return { App: bootstrap.App };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("Application Boot", () => {
  test("initializeWhenReady works correctly", async () => {
    const { App } = await loadApp();
    App.initialLoad = jest.fn().mockResolvedValue();
    App._attachStoryboardEventListeners = jest.fn();

    await expect(App.initializeWhenReady()).resolves.toBe(true);
  });

  test("retries are reset on success", async () => {
    const { App } = await loadApp();
    window.initializeWhenReadyRetryCount = 2;
    App.initialLoad = jest.fn().mockResolvedValue();
    App._attachStoryboardEventListeners = jest.fn();

    await App.initializeWhenReady();
    expect(window.initializeWhenReadyRetryCount).toBe(0);
  });
});

describe("Plugin Loading (waitForPlugins)", () => {
  test("detects nested plugins", async () => {
    const { App } = await loadApp();
    window.pluginAi = { generateStream: () => {} };
    await expect(
      App.waitForPlugins(["pluginAi.generateStream"], 10),
    ).resolves.toBe(true);
  });

  test("fails on missing plugins", async () => {
    const { App } = await loadApp();
    await expect(App.waitForPlugins(["missingPlugin"], 10, 0, 0)).resolves.toBe(
      false,
    );
  });
});
