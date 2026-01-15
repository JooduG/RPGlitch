import { jest } from "@jest/globals";

// Mock Top-Level Imports
jest.mock("../../../src/js/gamemaster/utils.js", () => ({
  log: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../../src/js/mesmer/ui/components/drawer/desktop.js", () => ({
  initDrawer: jest.fn(),
  closeDrawer: jest.fn(),
}));

jest.mock("../../../src/js/mesmer/ui/components/visuals/generator.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
  updateDeveloperModeClass: jest.fn(),
}));
// storyboard.js mock removed
jest.mock("../../../src/js/mesmer/ui/components/settings.js", () => ({
  StoryOptionsController: {
    init: jest.fn(),
    open: jest.fn(),
    close: jest.fn(),
  },
}));
jest.mock("../../../src/js/mesmer/ui/core/utils.js", () => ({
  setAppBackground: jest.fn(),
}));
jest.mock("../../../src/js/mesmer/ui/components/drawer/mobile.js", () => ({
  updateLocalSelection: jest.fn(),
  bindDrawerTrigger: jest.fn(),
  renderEntityPreview: jest.fn(),
  openDrawerFor: jest.fn(),
  setMobileDrawerCallbacks: jest.fn(),
}));
jest.mock("../../../src/js/mesmer/ui/components/profile/controller.js", () => ({
  renderProfilePage: jest.fn(),
  closeProfileModal: jest.fn(),
  setProfileCallbacks: jest.fn(),
}));
jest.mock("../../../src/js/gamemaster/store.js", () => ({
  events: {
    addEventListener: jest.fn(),
  },
  EVENTS: {
    STORY_LOADED: "story-loaded",
    CHAT_REFRESH: "chat-refresh",
    TYPING_STARTED: "typing-started",
    TYPING_STOPPED: "typing-stopped",
    GENERATION_STARTED: "gen-start",
    GENERATION_COMPLETED: "gen-complete",
  },
  state: {
    story: {
      activeId: "story-123",
      byId: {
        "story-123": {
          aiId: "ai-1",
          userId: "user-1",
          fractalId: "fractal-1",
        },
      },
    },
  },
  applyPatch: jest.fn(),
}));

jest.mock("../../../src/scholar/database/db.js", () => ({
  db: {
    stories: {
      get: jest.fn(),
    },
    entities: {
      get: jest.fn(),
    },
  },
}));

describe("Orchestrator UI", () => {
  let handlers = {};

  let eventsMock;

  beforeAll(async () => {
    // 1. Import Dependencies (Stubbing happened via jest.mock above)
    const eventsModule = await import("../../../src/js/gamemaster/store.js");
    eventsMock = eventsModule.events;
    const { EVENTS } = eventsModule;

    // 2. Import Orchestrator
    const { initViews } =
      await import("../../../src/js/mesmer/ui/core/orchestrator.js");
    await initViews(); // Triggers initEventBinds and registers handlers

    // 3. Capture Handlers from the mock calls *before* any test clears them
    const findHandler = (evt) => {
      const call = eventsMock.addEventListener.mock.calls.find(
        (c) => c[0] === evt,
      );
      return call ? call[1] : null;
    };

    handlers[EVENTS.STORY_LOADED] = findHandler(EVENTS.STORY_LOADED);
    handlers[EVENTS.GENERATION_COMPLETED] = findHandler(
      EVENTS.GENERATION_COMPLETED,
    );
  });

  beforeEach(() => {
    // Reset DOM state
    document.body.innerHTML = `
      <div id="ai-character-preview"></div>
      <div id="user-character-preview"></div>
      <div id="fractal-preview"></div>
      <button id="btn-select-ai"></button>
      <button id="btn-select-user"></button>
      <button id="btn-select-fractal"></button>
    `;
    document.body.className = "";
    document.body.id = "test-body";

    if (!global.requestAnimationFrame) {
      global.requestAnimationFrame = (cb) => cb();
    }

    // Clear usage data, but Mocks/Modules persist
    jest.clearAllMocks();
  });

  test("sanity check dom", () => {
    document.body.className = "";
    document.body.classList.add("theme-cyber");
    expect(document.body.className).toContain("theme-cyber");
  });

  test("applies theme when STORY_LOADED event fires", async () => {
    // Setup Mock Data
    const mockStory = {
      isConcluded: false,
      aiId: "ai-1",
      userId: "user-1",
      fractalId: "fractal-1",
      snapshots: {
        start: {
          ai: { id: "ai-1" },
          user: { id: "user-1" },
          fractal: {
            id: "fractal-1",
            type: "fractal",
            signatureColor: "blue",
            simulation: { cssTheme: "theme-cyber" },
          },
        },
      },
    };

    const dbModule = await import("../../../src/scholar/database/db.js");
    dbModule.db.stories.get.mockResolvedValue(mockStory);
    dbModule.db.entities.get.mockImplementation((id) => {
      if (id === "fractal-1")
        return Promise.resolve(mockStory.snapshots.start.fractal);
      return Promise.resolve({ id });
    });

    const handler = handlers["story-loaded"]; // EVENTS.STORY_LOADED
    expect(handler).toBeDefined();

    // Trigger
    await handler();

    expect(document.body.classList.contains("theme-cyber")).toBe(true);
    const uiUtils = await import("../../../src/js/mesmer/ui/core/utils.js");
    expect(uiUtils.setAppBackground).toHaveBeenCalledWith("blue");
  });
});
