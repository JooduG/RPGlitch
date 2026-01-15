import { jest } from "@jest/globals";

// 1. Mock dependencies
jest.mock("../../../../src/mesmer/audio/service.js", () => ({
  audioService: { play: jest.fn() },
}));

jest.mock("../../../../src/gamemaster/bus.js", () => ({
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
}));

jest.mock("../../../../src/gamemaster/services/llm.js", () => ({
  LlmService: {
    generate: jest.fn().mockResolvedValue("Some AI Response"),
  },
}));

jest.mock("../../../../src/scholar/database/db.js", () => ({
  db: {
    stories: { get: jest.fn(), update: jest.fn(), add: jest.fn() },
    messages: {
      add: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          sortBy: jest.fn().mockResolvedValue([]),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
    },
    settings: { put: jest.fn(), get: jest.fn() },
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
  calculateBlendedParams: jest.fn(() => ({
    temperature: 0.7,
    repetition_penalty: 1.05,
    top_p: 0.85,
    visual: { guidanceScale: 8 },
  })),
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
    clean: jest.fn((t) => t),
    checkRefusal: jest.fn(() => false),
    instruct: jest.fn(),
    authorizeVisuals: jest.fn().mockReturnValue(true),
  },
  calculateDynamics: jest.fn((d) => d),
}));

jest.mock("../../../../src/mesmer/logic/manager.js", () => ({
  VisualManager: {
    generate: jest.fn(),
    getResolutionForMode: jest.fn(),
  },
}));

jest.mock("../../../../src/scholar/index.js", () => ({
  Scholar: {
    archive: jest.fn().mockImplementation((entity, history, role) => {
      return Promise.resolve({
        past: (entity.past || "") + `\n[Scholar Archive] New Event.`,
        present: { physical: "Tired" },
      });
    }),
    consult: jest.fn(),
  },
  entities: {
    get: jest.fn(),
    upsert: jest.fn(),
  },
  ContextBuilder: jest.fn().mockImplementation(() => ({
    build: jest.fn().mockResolvedValue({ system: "mock", messages: [] }),
    buildWardenPrompt: jest.fn().mockResolvedValue({ system: "mock-warden" }),
    buildScholarPrompt: jest.fn(),
    buildScholarArchivistPrompt: jest.fn(),
    buildMesmerVisual: jest.fn(),
  })),
}));

jest.mock("../../../../src/mesmer/index.js", () => ({
  Mesmer: {
    visualize: jest.fn().mockResolvedValue({ imageUrl: "mock-url" }),
  },
}));

// 2. Imports
import { Director } from "../../../../src/gamemaster/engine/director.js";
import { Session } from "../../../../src/gamemaster/engine/session.js";
import { GameMaster } from "../../../../src/gamemaster/index.js";
import { LlmService } from "../../../../src/gamemaster/services/llm.js";
import { entities } from "../../../../src/scholar/index.js";
import { db } from "../../../../src/scholar/database/db.js";
import { Scholar } from "../../../../src/scholar/index.js";

import { CONFIG } from "../../../../src/gamemaster/config.js";
const PHYSICS_CONSTANTS = CONFIG.PHYSICS;

describe("GameMaster Archivist & Heartbeat Logic", () => {
  test("Config Constants are correct", () => {
    expect(PHYSICS_CONSTANTS.HEARTBEAT_RATE).toBe(5);
    expect(PHYSICS_CONSTANTS.ARCHIVIST_RATE).toBe(10);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on Director methods (GameMaster delegates to these)
    jest
      .spyOn(Director, "_runWarden")
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(Director, "_runArchivistCycle")
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
    const msgs = Array(aiTurnCount).fill({ role: "ai" });
    jest.spyOn(Session, "loadMessages").mockResolvedValue(msgs);
    entities.get.mockResolvedValue({ id: "entity", name: "Test" });
  };

  test("Turn 5: Triggers AI Pulse Only", async () => {
    setupMocks(5);
    await GameMaster._executeTurn("story-1", {}, {});
    expect(Director._runWarden).toHaveBeenCalledWith("story-1", "char-ai");
    expect(Director._runArchivistCycle).not.toHaveBeenCalled();
  });

  test("Turn 10: Triggers AI Pulse AND User Archivist", async () => {
    setupMocks(10);
    await GameMaster._executeTurn("story-1", {}, {});
    expect(Director._runWarden).toHaveBeenCalledWith("story-1", "char-ai");
    expect(Director._runArchivistCycle).toHaveBeenCalledWith(
      "story-1",
      10,
      expect.any(Object),
    );
  });

  test("Turn 20: Triggers AI Pulse AND Fractal Archivist", async () => {
    setupMocks(20);
    await GameMaster._executeTurn("story-1", {}, {});
    expect(Director._runWarden).toHaveBeenCalledWith("story-1", "char-ai");
    expect(Director._runArchivistCycle).toHaveBeenCalledWith(
      "story-1",
      20,
      expect.any(Object),
    );
  });

  test("Turn 30: Triggers AI Pulse AND AI Archivist", async () => {
    setupMocks(30);
    await GameMaster._executeTurn("story-1", {}, {});
    expect(Director._runWarden).toHaveBeenCalledWith("story-1", "char-ai");
    expect(Director._runArchivistCycle).toHaveBeenCalledWith(
      "story-1",
      30,
      expect.any(Object),
    );
  });

  test("_runArchivistCycle delegates to Scholar and updates Entity", async () => {
    Director._runArchivistCycle.mockRestore();

    const targetEntity = { id: "char-user", name: "User", past: "Old." };
    entities.get.mockResolvedValue(targetEntity);
    jest.spyOn(Session, "loadMessages").mockResolvedValue([]);

    await Director._runArchivistCycle("story-1", 10, mockStory);

    expect(Scholar.archive).toHaveBeenCalled();
    expect(entities.upsert).toHaveBeenCalled();

    const updateArgs = entities.upsert.mock.calls[0][1];
    expect(updateArgs.past).toContain("Old.");
    expect(updateArgs.past).toContain("[Scholar Archive] New Event.");
    expect(updateArgs.present.physical).toBe("Tired");
  });
});
