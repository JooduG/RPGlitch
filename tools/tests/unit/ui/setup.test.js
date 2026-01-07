import { jest } from "@jest/globals";

// Mock dependencies (Must be above imports in some ESM setups)
jest.mock("../../../../src/js/ui/components/profile/controller.js", () => ({
  getOnUpdateSelection: jest.fn(() => jest.fn()),
  setProfileCallbacks: jest.fn(),
  getActiveSlotKey: jest.fn(),
  closeProfileModal: jest.fn(),
  openProfileModal: jest.fn(),
  refreshProfileIfOpen: jest.fn(),
  renderProfilePage: jest.fn(),
}));

jest.mock("../../../../src/js/ui/image-gen-ui.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
  updateDeveloperModeClass: jest.fn(),
}));

jest.mock("../../../../src/js/ui/orchestrator.js", () => ({
  showAlert: jest.fn(),
}));

jest.mock("../../../../src/js/data/repo.js", () => ({
  entities: {
    get: jest.fn(),
    list: jest.fn(),
  },
}));

jest.mock("../../../../src/js/engine/director.js", () => ({
  TurnManager: {
    createFromSelection: jest.fn(),
    generatePrologue: jest.fn(),
    load: jest.fn(),
  },
}));

jest.mock("../../../../src/js/core/utils.js", () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

import { initStoryboardStage } from "../../../../src/js/ui/setup.js";
import { events, EVENTS } from "../../../../src/js/core/events.js";
import { state } from "../../../../src/js/core/state.js";

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
    const { entities } = await import("../../../../src/js/data/repo.js");
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
