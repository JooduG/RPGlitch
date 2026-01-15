import { jest } from "@jest/globals";

// Mock dependencies BEFORE importing the module under test
// Removed mock for SUT
jest.mock("../../../../src/mesmer/audio/service.js", () => ({
  audioService: { play: jest.fn() },
}));
jest.mock("../../../../src/gamemaster/bus.js", () => ({
  events: {
    dispatchEvent: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  EVENTS: {
    STORY_LOADED: "story:loaded",
    CHAT_REFRESH: "chat:refresh",
    TYPING_STARTED: "typing:started",
    TYPING_STOPPED: "typing:stopped",
    GENERATION_STARTED: "gen:started",
    GENERATION_COMPLETED: "gen:completed",
    ENTITY_UPDATED: "entity:updated",
  },
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
    },
    messages: { byStoryId: {} },
  },
  applyPatch: jest.fn(),
}));

jest.mock("../../../../src/scholar/database/db.js", () => ({
  db: {
    stories: { get: jest.fn(), add: jest.fn(), update: jest.fn() },
    messages: {
      add: jest.fn(),
      where: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    settings: { put: jest.fn(), get: jest.fn() },
  },
}));

jest.mock("../../../../src/gamemaster/services/llm.js", () => ({
  LlmService: {
    generate: jest.fn(),
  },
}));

jest.mock("../../../../src/scholar/database/repository.js", () => ({
  entities: {
    get: jest.fn(),
    upsert: jest.fn(),
  },
}));

jest.mock("../../../../src/gamemaster/utils.js", () => ({
  error: jest.fn(),
  log: jest.fn(),
  calculateBlendedParams: jest.fn(() => ({ temperature: 0.7 })),
}));

jest.mock("../../../../src/mesmer/logic/manager.js", () => ({
  VisualManager: {
    generate: jest.fn(),
    getResolutionForMode: jest.fn(),
  },
}));

jest.mock("../../../../src/warden/index.js", () => ({
  Warden: {
    scan: jest.fn(),
    enforce: jest.fn(),
    reconcile: jest.fn().mockReturnValue({
      updates: { dynamics: { entropy: 10 } },
      ledger: {},
      needsSave: true,
    }),
    template: jest.fn(),
    apply: jest.fn(),
  },
  calculateDynamics: jest.fn((d) => d),
}));

jest.mock("../../../../src/mesmer/index.js", () => ({
  Mesmer: {
    visualize: jest.fn().mockResolvedValue({ imageUrl: "mock-url" }),
  },
}));

jest.mock("../../../../src/scholar/index.js", () => {
  return {
    ContextBuilder: jest.fn().mockImplementation(() => ({
      build: jest.fn().mockResolvedValue({ system: "mock", messages: [] }),
      buildWardenPrompt: jest.fn().mockResolvedValue({ system: "mock-warden" }),
    })),
    entities: {
      get: jest.fn(),
      upsert: jest.fn(),
    }, // Add mock entities if GM imports it from Scholar index
    Scholar: {
      archive: jest.fn(),
      consult: jest.fn(),
    },
  };
});

// Import module under test
import { GameMaster } from "../../../../src/gamemaster/index.js";
import { LlmService } from "../../../../src/gamemaster/services/llm.js";
import { entities } from "../../../../src/scholar/index.js";
import { db } from "../../../../src/scholar/database/db.js";

describe("GameMaster Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("_runWarden correctly calculates turnCount and updates entity past", async () => {
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
    const mockMessages = [
      { role: "user", text: "1" },
      { role: "model", text: "1" }, // AI
      { role: "user", text: "2" },
      { role: "model", text: "2" }, // AI
      { role: "user", text: "3" },
      { role: "model", text: "3" }, // AI
    ];

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

    // Execute Warden
    await GameMaster._runWarden(storyId, targetId);

    // Verification
    expect(entities.upsert).toHaveBeenCalled();

    const callArgs = entities.upsert.mock.calls[0];
    const updatedEntity = callArgs[1];

    // Expected Turn Count = 3 (3 "model" roles in mockMessages)
    expect(updatedEntity.past).toBe("Old Memory.\n[Turn 3] Summarized event.");
  });
});
