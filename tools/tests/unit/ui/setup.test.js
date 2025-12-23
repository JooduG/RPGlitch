
import { initStoryboardStage } from "../../../../apps/rpglitch/js/ui/setup.js";
import { events, EVENTS } from "../../../../apps/rpglitch/js/core/events.js";
import { state } from "../../../../apps/rpglitch/js/core/state.js";
import { entities } from "../../../../apps/rpglitch/js/data/repo.js";

// Mock dependencies
jest.mock("../../../../apps/rpglitch/js/ui/components/profile/controller.js", () => ({
  getOnUpdateSelection: jest.fn(() => jest.fn()),
  setProfileCallbacks: jest.fn(),
  getActiveSlotKey: jest.fn(),
  closeProfileModal: jest.fn(),
  openProfileModal: jest.fn(),
  refreshProfileIfOpen: jest.fn(),
  renderProfilePage: jest.fn(),
}));

jest.mock("../../../../apps/rpglitch/js/ui/image-gen-ui.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
}));

jest.mock("../../../../apps/rpglitch/js/ui/orchestrator.js", () => ({
  showAlert: jest.fn(),
}));

jest.mock("../../../../apps/rpglitch/js/data/repo.js", () => ({
  entities: {
    get: jest.fn(),
    list: jest.fn(),
  }
}));

describe("setup.js", () => {
  it("should be able to import initStoryboardStage", () => {
    expect(typeof initStoryboardStage).toBe("function");
  });

  it("should handle DB_UPDATED event and call entities.get", async () => {
    const views = {
      setOnSelectionChanged: jest.fn(),
      updateStoryboardSelection: jest.fn(),
    };

    // Setup the stage
    initStoryboardStage(views);

    // Simulate state where story is not active
    state.story.activeId = null;
    state.selectedAI = { id: 'ai-1' };
    state.selectedUser = { id: 'user-1' };
    state.selectedFractal = { id: 'fractal-1' };

    // Trigger event
    const event = new CustomEvent(EVENTS.DB_UPDATED, {
      detail: { id: "some-id" }
    });

    events.dispatchEvent(event);

    // Wait for async handler
    await new Promise(resolve => setTimeout(resolve, 0));

    // Expect entities.get to be called
    expect(entities.get).toHaveBeenCalled();
  });
});
