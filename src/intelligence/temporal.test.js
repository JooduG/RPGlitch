import { temporal_engine, apply_neuroplasticity } from "./temporal.js";
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

vi.mock("@intelligence/embeddings.svelte.js", () => ({
  ensure_embedding: vi.fn(async (v) => {
    v._embedding = new Float32Array(384);
    return v._embedding;
  }),
  ensure_embeddings: vi.fn(async () => {}),
  score_by_semantics: vi.fn(async (vectors) => vectors.map((v) => ({ vector: v, similarity: 0 }))),
  cosine_similarity: vi.fn(() => 0.5),
  embed: vi.fn(async () => new Float32Array(384)),
  is_ready: vi.fn(() => false),
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
      expect(typeof entry.content).toBe("string");
      expect(entry.content).toBe("He felt a strange vibe.");
      expect(typeof entry.timestamp).toBe("number");
      expect(entry.emotional_weight).toBe(5); // Default weight
    });

    it("respects custom base weights", () => {
      const entry = temporal_engine.create("Critical event", "future", 10);
      expect(entry.emotional_weight).toBe(10);
    });
  });

  describe("score", () => {
    it("calculates relevance with emotional weight and recency", () => {
      const entries = [
        {
          id: "t1",
          timestamp: Date.now(),
          content: "A",
          type: "past",
          emotional_weight: 5,
          meta: {},
        },
      ];

      const scored = temporal_engine.score(entries, "Iron kiss");

      // emotional_weight (5) × recency (1.0) = 5
      expect(scored[0]._relevance).toBe(5);
    });
  });

  describe("resolve", () => {
    it("transitions a future impulse to a past anchor", () => {
      const entity = /** @type {any} */ ({
        future: [
          {
            id: "v1",
            timestamp: 100,
            content: "Goal",
            type: "future",
            emotional_weight: 5,
            meta: {},
          },
        ],
        past: [],
      });

      temporal_engine.resolve(entity, "v1", "SUCCESS");

      expect(entity.future).toHaveLength(0);
      expect(entity.past).toHaveLength(1);
      expect(entity.past[0].content).toBe("Goal");
      expect(entity.past[0].type).toBe("past");
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
            emotional_weight: 5,
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

    it("passes category through from Director new_vectors", () => {
      const entity = /** @type {any} */ ({ present: { physical: "", non_physical: "" }, future: [], past: [] });
      const mutations = {
        new_vectors: [
          { directive: "Avenge the fallen", category: "goal", tags: ["vengeance"] },
          { directive: "Storm approaches", category: "threat" },
        ],
      };
      temporal_engine.apply_state_mutations(entity, mutations);
      expect(entity.future).toHaveLength(2);
    });

    it("applies present_append_non_physical state mutations", () => {
      const entity = /** @type {any} */ ({
        present: { physical: "", non_physical: "Calm." },
        future: [],
        past: [],
      });

      const mutations = { present_append_non_physical: "She smiles." };

      temporal_engine.apply_state_mutations(entity, mutations);

      expect(entity.present.non_physical).toBe("Calm.\nShe smiles.");
    });

    it("skips amplification when evidence is null or has no _amplifiedTell", () => {
      const entity = /** @type {any} */ ({
        present: { physical: "", non_physical: "Calm." },
        future: [],
        past: [
          {
            id: "w1",
            timestamp: 100,
            directive: "Old wound",
            type: "past",
            emotional_weight: 9,
            tags: ["trauma"],
            meta: {},
          },
        ],
      });

      const mutations = { present_append_non_physical: "She reacts." };

      temporal_engine.apply_state_mutations(entity, mutations, null, null);
      expect(entity.present.non_physical).not.toContain("The old wound stirs");

      temporal_engine.apply_state_mutations({ ...entity, present: { physical: "", non_physical: "Calm." } }, mutations, null, { confidence: 0.5 });
    });
  });

  describe("format", () => {
    it("labels past entries based on emotional weight thresholds", () => {
      const past = [
        {
          id: "p1",
          timestamp: 100,
          directive: "Core memory about dragons",
          type: "past",
          emotional_weight: 10,
          tags: [],
          meta: {},
        },
        {
          id: "p2",
          timestamp: 200,
          directive: "Major memory of battle",
          type: "past",
          emotional_weight: 8,
          tags: [],
          meta: {},
        },
        {
          id: "p3",
          timestamp: 300,
          directive: "Minor memory of weather",
          type: "past",
          emotional_weight: 4,
          tags: [],
          meta: {},
        },
      ];

      const result = temporal_engine.format(past, "");

      expect(result).toContain("Core memory about dragons");
      expect(result).toContain("Major memory of battle");
      expect(result).toContain("Minor memory of weather");
    });

    it("labels future entries as impulses", () => {
      const future = [
        {
          id: "f1",
          timestamp: 100,
          directive: "Prophecy",
          type: "future",
          emotional_weight: 5,
          tags: [],
          meta: {},
        },
      ];

      const result = temporal_engine.format(future, "");

      expect(result).toContain("Prophecy");
    });
  });

  describe("forge_memory (Historical Condensation)", () => {
    it("successfully condenses history into a resonance via LLM", async () => {
      const mock_entity = /** @type {any} */ ({ name: "Viper" });
      const mock_history = [{ role: "user", content: "test message" }];
      const mock_memory = {
        summary: "A significant event happened.",
        tags: ["event"],
      };

      vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify(mock_memory));

      const result = await temporal_engine.forge_memory(mock_entity, mock_history, "character");

      expect(result?.directive).toBe(mock_memory.summary);
      expect(result?.tags).toEqual(["event"]);
      expect(result?.timestamp).toBe(Date.now());
    });

    it("handles malformed LLM JSON via non-greedy extraction", async () => {
      const json_str = JSON.stringify({ summary: "First object" });
      vi.mocked(llm_service.generate).mockResolvedValue(`Noise before ${json_str} noise after`);

      const result = await temporal_engine.forge_memory(/** @type {any} */ ({ name: "Viper" }), []);

      expect(result?.directive).toBe("First object");
    });

    it("handles nested JSON structures robustly", async () => {
      const nested_memory = {
        summary: "Event with nested info.",
        details: { depth: 2, meta: "data" },
      };
      const response = `Here is the JSON: ${JSON.stringify(nested_memory)} and some noise.`;
      vi.mocked(llm_service.generate).mockResolvedValue(response);

      const result = await temporal_engine.forge_memory(/** @type {any} */ ({ name: "Viper" }), []);

      expect(result?.directive).toBe(nested_memory.summary);
      expect(JSON.stringify(result?.directive)).not.toBe(JSON.stringify(nested_memory)); // summary is text
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
      const mock_messages = Array(15).fill({ id: 1, meta: {} });
      const mock_session = {
        require_active: vi.fn(() => "story_1"),
        load_log: vi.fn(() => mock_messages),
      };
      const mock_db = { simulation_log: { bulkPut: vi.fn() } };
      const mock_entities = { save: vi.fn() };
      const mock_runtime = { active_ai: { past: [] } };
      const mock_app = { log: vi.fn() };

      await temporal_engine.consolidate(
        /** @type {any} */ (mock_session),
        /** @type {any} */ (mock_db),
        /** @type {any} */ (mock_entities),
        /** @type {any} */ (mock_runtime),
        /** @type {any} */ (mock_app),
      );

      expect(mock_session.require_active).toHaveBeenCalled();
      expect(mock_db.simulation_log.bulkPut).toHaveBeenCalled();
    });
  });

  describe("apply_neuroplasticity", () => {
    it("decays trauma vectors by 1 when memory is positive and chaos is low", () => {
      const entity = {
        id: "e1",
        past: [{ id: "t1", emotional_weight: 9, tags: ["trauma", "betrayal"], directive: "Betrayed" }],
      };
      const memory = { emotional_weight: 3, tags: ["connection"] };
      const runtime = {
        active_ai: { ...entity, dynamics: { chaos: 40 } },
        update_entity: vi.fn(),
      };
      const entity_targets = [{ entity: runtime.active_ai, type: "character" }];

      apply_neuroplasticity(entity_targets, memory, runtime);

      expect(runtime.active_ai.past[0].emotional_weight).toBe(8);
      expect(runtime.update_entity).toHaveBeenCalledWith("character", "e1", { past: runtime.active_ai.past });
    });

    it("relapses trauma vectors by 1 when chaos is above 80", () => {
      const entity = {
        id: "e1",
        past: [{ id: "t1", emotional_weight: 8, tags: ["wound", "abandonment"], directive: "Abandoned" }],
      };
      const memory = { emotional_weight: 7, tags: ["event"] };
      const runtime = {
        active_ai: { ...entity, dynamics: { chaos: 85 } },
        update_entity: vi.fn(),
      };
      const entity_targets = [{ entity: runtime.active_ai, type: "character" }];

      apply_neuroplasticity(entity_targets, memory, runtime);

      expect(runtime.active_ai.past[0].emotional_weight).toBe(9);
      expect(runtime.update_entity).toHaveBeenCalled();
    });

    it("clamps decay to minimum of 1", () => {
      const entity = {
        id: "e1",
        past: [{ id: "t1", emotional_weight: 1, tags: ["trauma"], directive: "Already at floor" }],
      };
      const memory = { emotional_weight: 2, tags: ["reconciliation"] };
      const runtime = {
        active_ai: { ...entity, dynamics: { chaos: 30 } },
        update_entity: vi.fn(),
      };
      const entity_targets = [{ entity: runtime.active_ai, type: "character" }];

      apply_neuroplasticity(entity_targets, memory, runtime);

      expect(runtime.active_ai.past[0].emotional_weight).toBe(1);
    });

    it("clamps relapse to maximum of 10", () => {
      const entity = {
        id: "e1",
        past: [{ id: "t1", emotional_weight: 10, tags: ["trauma", "wound"], directive: "Already at ceiling" }],
      };
      const memory = { emotional_weight: 9, tags: ["event"] };
      const runtime = {
        active_ai: { ...entity, dynamics: { chaos: 90 } },
        update_entity: vi.fn(),
      };
      const entity_targets = [{ entity: runtime.active_ai, type: "character" }];

      apply_neuroplasticity(entity_targets, memory, runtime);

      expect(runtime.active_ai.past[0].emotional_weight).toBe(10);
    });

    it("decays high-weight past vectors when memory is positive", () => {
      const entity = {
        id: "e1",
        past: [
          { id: "p1", emotional_weight: 9, content: "Won the battle" },
          { id: "p2", emotional_weight: 5, content: "Walked the dog" },
        ],
      };
      const memory = { emotional_weight: 2, content: "connection" };
      const runtime = {
        active_ai: { ...entity, dynamics: { chaos: 30 } },
        update_entity: vi.fn(),
      };
      const entity_targets = [{ entity: runtime.active_ai, type: "character" }];

      apply_neuroplasticity(entity_targets, memory, runtime);

      expect(runtime.active_ai.past[0].emotional_weight).toBe(8);
      expect(runtime.active_ai.past[1].emotional_weight).toBe(5);
    });

    it("does not decay when memory is not positive and chaos is below 80", () => {
      const entity = {
        id: "e1",
        past: [{ id: "t1", emotional_weight: 9, content: "Old wound" }],
      };
      const memory = { emotional_weight: 7, content: "conflict and tension" };
      const runtime = {
        active_ai: { ...entity, dynamics: { chaos: 50 } },
        update_entity: vi.fn(),
      };
      const entity_targets = [{ entity: runtime.active_ai, type: "character" }];

      apply_neuroplasticity(entity_targets, memory, runtime);

      expect(runtime.active_ai.past[0].emotional_weight).toBe(9);
      expect(runtime.update_entity).not.toHaveBeenCalled();
    });

    it("is safe when entity.past is empty", () => {
      const entity = { id: "e1", past: [] };
      const memory = { emotional_weight: 2, content: "connection" };
      const runtime = {
        active_ai: { ...entity, dynamics: { chaos: 30 } },
        update_entity: vi.fn(),
      };
      const entity_targets = [{ entity: runtime.active_ai, type: "character" }];

      expect(() => apply_neuroplasticity(entity_targets, memory, runtime)).not.toThrow();
      expect(runtime.update_entity).not.toHaveBeenCalled();
    });

    it("is safe when entity_targets is empty", () => {
      const memory = { emotional_weight: 2, content: "connection" };
      const runtime = { active_ai: { dynamics: { chaos: 30 } }, update_entity: vi.fn() };

      expect(() => apply_neuroplasticity([], memory, runtime)).not.toThrow();
      expect(runtime.update_entity).not.toHaveBeenCalled();
    });

    it("does not apply to non-AI entities", () => {
      const user_entity = {
        id: "e2",
        past: [{ id: "t1", emotional_weight: 9, content: "User trauma" }],
      };
      const ai_entity = {
        id: "e1",
        past: [{ id: "t2", emotional_weight: 9, content: "AI trauma" }],
      };
      const memory = { emotional_weight: 3, content: "connection" };
      const runtime = {
        active_ai: { ...ai_entity, dynamics: { chaos: 30 } },
        update_entity: vi.fn(),
      };
      const entity_targets = [
        { entity: runtime.active_ai, type: "character" },
        { entity: user_entity, type: "character" },
      ];

      apply_neuroplasticity(entity_targets, memory, runtime);

      expect(runtime.active_ai.past[0].emotional_weight).toBe(8);
      expect(user_entity.past[0].emotional_weight).toBe(9);
    });

    it("treats memory with reconciliation content as positive regardless of weight", () => {
      const entity = {
        id: "e1",
        past: [{ id: "t1", emotional_weight: 10, content: "Deep scar" }],
      };
      const memory = { emotional_weight: 8, content: "reconciliation and healing" };
      const runtime = {
        active_ai: { ...entity, dynamics: { chaos: 50 } },
        update_entity: vi.fn(),
      };
      const entity_targets = [{ entity: runtime.active_ai, type: "character" }];

      apply_neuroplasticity(entity_targets, memory, runtime);

      expect(runtime.active_ai.past[0].emotional_weight).toBe(9);
    });
  });
});
