import { jest } from "@jest/globals";

// Mock Top-Level Imports
jest.mock("../../../src/js/core/utils.js", () => ({
  log: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../../src/js/ui/components/drawer/desktop.js", () => ({
  initDrawer: jest.fn(),
  closeDrawer: jest.fn(),
}));
jest.mock("../../../src/js/ui/components/chat/feed.js", () => ({
  setStorymodeEntities: jest.fn(),
  setSendLock: jest.fn(),
  setChatGeneratingState: jest.fn(),
  showTypingIndicator: jest.fn(),
  removeTypingIndicator: jest.fn(),
}));
jest.mock("../../../src/js/ui/image-gen-ui.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
}));
jest.mock("../../../src/js/ui/services/ui-utils.js", () => ({
  setAppBackground: jest.fn(),
}));
jest.mock("../../../src/js/ui/components/drawer/mobile.js", () => ({
  updateLocalSelection: jest.fn(),
  bindDrawerTrigger: jest.fn(),
  renderEntityPreview: jest.fn(),
  openDrawerFor: jest.fn(),
  setChinCallbacks: jest.fn(),
}));
jest.mock(
  "../../../src/js/ui/components/profile/controller.js",
  () => ({
    renderProfilePage: jest.fn(),
    closeProfileModal: jest.fn(),
    setProfileCallbacks: jest.fn(),
  }),
);
jest.mock("../../../src/js/core/events.js", () => ({
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
}));

// Mock Dynamic Imports
jest.mock("../../../src/js/core/state.js", () => ({
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
}));

jest.mock("../../../src/js/core/db.js", () => ({
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
    const eventsModule =
      await import("../../../src/js/core/events.js");
    eventsMock = eventsModule.events;
    const { EVENTS } = eventsModule;

    // 2. Import Orchestrator (Triggers initEventBinds ONCE)
    await import("../../../src/js/ui/orchestrator.js");

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

    const dbModule = await import("../../../src/js/core/db.js");
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
    const uiUtils =
      await import("../../../src/js/ui/services/ui-utils.js");
    expect(uiUtils.setAppBackground).toHaveBeenCalledWith("blue");
  });
});
