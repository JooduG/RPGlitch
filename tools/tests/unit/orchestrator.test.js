import { jest } from "@jest/globals";

// Mock Top-Level Imports
jest.mock("../../../apps/rpglitch/js/core/utils.js", () => ({
  log: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../../apps/rpglitch/js/ui/components/drawer/desktop.js", () => ({
  initDrawer: jest.fn(),
  closeDrawer: jest.fn(),
}));
jest.mock("../../../apps/rpglitch/js/ui/components/chat/feed.js", () => ({
  setStorymodeEntities: jest.fn(),
  setSendLock: jest.fn(),
}));
jest.mock("../../../apps/rpglitch/js/ui/image-gen-ui.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
}));
jest.mock("../../../apps/rpglitch/js/ui/services/ui-utils.js", () => ({
  setAppBackground: jest.fn(),
}));
jest.mock("../../../apps/rpglitch/js/ui/components/drawer/mobile.js", () => ({
  updateLocalSelection: jest.fn(),
  bindDrawerTrigger: jest.fn(),
  renderEntityPreview: jest.fn(),
  openDrawerFor: jest.fn(),
  setChinCallbacks: jest.fn(),
}));
jest.mock(
  "../../../apps/rpglitch/js/ui/components/profile/controller.js",
  () => ({
    renderProfilePage: jest.fn(),
    closeProfileModal: jest.fn(),
    setProfileCallbacks: jest.fn(),
  }),
);
jest.mock("../../../apps/rpglitch/js/core/events.js", () => ({
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
jest.mock("../../../apps/rpglitch/js/core/state.js", () => ({
  state: {
    story: { activeId: "story-123" },
  },
}));

jest.mock("../../../apps/rpglitch/js/core/db.js", () => ({
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

    // Ensure requestAnimationFrame is mocked
    if (!global.requestAnimationFrame) {
      global.requestAnimationFrame = (cb) => cb();
    }

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
    document.body.className = "";
    document.body.id = "";
  });

  test("sanity check dom", () => {
    document.body.className = "";
    const currentClasses = document.body.className.split(" ");
    const cleanClasses = currentClasses.filter((c) => !c.startsWith("theme-"));
    document.body.className = cleanClasses.join(" ");
    document.body.classList.add("theme-cyber");
    expect(document.body.classList.contains("theme-cyber")).toBe(true);
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

    const dbModule = await import("../../../apps/rpglitch/js/core/db.js");
    dbModule.db.stories.get.mockResolvedValue(mockStory);
    dbModule.db.entities.get.mockImplementation((id) => {
      if (id === "fractal-1")
        return Promise.resolve(mockStory.snapshots.start.fractal);
      return Promise.resolve({ id });
    });

    // Import Orchestrator (triggers initEventBinds)
    await import("../../../apps/rpglitch/js/ui/orchestrator.js");

    const eventsModule =
      await import("../../../apps/rpglitch/js/core/events.js");
    const { events, EVENTS } = eventsModule;

    // Find the STORY_LOADED handler
    const handler = events.addEventListener.mock.calls.find(
      (call) => call[0] === EVENTS.STORY_LOADED,
    )[1];
    expect(handler).toBeDefined();

    // Trigger the handler
    await handler();

    // Verification
    expect(document.body.classList.contains("theme-cyber")).toBe(true);

    const uiUtils =
      await import("../../../apps/rpglitch/js/ui/services/ui-utils.js");
    expect(uiUtils.setAppBackground).toHaveBeenCalledWith("blue");
  });
});
