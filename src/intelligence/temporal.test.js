import { temporal_engine } from "./temporal.js";
import { llm_service } from "@platform";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@platform/transport.js", () => ({
  llm_service: {
    generate: vi.fn(),
  },
}));

vi.mock("@engine/session.svelte.js", () => ({
  session_driver: {
    log_system_entry: vi.fn(),
    require_active: vi.fn(() => "test-story-id"),
  },
}));

vi.mock("@intelligence/prompts.js", () => ({
  prompt_builder: {
    build_memory_prompt: vi.fn(() => ({ system: "mock prompt", messages: [] })),
  },
}));

describe("temporal_engine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01"));
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("create", () => {
    it("creates a symmetric temporal entry", () => {
      const entry = temporal_engine.create("He felt a strange vibe.");

      expect(entry).toHaveProperty("id");
      expect(Array.isArray(entry.tags)).toBe(true);
      expect(typeof entry.timestamp).toBe("number");
      expect(entry.base_weight).toBe(5); // Default weight
    });

    it("respects custom base weights", () => {
      const entry = temporal_engine.create("Critical event", "future", 10);
      expect(entry.base_weight).toBe(10);
    });
  });

  describe("score", () => {
    it("calculates relevance with dynamics and tag bonuses", () => {
      const entries = [
        {
          id: "t1",
          timestamp: 100,
          directive: "A",
          type: "past",
          base_weight: 5,
          tags: ["iron"],
          meta: {},
          emotional_weight: 5,
        },
      ];

      const scored = temporal_engine.score(entries, "Iron kiss");

      // Base (5) + Vector Tag (3) = 8
      const expected = 5 + 3;

      expect(scored[0]._relevance).toBe(expected);
    });
  });

  describe("resolve", () => {
    it("transitions a future impulse to a past anchor", () => {
      const entity = /** @type {any} */ ({
        future: [
          {
            id: "v1",
            timestamp: 100,
            directive: "Goal",
            type: "future",
            base_weight: 5,
            tags: [],
            meta: {},
          },
        ],
        past: [],
      });

      temporal_engine.resolve(entity, "v1", "SUCCESS");

      expect(entity.future).toHaveLength(0);
      expect(entity.past).toHaveLength(1);
      expect(entity.past[0].directive).toBe("Goal");
      expect(entity.past[0].tags).toContain("resolution:success");
    });
  });

  describe("apply_state_mutations", () => {
    it("appends to present_append and shifts future_to_past", () => {
      const entity = /** @type {any} */ ({
        present: { physical: "", non_physical: "Initial state." },
        future: [
          {
            id: "v1",
            timestamp: 100,
            directive: "Goal",
            type: "future",
            base_weight: 5,
            tags: [],
            meta: {},
          },
        ],
        past: [],
      });

      const mutations = {
        present_append_non_physical: "Now they are angry.",
        resolve_vectors: [{ id: "v1", resolution_summary: "Resolved via anger" }],
      };

      const result = temporal_engine.apply_state_mutations(entity, mutations);
      expect(result).toBe(true);
      expect(entity.present.non_physical).toBe("Initial state.\nNow they are angry.");
      expect(entity.future).toHaveLength(0);
      expect(entity.past).toHaveLength(1);
    });

    it("returns false if mutations object is empty or invalid", () => {
      const entity = /** @type {any} */ ({ present: { non_physical: "" } });
      const result = temporal_engine.apply_state_mutations(entity, null);
      expect(result).toBe(false);
    });
  });

  describe("format", () => {
    it("labels past entries based on emotional weight thresholds", () => {
      const past = [
        {
          id: "p1",
          timestamp: 100,
          directive: "Core memory",
          type: "past",
          base_weight: 5,
          tags: [],
          meta: {},
          emotional_weight: 10,
        },
        {
          id: "p2",
          timestamp: 200,
          directive: "Major memory",
          type: "past",
          base_weight: 5,
          tags: [],
          meta: {},
          emotional_weight: 8,
        },
        {
          id: "p3",
          timestamp: 300,
          directive: "Minor memory",
          type: "past",
          base_weight: 5,
          tags: [],
          meta: {},
          emotional_weight: 4,
        },
      ];

      const result = temporal_engine.format(past, "", { mode: "past" });

      expect(result).toContain("Core memory");
      expect(result).toContain("Major memory");
      expect(result).toContain("Minor memory");
    });

    it("labels future entries as impulses", () => {
      const future = [
        {
          id: "f1",
          timestamp: 100,
          directive: "Prophecy",
          type: "future",
          base_weight: 5,
          tags: [],
          meta: {},
          emotional_weight: 5,
        },
      ];

      const result = temporal_engine.format(future, "", { mode: "future" });

      expect(result).toContain("Prophecy");
    });
  });

  describe("forge_memory (Historical Condensation)", () => {
    it("successfully condenses history into a resonance via LLM", async () => {
      const mockEntity = /** @type {any} */ ({ name: "Viper" });
      const mockHistory = [{ role: "user", content: "test message" }];
      const mockMemory = {
        summary: "A significant event happened.",
        tags: ["event"],
      };

      vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify(mockMemory));

      const result = await temporal_engine.forge_memory(mockEntity, mockHistory, "character");

      expect(result?.directive).toBe(mockMemory.summary);
      expect(result?.tags).toEqual(["event"]);
      expect(result?.timestamp).toBe(Date.now());
    });

    it("handles malformed LLM JSON via non-greedy extraction", async () => {
      const jsonStr = JSON.stringify({ summary: "First object" });
      vi.mocked(llm_service.generate).mockResolvedValue(`Noise before ${jsonStr} noise after`);

      const result = await temporal_engine.forge_memory(/** @type {any} */ ({ name: "Viper" }), []);

      expect(result?.directive).toBe("First object");
    });

    it("handles nested JSON structures robustly", async () => {
      const nestedMemory = {
        summary: "Event with nested info.",
        details: { depth: 2, meta: "data" },
      };
      const response = `Here is the JSON: ${JSON.stringify(nestedMemory)} and some noise.`;
      vi.mocked(llm_service.generate).mockResolvedValue(response);

      const result = await temporal_engine.forge_memory(/** @type {any} */ ({ name: "Viper" }), []);

      expect(result?.directive).toBe(nestedMemory.summary);
      expect(JSON.stringify(result?.directive)).not.toBe(JSON.stringify(nestedMemory)); // summary is text
    });

    it("returns null and logs error if LLM fails", async () => {
      vi.mocked(llm_service.generate).mockRejectedValue(new Error("LLM Down"));

      const result = await temporal_engine.forge_memory(/** @type {any} */ ({ name: "Viper" }), []);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("consolidate", () => {
    it("does not crash when simulation_log is a plain array and consolidation is triggered", async () => {
      const mockMessages = Array(15).fill({ id: 1, meta: {} });
      const mockSession = {
        require_active: vi.fn(() => "story_1"),
        load_log: vi.fn(() => mockMessages),
      };
      const mockDb = { simulation_log: { bulkPut: vi.fn() } };
      const mockEntities = { save: vi.fn() };
      const mockRuntime = { active_ai: { past: [] } };
      const mockApp = { log: vi.fn() };

      await temporal_engine.consolidate(
        /** @type {any} */ (mockSession),
        /** @type {any} */ (mockDb),
        /** @type {any} */ (mockEntities),
        /** @type {any} */ (mockRuntime),
        /** @type {any} */ (mockApp),
      );

      expect(mockSession.require_active).toHaveBeenCalled();
      expect(mockDb.simulation_log.bulkPut).toHaveBeenCalled();
    });
  });
});
