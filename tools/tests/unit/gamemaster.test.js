import { describe, it, test, expect, vi, beforeEach } from "vitest";
import { GameMaster } from "../../../src/gamemaster/index.js";
import { EVENTS } from "../../../src/gamemaster/bus.js";

// --- MOCKS ---

vi.mock("../../../src/gamemaster/session.js", () => ({
  Session: {
    addAiMessage: vi.fn(),
    requireActive: vi.fn().mockReturnValue("story-1"),
  },
}));

vi.mock("../../../src/gamemaster/llm.js", () => {
  return {
    LlmService: {
      generate: vi.fn(),
    },
    ContextBroker: class {
      static assemble = vi.fn();
    },
  };
});

vi.mock("../../../src/gamemaster/bus.js", () => ({
  events: {
    dispatchEvent: vi.fn(),
  },
  EVENTS: {
    GENERATION_STARTED: "gen:started",
    GENERATION_COMPLETED: "gen:completed",
  },
  state: {},
}));

vi.mock("../../../src/scholar/runtime.svelte.js", () => ({
  runtime: {
    aiCharacter: { name: "AI" },
  },
}));

// Import mocks to inspect
import { Session } from "../../../src/gamemaster/session.js";
import { LlmService, ContextBroker } from "../../../src/gamemaster/llm.js";
import { events } from "../../../src/gamemaster/bus.js";

describe("GameMaster Facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateAiResponse", () => {
    test("should orchestrate generation flow successfully", async () => {
      // Setup
      const mockPayload = { system: "prompt", messages: [] };
      const mockResponse = "Hello World";
      ContextBroker.assemble.mockResolvedValue(mockPayload);
      LlmService.generate.mockResolvedValue(mockResponse);

      // Execute
      await GameMaster.generateAiResponse("story-1", { input: "Hi" });

      // Verify
      expect(ContextBroker.assemble).toHaveBeenCalledWith("Hi", "prose");
      expect(events.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: EVENTS.GENERATION_STARTED }),
      );
      expect(LlmService.generate).toHaveBeenCalledWith(mockPayload);
      expect(Session.addAiMessage).toHaveBeenCalledWith(mockResponse, "AI");
      expect(events.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: EVENTS.GENERATION_COMPLETED }),
      );
    });

    test("should handle errors and dispatch completion event", async () => {
      ContextBroker.assemble.mockRejectedValue(new Error("Assembly Failed"));

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        GameMaster.generateAiResponse("story-1", { input: "Fail" }),
      ).rejects.toThrow("Assembly Failed");

      expect(events.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: EVENTS.GENERATION_COMPLETED }),
      );

      consoleSpy.mockRestore();
    });
  });
});
