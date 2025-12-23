
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

    // Spy on event listener
    const addEventListenerSpy = jest.spyOn(events, 'addEventListener');

    // Re-init to capture the listener (or we can just capture it manually if we knew how events works)
    // Actually initStoryboardStage calls events.addEventListener.
    // But since events is imported from a module, and we didn't mock events module fully (we imported it),
    // we can't easily spy on it unless we mock the module.
    // However, events is an EventTarget-like object.

    // Let's assume the listener was added. We need to trigger it.
    // But since we are modifying the code, we want to ensure that removing the dynamic import still works.

    // Trigger event
    const event = new CustomEvent(EVENTS.DB_UPDATED, {
      detail: { id: "some-id" }
    });

    // We need to wait for the async callback to finish.
    // Since we can't await the callback directly, we can wait for a tick.

    events.dispatchEvent(event);

    await new Promise(resolve => setTimeout(resolve, 0));

    // Expect entities.get to be called
    expect(entities.get).toHaveBeenCalled();
  });
});
