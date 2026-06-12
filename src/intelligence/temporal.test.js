import { CONFIG } from "@engine";
import { dynamics_engine, temporal_engine } from "@intelligence";
import { llm_service } from "@platform";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@platform/transport.js", () => ({
  llm_service: {
    generate: vi.fn(),
  },
}));

vi.mock("@intelligence/dynamics.js", () => ({
  dynamics_engine: {
    dynamics_scan: vi.fn(() => []),
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
      vi.mocked(dynamics_engine.dynamics_scan).mockReturnValue([
        {
          id: "VIBE_CHECK",
          scan: "",
        },
      ]);

      const entry = temporal_engine.create("He felt a strange vibe.");

      expect(entry).toHaveProperty("id");
      expect(entry.text).toBe("He felt a strange vibe.");
      expect(entry.dynamics_tags[0].id).toBe("VIBE_CHECK");
      expect(Array.isArray(entry.vector_tags)).toBe(true);
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
      vi.mocked(dynamics_engine.dynamics_scan).mockReturnValue([{ id: "EXPOSURE", scan: "kiss" }]);

      const entries = [
        {
          id: "t1",
          timestamp: 100,
          text: "A",
          type: "past",
          base_weight: 5,
          dynamics_tags: [{ id: "EXPOSURE", word: "kiss" }],
          vector_tags: ["Iron"],
          meta: {},
          emotional_weight: 5,
        },
      ];

      const scored = temporal_engine.score(entries, "Iron kiss");

      // Base (5) + Dynamics ID (1) + Trigger Word (2) + Vector Tag (3) = 11
      const expected = 5 + CONFIG.DYNAMICS.RELEVANCE_DYNAMICS_BONUS + CONFIG.DYNAMICS.RELEVANCE_TRIGGER_BONUS + CONFIG.DYNAMICS.RELEVANCE_VECTOR_BONUS;

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
            text: "Goal",
            type: "future",
            base_weight: 5,
            dynamics_tags: [],
            vector_tags: [],
            meta: {},
          },
        ],
        past: [],
      });

      temporal_engine.resolve(entity, "v1", "SUCCESS");

      expect(entity.future).toHaveLength(0);
      expect(entity.past).toHaveLength(1);
      expect(entity.past[0].text).toBe("Goal");
      expect(entity.past[0].vector_tags).toContain("RESOLUTION:SUCCESS");
    });
  });

  describe("format", () => {
    it("labels past entries based on emotional weight thresholds", () => {
      const past = [
        {
          id: "p1",
          timestamp: 100,
          text: "Core memory",
          type: "past",
          base_weight: 5,
          dynamics_tags: [],
          vector_tags: [],
          meta: {},
          emotional_weight: 10,
        },
        {
          id: "p2",
          timestamp: 200,
          text: "Major memory",
          type: "past",
          base_weight: 5,
          dynamics_tags: [],
          vector_tags: [],
          meta: {},
          emotional_weight: 8,
        },
        {
          id: "p3",
          timestamp: 300,
          text: "Minor memory",
          type: "past",
          base_weight: 5,
          dynamics_tags: [],
          vector_tags: [],
          meta: {},
          emotional_weight: 4,
        },
      ];

      const result = temporal_engine.format(past, "", { mode: "past" });

      expect(result).toContain("[CORE_ANCHOR]: Core memory");
      expect(result).toContain("[MAJOR_ANCHOR]: Major memory");
      expect(result).toContain("[MINOR_ANCHOR]: Minor memory");
    });

    it("labels future entries as impulses", () => {
      const future = [
        {
          id: "f1",
          timestamp: 100,
          text: "Prophecy",
          type: "future",
          base_weight: 5,
          dynamics_tags: [],
          vector_tags: [],
          meta: {},
          emotional_weight: 5,
        },
      ];

      const result = temporal_engine.format(future, "", { mode: "future" });

      expect(result).toContain("[ACTIVE_IMPULSE]: Prophecy");
    });
  });

  describe("weave_resonance (Historical Condensation)", () => {
    it("successfully condenses history into a resonance via LLM", async () => {
      const mockEntity = /** @type {any} */ ({ name: "Viper" });
      const mockHistory = [{ role: "user", content: "test message" }];
      const mockResonance = {
        summary: "A significant event happened.",
        vector_tags: ["event"],
      };

      vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify(mockResonance));
      vi.mocked(dynamics_engine.dynamics_scan).mockReturnValue([
        {
          id: "TEST_TAG",
          scan: "",
        },
      ]);

      const result = await temporal_engine.weave_resonance(mockEntity, mockHistory, "character");

      expect(result?.text).toBe(mockResonance.summary);
      expect(result?.vector_tags).toEqual(["event"]);
      expect(result?.dynamics_tags).toEqual([{ id: "TEST_TAG", word: "" }]);
      expect(result?.timestamp).toBe(Date.now());
    });

    it("handles malformed LLM JSON via non-greedy extraction", async () => {
      const jsonStr = JSON.stringify({ summary: "First object" });
      vi.mocked(llm_service.generate).mockResolvedValue(`Noise before ${jsonStr} noise after`);

      const result = await temporal_engine.weave_resonance(/** @type {any} */ ({ name: "Viper" }), []);

      expect(result?.text).toBe("First object");
    });

    it("handles nested JSON structures robustly", async () => {
      const nestedResonance = {
        summary: "Event with nested info.",
        details: { depth: 2, meta: "data" },
      };
      const response = `Here is the JSON: ${JSON.stringify(nestedResonance)} and some noise.`;
      vi.mocked(llm_service.generate).mockResolvedValue(response);

      const result = await temporal_engine.weave_resonance(/** @type {any} */ ({ name: "Viper" }), []);

      expect(result?.text).toBe(nestedResonance.summary);
      expect(JSON.stringify(result?.text)).not.toBe(JSON.stringify(nestedResonance)); // summary is text
    });

    it("returns null and logs error if LLM fails", async () => {
      vi.mocked(llm_service.generate).mockRejectedValue(new Error("LLM Down"));

      const result = await temporal_engine.weave_resonance(/** @type {any} */ ({ name: "Viper" }), []);

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

      await temporal_engine.consolidate(/** @type {any} */ (mockSession), /** @type {any} */ (mockDb), /** @type {any} */ (mockEntities), /** @type {any} */ (mockRuntime), /** @type {any} */ (mockApp));

      expect(mockSession.require_active).toHaveBeenCalled();
      expect(mockDb.simulation_log.bulkPut).toHaveBeenCalled();
    });
  });
});
