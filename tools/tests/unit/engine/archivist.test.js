import { jest } from "@jest/globals";

// Mock dependencies
jest.mock("../../../../src/js/core/db.js", () => ({
  db: {
    stories: { get: jest.fn(), update: jest.fn(), add: jest.fn() },
    messages: { add: jest.fn(), where: jest.fn(), update: jest.fn() },
    settings: { put: jest.fn() },
  },
}));

jest.mock("../../../../src/js/core/state.js", () => ({
  state: {
    story: {
      byId: {
        "story-1": {
          id: "story-1",
          aiId: "char-ai",
          userId: "char-user",
          fractalId: "frac-1",
        },
      },
      activeId: "story-1",
    },
    messages: { byStoryId: {} },
  },
  applyPatch: jest.fn(),
  events: { dispatchEvent: jest.fn() },
}));

// Explicitly mock LlmService to avoid named export issues
jest.mock("../../../../src/js/services/llm-service.js", () => ({
  LlmService: {
    generate: jest.fn().mockResolvedValue("Some AI Response"),
  },
}));

jest.mock("../../../../src/js/data/repo.js", () => ({
  entities: {
    get: jest.fn(),
    upsert: jest.fn(),
  },
}));

jest.mock("../../../../src/js/core/utils.js", () => ({
  error: jest.fn(),
  log: jest.fn(),
  calculateBlendedParams: jest.fn(() => ({
    temperature: 0.7,
    repetition_penalty: 1.05,
    top_p: 0.85,
    visual: { guidanceScale: 8 },
  })),
}));

jest.mock("../../../../src/js/engine/physics/main.js", () => ({
  calculateDynamics: jest.fn((d) => d),
}));

jest.mock("../../../../src/js/ui/services/visuals.js", () => ({
  VisualManager: {
    generate: jest.fn(),
    getResolutionForMode: jest.fn(),
  },
}));

import { TurnManager } from "../../../../src/js/engine/director.js";
import { LlmService } from "../../../../src/js/services/llm-service.js";
import { entities } from "../../../../src/js/data/repo.js";
import { db } from "../../../../src/js/core/db.js";

import { PHYSICS_CONSTANTS } from "../../../../src/js/engine/physics/config.js";

describe("TurnManager Archivist & Heartbeat Logic", () => {
  test("Config Constants are correct", () => {
    console.log("TEST CONSTANTS:", PHYSICS_CONSTANTS);
    expect(PHYSICS_CONSTANTS.HEARTBEAT_RATE).toBe(5);
    expect(PHYSICS_CONSTANTS.ARCHIVIST_RATE).toBe(10);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on internal methods to verify triggers without full execution
    jest
      .spyOn(TurnManager, "_runPulse")
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(TurnManager, "_runArchivist")
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockStory = {
    id: "story-1",
    aiId: "char-ai",
    userId: "char-user",
    fractalId: "frac-1",
  };

  const setupMocks = (aiTurnCount) => {
    db.stories.get.mockResolvedValue(mockStory);

    // Mock messages to return specific count of AI turns
    // Use ROLES.AI to match implementation check
    const msgs = Array(aiTurnCount).fill({ role: "ai" });

    // Spy on loadMessages directly to bypass DB logic and ensure count is correct
    // "this.loadMessages" in director.js will hit this spy if called on TurnManager
    jest.spyOn(TurnManager, "loadMessages").mockResolvedValue(msgs);

    // Return dummy objects for entities
    entities.get.mockResolvedValue({ id: "entity", name: "Test" });
  };

  test("Turn 5: Triggers AI Pulse Only", async () => {
    setupMocks(5);

    await TurnManager._executeTurn("story-1", {}, {});

    expect(TurnManager._runPulse).toHaveBeenCalledWith("story-1", "char-ai");
    expect(TurnManager._runArchivist).not.toHaveBeenCalled();
  });

  test("Turn 10: Triggers AI Pulse AND User Archivist", async () => {
    // 10 is divisible by 5 (Pulse) AND 10 (Archivist)
    // 10 / 10 = 1 % 3 = 1 -> USER
    setupMocks(10);

    await TurnManager._executeTurn("story-1", {}, {});

    console.log(
      "TURN 10 DEBUG:",
      "Pulse Calls:",
      TurnManager._runPulse.mock.calls,
      "Archivist Calls:",
      TurnManager._runArchivist.mock.calls,
    );

    expect(TurnManager._runPulse).toHaveBeenCalledWith("story-1", "char-ai");
    expect(TurnManager._runArchivist).toHaveBeenCalledWith(
      "story-1",
      "char-user",
      "user",
    );
  });

  test("Turn 20: Triggers AI Pulse AND Fractal Archivist", async () => {
    // 20 is divisible by 5 AND 10
    // 20 / 10 = 2 % 3 = 2 -> FRACTAL
    setupMocks(20);

    await TurnManager._executeTurn("story-1", {}, {});

    expect(TurnManager._runPulse).toHaveBeenCalledWith("story-1", "char-ai");
    expect(TurnManager._runArchivist).toHaveBeenCalledWith(
      "story-1",
      "frac-1",
      "fractal",
    );
  });

  test("Turn 30: Triggers AI Pulse AND AI Archivist", async () => {
    // 30 is divisible by 5 AND 10
    // 30 / 10 = 3 % 3 = 0 -> AI
    setupMocks(30);

    await TurnManager._executeTurn("story-1", {}, {});

    expect(TurnManager._runPulse).toHaveBeenCalledWith("story-1", "char-ai");
    expect(TurnManager._runArchivist).toHaveBeenCalledWith(
      "story-1",
      "char-ai",
      "ai",
    );
  });

  test("_runArchivist updates Entity Memory correctly", async () => {
    // Restore the original implementation for this test to check logic
    TurnManager._runArchivist.mockRestore();

    const targetEntity = { id: "char-user", name: "User", past: "Old." };
    entities.get.mockResolvedValue(targetEntity);

    // SPIES
    jest.spyOn(TurnManager, "loadMessages").mockResolvedValue([]);

    // Mock LLM
    LlmService.generate.mockResolvedValue(
      JSON.stringify({
        past_update: "New Event.",
        state: { physical: "Tired" },
      }),
    );

    await TurnManager._runArchivist("story-1", "char-user", "user");

    expect(entities.upsert).toHaveBeenCalled();
    const updateArgs = entities.upsert.mock.calls[0][1];

    expect(updateArgs.past).toContain("Old.");
    expect(updateArgs.past).toContain("[Archivist Entry] New Event.");
    expect(updateArgs.present.physical).toBe("Tired");
  });
});
