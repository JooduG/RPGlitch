import { jest } from "@jest/globals";

// Mock dependencies BEFORE importing the module under test
jest.mock("../../../../src/js/core/db.js", () => ({
  db: {
    stories: { get: jest.fn() },
    messages: { add: jest.fn(), where: jest.fn() },
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
          fractalId: "world-1",
        },
      },
      activeId: "story-1",
    }, // Add activeId explicitly
    messages: { byStoryId: {} },
  },
  applyPatch: jest.fn(),
}));

jest.mock("../../../../src/js/services/llm-service.js", () => ({
  LlmService: {
    generate: jest.fn(),
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
  calculateBlendedParams: jest.fn(),
}));

jest.mock("../../../../src/js/engine/physics/main.js", () => ({
  calculateDynamics: jest.fn((d) => d), // Pass-through for simplicity
}));

jest.mock("../../../../src/js/ui/services/visuals.js", () => ({
  VisualManager: {
    generate: jest.fn(),
    getResolutionForMode: jest.fn(),
  },
}));

// Import module under test
import { TurnManager } from "../../../../src/js/engine/director.js";
import { LlmService } from "../../../../src/js/services/llm-service.js";
import { entities } from "../../../../src/js/data/repo.js";
import { db } from "../../../../src/js/core/db.js";

describe("TurnManager Memory Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("_runPulse correctly calculates turnCount and updates entity past", async () => {
    const storyId = "story-1";
    const targetId = "char-ai";

    // Mock Story
    db.stories.get.mockResolvedValue({
      id: storyId,
      aiId: "char-ai",
      userId: "char-user",
      fractalId: "world-1",
    });

    // Mock Entities
    const mockAI = { id: "char-ai", name: "AI", past: "Old Memory." };
    entities.get.mockImplementation((type, id) => {
      if (id === "char-ai") return Promise.resolve(mockAI);
      if (id === "char-user") return Promise.resolve({ id: "char-user" });
      if (id === "world-1") return Promise.resolve({ id: "world-1" });
      return Promise.resolve(null);
    });

    // Mock Messages (History)
    // 9 messages total, 3 from AI -> Turn Count should be 3
    const mockMessages = [
      { role: "user", text: "1" },
      { role: "model", text: "1" }, // AI
      { role: "user", text: "2" },
      { role: "model", text: "2" }, // AI
      { role: "user", text: "3" },
      { role: "model", text: "3" }, // AI
    ];

    // Mock TurnManager.loadMessages result
    // We need to spy on TurnManager.loadMessages or mock db.messages.where()...sortBy()
    // Since loadMessages is called internally, we mock the DB chain
    const mockWhere = {
      equals: jest.fn().mockReturnValue({
        sortBy: jest.fn().mockResolvedValue(mockMessages),
      }),
    };
    db.messages.where.mockReturnValue(mockWhere);

    // Mock LLM Response
    LlmService.generate.mockResolvedValue(
      JSON.stringify({
        log_entry: "Summarized event.",
        dynamics: { entropy: 10 },
      }),
    );

    // Execute Pulse
    await TurnManager._runPulse(storyId, targetId);

    // Verification
    // 1. Check if entities.upsert was called
    expect(entities.upsert).toHaveBeenCalled();

    // 2. Check the arguments for the update
    const callArgs = entities.upsert.mock.calls[0];
    const updatedEntity = callArgs[1];

    // 3. Verify 'past' field update
    // Current logic in director.js:
    // const turnCount = msgs.filter((m) => m.role === "model").length;
    // const entry = `\n[Turn ${turnCount}] ${data.log_entry}`;
    // updates.past = (targetEntity.past || "") + entry;

    // Expected Turn Count = 3 (3 "model" roles in mockMessages)
    expect(updatedEntity.past).toBe("Old Memory.\n[Turn 3] Summarized event.");
  });
});
