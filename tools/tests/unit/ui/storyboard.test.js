import { jest } from "@jest/globals";

// Mock dependencies (Must be above imports in some ESM setups)
jest.mock(
  "../../../../src/js/mesmer/ui/components/profile/controller.js",
  () => ({
    getOnUpdateSelection: jest.fn(() => jest.fn()),
    setProfileCallbacks: jest.fn(),
    getActiveSlotKey: jest.fn(),
    closeProfileModal: jest.fn(),
    openProfileModal: jest.fn(),
    refreshProfileIfOpen: jest.fn(),
    renderProfilePage: jest.fn(),
  }),
);

jest.mock(
  "../../../../src/js/mesmer/ui/components/visuals/generator.js",
  () => ({
    updatePortraits: jest.fn(),
    applyFractalAmbience: jest.fn(),
    updateDeveloperModeClass: jest.fn(),
  }),
);

jest.mock("../../../../src/js/mesmer/ui/core/orchestrator.js", () => ({
  showAlert: jest.fn(),
}));

jest.mock("../../../../src/js/scholar/repository.js", () => ({
  entities: {
    get: jest.fn(),
    list: jest.fn(),
  },
}));

jest.mock("../../../../src/js/gamemaster/index.js", () => {
  const mockState = {
    settings: {
      developerMode: false,
    },
    story: {
      activeId: null,
    },
  };
  return {
    GameMaster: {
      createFromSelection: jest.fn(),
      generatePrologue: jest.fn(),
      load: jest.fn(),
    },
    events: new EventTarget(),
    EVENTS: {
      DB_UPDATED: "db-updated",
      STORY_LOADED: "story-loaded",
    },
    store: mockState,
    state: mockState,
  };
});

jest.mock("../../../../src/js/gamemaster/utils.js", () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

import { initStoryboardStage } from "../../../../src/js/mesmer/ui/storyboard.js";
import {
  events,
  EVENTS,
  store as state,
} from "../../../../src/js/gamemaster/index.js";

describe("setup.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="title-storyboard"></div>
      <div id="title-storymode"></div>
      <button id="begin-story"></button>
      <button id="btn-shuffle"></button>
    `;
    jest.clearAllMocks();
  });

  it("should be able to import initStoryboardStage", () => {
    expect(typeof initStoryboardStage).toBe("function");
  });

  it("should handle DB_UPDATED event and call entities.get", async () => {
    const { entities } =
      await import("../../../../src/js/scholar/repository.js");
    const views = {
      setOnSelectionChanged: jest.fn(),
      updateStoryboardSelection: jest.fn(),
    };

    // Setup the stage
    initStoryboardStage(views);

    // Simulate state where story is not active
    state.story.activeId = null;
    state.selectedAI = { id: "ai-1" };
    state.selectedUser = { id: "user-1" };
    state.selectedFractal = { id: "fractal-1" };

    // Trigger event
    const event = new CustomEvent(EVENTS.DB_UPDATED, {
      detail: { id: "some-id" },
    });

    events.dispatchEvent(event);

    // Wait for async handler
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Expect entities.get to be called
    expect(entities.get).toHaveBeenCalled();
  });
});
