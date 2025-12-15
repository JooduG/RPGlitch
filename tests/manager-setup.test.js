import { jest } from "@jest/globals";

// Mock dependencies
jest.mock("../apps/rpglitch/js/core/state.js", () => ({
  state: {},
  applyPatch: jest.fn(),
}));

const mockList = jest.fn();
jest.mock("../apps/rpglitch/js/data/repo.js", () => ({
  entities: {
    list: (...args) => mockList(...args),
  },
}));

jest.mock("../apps/rpglitch/js/engine/director.js", () => ({
  StoryController: {},
}));

jest.mock("../apps/rpglitch/js/ui/services/visuals.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(), // If applyWorldAmbience was renamed, use new name
}));

jest.mock("../apps/rpglitch/js/core/utils.js", () => ({
  error: jest.fn(),
}));

import { SetupManager } from "../apps/rpglitch/js/ui/setup.js";

describe("SetupManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    mockList.mockImplementation((type) => {
      if (type === "character")
        return Promise.resolve([{ id: "c1" }, { id: "c2" }]);
      if (type === "fractal")
        return Promise.resolve([{ id: "f1", type: "fractal" }]);
      if (type === "world") return Promise.resolve([]); // Simulate legacy behavior if needed, or empty
      return Promise.resolve([]);
    });
  });

  test("handleShuffle requests fractals and selects one", async () => {
    const mockViews = {
      updateStoryboardSelection: jest.fn(),
    };

    await SetupManager.shuffle(mockViews);

    // Verify it asked for fractals
    expect(mockList).toHaveBeenCalledWith("fractal");

    // Verify it called updateSelection with a selected world/fractal
    expect(mockViews.updateStoryboardSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        fractal: expect.anything(),
      }),
    );
  });
});
