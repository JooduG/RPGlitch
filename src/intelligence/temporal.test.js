import {
  temporal_engine,
  TEMPORAL_SCORING,
  resolve_vector_pool,
  PAST_VECTOR_CAP,
  MAX_TOTAL_VECTORS,
  MAX_VECTOR_CHARS,
  is_origin,
  prune,
} from "./temporal.js";
import { llm_service } from "@platform";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cosine_similarity, embed } from "@intelligence/embeddings.svelte.js";

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

  describe("usr_ / ai_ memory provenance", () => {
    it("stamps ai_ prefixes on engine-created vectors", () => {
      const entry = temporal_engine.create("A session memory.");
      expect(entry.id.startsWith("ai_")).toBe(true);
    });

    it("truncates payloads to the 220-char budget on creation", () => {
      const entry = temporal_engine.create("x".repeat(500));
      expect(entry.content.length).toBeLessThanOrEqual(MAX_VECTOR_CHARS);
    });

    it("is_origin() protects usr_ prefixed memories", () => {
      expect(is_origin({ id: "usr_abc", timestamp: Date.now(), meta: {} })).toBe(true);
      expect(is_origin({ id: "ai_abc", timestamp: Date.now(), meta: {} })).toBe(false);
    });

    it("usr_ memories survive consolidation evictions", () => {
      const entity = { past: [] };
      for (let i = 0; i < PAST_VECTOR_CAP; i++) {
        entity.past.push({ id: `ai_${i}`, timestamp: i, content: `session memory ${i}`, type: "past", emotional_weight: 5, meta: {} });
      }
      entity.past.push({ id: "usr_pinned", timestamp: 999999, content: "pinned backstory", type: "past", emotional_weight: 5, meta: {} });

      temporal_engine.append_past_vector(entity, {
        id: "ai_overflow",
        timestamp: 1000000,
        content: "new overflow memory",
        type: "past",
        emotional_weight: 5,
        meta: {},
      });

      expect(entity.past.some((v) => v.id === "usr_pinned")).toBe(true);
      expect(entity.past.some((v) => v.id === "ai_overflow")).toBe(true);
    });

    it("enforces the 200-record total ceiling", () => {
      const entity = { past: [] };
      for (let i = 0; i < MAX_TOTAL_VECTORS; i++) {
        entity.past.push({ id: `usr_${i}`, timestamp: i, content: `pinned ${i}`, type: "past", emotional_weight: 5, meta: {} });
      }
      temporal_engine.append_past_vector(entity, {
        id: "ai_overflow",
        timestamp: 999999,
        content: "beyond ceiling",
        type: "past",
        emotional_weight: 5,
        meta: {},
      });
      expect(entity.past.length).toBeLessThanOrEqual(MAX_TOTAL_VECTORS);
    });

    it("grants pinned memories the 1.5x relevance boost", async () => {
      temporal_engine.set_round(0);
      const pinned = {
        id: "usr_anchor",
        timestamp: Date.now(),
        content: "The Ashenweald exile.",
        type: "past",
        emotional_weight: 5,
        meta: { round: 0 },
      };
      const session = {
        id: "ai_fresh",
        timestamp: Date.now(),
        content: "The Ashenweald exile.",
        type: "past",
        emotional_weight: 5,
        meta: { round: 0 },
      };

      const scored = temporal_engine.score([session, pinned]);
      const pinned_hit = scored.find((v) => v.id === "usr_anchor");
      const session_hit = scored.find((v) => v.id === "ai_fresh");
      expect(pinned_hit._relevance).toBeCloseTo(session_hit._relevance * 1.5, 3);
    });
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

    it("exposes recalibration constants with sane ranges", () => {
      expect(TEMPORAL_SCORING.SEMANTIC_GAIN).toBeGreaterThan(1);
      expect(TEMPORAL_SCORING.RECENCY_FLOOR).toBeGreaterThan(0);
      expect(TEMPORAL_SCORING.RECENCY_FLOOR).toBeLessThan(1);
      expect(TEMPORAL_SCORING.DECAY_SOFTEN).toBeGreaterThan(0);
      expect(TEMPORAL_SCORING.DECAY_SOFTEN).toBeLessThanOrEqual(1);
    });

    it("lets an old-but-relevant memory outrank a fresh-but-irrelevant one", async () => {
      const dot = (a, b) => {
        let s = 0;
        for (let i = 0; i < a.length; i++) s += a[i] * b[i];
        return s;
      };
      const context_emb = new Float32Array(384);
      context_emb[0] = 1;
      const old_emb = new Float32Array(384);
      old_emb[0] = 1; // cosine 1.0 — strongly relevant
      const fresh_emb = new Float32Array(384);
      fresh_emb[0] = 0.2; // cosine 0.2 — weakly relevant

      vi.mocked(cosine_similarity).mockImplementation(dot);
      vi.mocked(embed).mockResolvedValue(context_emb);
      await temporal_engine.precompute_context_embedding("vault door blood");
      temporal_engine.set_round(100);

      const old_relevant = {
        id: "old",
        timestamp: 1,
        content: "The vault opens only for the blood of a Lumen.",
        type: "past",
        emotional_weight: 5,
        meta: { round: 0 },
        _embedding: old_emb,
      };
      const fresh_irrelevant = {
        id: "fresh",
        timestamp: 2,
        content: "They drank tea and watched the rain.",
        type: "past",
        emotional_weight: 5,
        meta: { round: 100 },
        _embedding: fresh_emb,
      };

      const scored = temporal_engine.score([fresh_irrelevant, old_relevant]);

      expect(scored[0].id).toBe("old");
      expect(scored[1].id).toBe("fresh");
      expect(scored[0]._relevance).toBeCloseTo(5 * (1 + TEMPORAL_SCORING.SEMANTIC_GAIN) * 0.5769, 2);
      expect(scored[1]._relevance).toBeCloseTo(5 * (1 + TEMPORAL_SCORING.SEMANTIC_GAIN * 0.2), 2);
    });

    it("keeps recency as the tiebreaker among equal semantic matches", async () => {
      const context_emb = new Float32Array(384);
      context_emb[0] = 1;
      const same_emb = new Float32Array(384);
      same_emb[0] = 1; // both cosine 1.0

      vi.mocked(cosine_similarity).mockImplementation((a, b) => {
        let s = 0;
        for (let i = 0; i < a.length; i++) s += a[i] * b[i];
        return s;
      });
      vi.mocked(embed).mockResolvedValue(context_emb);
      await temporal_engine.precompute_context_embedding("lore");
      temporal_engine.set_round(100);

      const a_old = { id: "a", timestamp: 1, content: "old lore", type: "past", emotional_weight: 5, meta: { round: 0 }, _embedding: same_emb };
      const b_fresh = { id: "b", timestamp: 2, content: "new lore", type: "past", emotional_weight: 5, meta: { round: 100 }, _embedding: same_emb };

      const scored = temporal_engine.score([a_old, b_fresh]);

      expect(scored[0].id).toBe("b");
      expect(scored[1].id).toBe("a");
    });

    it("floors the recency factor so age can never zero out a memory", async () => {
      temporal_engine.set_round(1000);
      const ancient = {
        id: "ancient",
        timestamp: 1,
        content: "An age-old grudge.",
        type: "past",
        emotional_weight: 5,
        meta: { round: 0 },
      };

      const scored = temporal_engine.score([ancient]);

      expect(scored[0]._recency_factor).toBeCloseTo(TEMPORAL_SCORING.RECENCY_FLOOR, 4);
      expect(scored[0]._relevance).toBeCloseTo(5 * TEMPORAL_SCORING.RECENCY_FLOOR, 4);
    });

    it("leaves maximum-weight vectors immune to decay", async () => {
      temporal_engine.set_round(1000);
      const anchor = {
        id: "anchor",
        timestamp: 1,
        content: "The immutable pact.",
        type: "past",
        emotional_weight: 10,
        meta: { round: 0 },
      };

      const scored = temporal_engine.score([anchor]);

      expect(scored[0]._recency_factor).toBe(1);
      expect(scored[0]._relevance).toBe(10);
    });
  });

  describe("resolve", () => {
    it("re-applies a resolved past anchor with its outcome memory", () => {
      const entity = /** @type {any} */ ({
        past: [
          {
            id: "v1",
            timestamp: 100,
            content: "Goal",
            type: "past",
            emotional_weight: 5,
            meta: {},
          },
        ],
      });

      temporal_engine.resolve(entity, "v1", "SUCCESS", null, "success", "Completed the goal.");

      expect(entity.past).toHaveLength(1);
      expect(entity.past[0].content).toBe("Completed the goal.");
      expect(entity.past[0].type).toBe("past");
      expect(entity.past[0].meta.outcome).toBe("success");
    });
  });

  describe("apply_state_mutations", () => {
    it("appends to state_append and resolves a past anchor", () => {
      const entity = /** @type {any} */ ({
        present: { physical: "", non_physical: "Initial state." },
        past: [
          {
            id: "v1",
            timestamp: 100,
            content: "Goal",
            type: "past",
            emotional_weight: 5,
            tags: [],
            meta: {},
          },
        ],
      });

      const mutations = {
        state_append: { non_physical: "Now they are angry." },
        vector_resolve: [{ id: "v1", resolution_summary: "Resolved via anger" }],
      };

      const result = temporal_engine.apply_state_mutations(entity, mutations);
      expect(result).toBe(true);
      expect(entity.present.non_physical).toBe("Initial state.\nNow they are angry.");
      expect(entity.past).toHaveLength(1);
      expect(entity.past[0].type).toBe("past");
    });

    it("returns false if mutations object is empty or invalid", () => {
      const entity = /** @type {any} */ ({ present: { non_physical: "" } });
      const result = temporal_engine.apply_state_mutations(entity, null);
      expect(result).toBe(false);
    });

    it("passes category through from Director past: (all become past anchors)", () => {
      const entity = /** @type {any} */ ({ present: { physical: "", non_physical: "" }, past: [] });
      const mutations = {
        past: [
          { content: "Avenge the fallen", category: "goal", tags: ["vengeance"] },
          { content: "Storm approaches", category: "threat" },
        ],
      };
      temporal_engine.apply_state_mutations(entity, mutations);
      expect(entity.past).toHaveLength(2);
    });

    it("applies state_append state mutations", () => {
      const entity = /** @type {any} */ ({
        present: { physical: "", non_physical: "Calm." },
        future: "",
      });

      const mutations = { state_append: { non_physical: "She smiles." } };

      temporal_engine.apply_state_mutations(entity, mutations);

      expect(entity.present.non_physical).toBe("Calm.\nShe smiles.");
    });

    it("skips amplification when evidence is null or has no _amplifiedTell", () => {
      const entity = /** @type {any} */ ({
        present: { physical: "", non_physical: "Calm." },
        future: "",
      });

      const mutations = { state_append: { non_physical: "She reacts." } };

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
          content: "Core memory about dragons",
          type: "past",
          emotional_weight: 10,
          tags: [],
          meta: {},
        },
        {
          id: "p2",
          timestamp: 200,
          content: "Major memory of battle",
          type: "past",
          emotional_weight: 8,
          tags: [],
          meta: {},
        },
        {
          id: "p3",
          timestamp: 300,
          content: "Minor memory of weather",
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
          content: "Prophecy",
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

  describe("forge_memory (Entity-Specific Condensation)", () => {
    const targets = () => [
      { key: "AI_CHARACTER", type: "character", entity: /** @type {any} */ ({ name: "Viper" }) },
      { key: "USER_PERSONA", type: "character", entity: /** @type {any} */ ({ name: "Ghost" }) },
      { key: "FRACTAL", type: "fractal", entity: /** @type {any} */ ({ name: "Nova City" }) },
    ];

    it("forges ONE distinct memory per entity from its own perspective", async () => {
      const mock_memory = {
        AI_CHARACTER: {
          past: [
            {
              content: "Viper felt the crowd's distrust and decided to stay quiet.",
              type: "past",
              emotional_weight: 6,
              tags: ["distrust"],
            },
          ],
        },
        USER_PERSONA: {
          past: [
            {
              content: "Ghost noticed Viper's tension and resolved to press for the truth.",
              type: "future",
              emotional_weight: 4,
              tags: ["resolve"],
            },
          ],
        },
        FRACTAL: {
          past: [
            {
              content: "The market din turned hostile after the guard's announcement.",
              type: "past",
              emotional_weight: 3,
              tags: ["atmosphere"],
            },
          ],
        },
      };

      vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify(mock_memory));

      const result = await temporal_engine.forge_memory(targets(), [{ role: "user", content: "test" }]);

      expect(result?.memories?.AI_CHARACTER?.[0]?.content).toContain("Viper");
      expect(result?.memories?.USER_PERSONA?.[0]?.content).toContain("Ghost");
      expect(result?.memories?.FRACTAL?.[0]?.content).toContain("market");
      expect(result?.memories?.AI_CHARACTER?.[0]?.content).not.toBe(result?.memories?.USER_PERSONA?.[0]?.content);
      expect(result?.memories?.AI_CHARACTER?.[0]?.timestamp).toBe(Date.now());
    });

    it("preserves present type while normalizing future and invalid types to past", async () => {
      vi.mocked(llm_service.generate).mockResolvedValue(
        JSON.stringify({
          AI_CHARACTER: { past: [{ content: "Prophecy", type: "future" }] },
          USER_PERSONA: { past: [{ content: "Directive", type: "present" }] },
          FRACTAL: { past: [{ content: "Odd", type: "prophecy" }] },
        }),
      );

      const result = await temporal_engine.forge_memory(targets(), []);

      // FUTURE is prose now, so a forge "future" vector is demoted to a past anchor.
      expect(result?.memories?.AI_CHARACTER?.[0]?.type).toBe("past");
      expect(result?.memories?.USER_PERSONA?.[0]?.type).toBe("present");
      expect(result?.memories?.FRACTAL?.[0]?.type).toBe("past");
    });

    it("skips embeddings for present directives", async () => {
      vi.mocked(llm_service.generate).mockResolvedValue(
        JSON.stringify({
          AI_CHARACTER: { past: [{ content: "Now", type: "present" }] },
          USER_PERSONA: { past: [{ content: "Later", type: "future" }] },
        }),
      );

      const result = await temporal_engine.forge_memory(targets(), []);
      expect(result?.memories?.AI_CHARACTER?.[0]?._embedding).toBeUndefined();
      expect(result?.memories?.USER_PERSONA?.[0]?._embedding).toBeInstanceOf(Float32Array);
    });

    it("handles malformed LLM JSON via non-greedy extraction", async () => {
      const json_str = JSON.stringify({ AI_CHARACTER: { past: [{ content: "First object" }] } });
      vi.mocked(llm_service.generate).mockResolvedValue(`Noise before ${json_str} noise after`);

      const result = await temporal_engine.forge_memory(targets(), []);

      expect(result?.memories?.AI_CHARACTER?.[0]?.content).toBe("First object");
    });

    it("handles nested JSON structures robustly", async () => {
      const nested_memory = {
        AI_CHARACTER: { past: [{ content: "Event with nested info.", details: { depth: 2, meta: "data" } }] },
      };
      const response = `Here is the JSON: ${JSON.stringify(nested_memory)} and some noise.`;
      vi.mocked(llm_service.generate).mockResolvedValue(response);

      const result = await temporal_engine.forge_memory(targets(), []);

      expect(result?.memories?.AI_CHARACTER?.[0]?.content).toBe("Event with nested info.");
    });

    it("returns null when no entity targets are provided", async () => {
      const result = await temporal_engine.forge_memory([], []);
      expect(result).toBeNull();
    });

    it("returns null and logs error if LLM fails", async () => {
      vi.mocked(llm_service.generate).mockRejectedValue(new Error("LLM Down"));

      const result = await temporal_engine.forge_memory(targets(), []);

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
      const mock_runtime = { active_ai: { future: "", past: [] } };
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

    it("routes each entity's own memory by its forged type", async () => {
      const mock_messages = Array(15).fill({ id: 1, meta: {} });
      const mock_session = {
        require_active: vi.fn(() => "story_1"),
        load_log: vi.fn(() => mock_messages),
        log_system_entry: vi.fn(),
      };
      const mock_db = { simulation_log: { bulkPut: vi.fn() } };
      const mock_entities = { save: vi.fn() };

      const ai = { id: "ai1", future: "", past: [], present: { physical: "", non_physical: "" }, eternal: { physical: "", non_physical: "" } };
      const user = { id: "u1", future: "", past: [], present: { physical: "", non_physical: "" }, eternal: { physical: "", non_physical: "" } };
      const fractal = { id: "f1", future: "", past: [], present: { physical: "", non_physical: "" }, eternal: { physical: "", non_physical: "" } };

      const mock_runtime = {
        active_ai: ai,
        active_user: user,
        active_fractal: fractal,
        update_entity: vi.fn(async () => {}),
      };
      const mock_app = { log: vi.fn() };

      vi.mocked(llm_service.generate).mockResolvedValue(
        JSON.stringify({
          AI_CHARACTER: { past: [{ content: "Viper learned to trust Ghost.", type: "past", emotional_weight: 6 }] },
          USER_PERSONA: { past: [{ content: "Ghost plans to confront the warden.", type: "future", emotional_weight: 4 }] },
          FRACTAL: { present: { non_physical: "Nova City is on the brink of a blackout." } },
        }),
      );

      await temporal_engine.consolidate(
        /** @type {any} */ (mock_session),
        /** @type {any} */ (mock_db),
        /** @type {any} */ (mock_entities),
        /** @type {any} */ (mock_runtime),
        /** @type {any} */ (mock_app),
      );

      expect(ai.past).toHaveLength(1);
      expect(ai.past[0].content).toContain("Viper");

      // The USER's "future"-typed append is demoted to a past anchor — the
      // agenda now lives in the consolidated future prose field.
      expect(user.future).toBe("");
      expect(user.past).toHaveLength(1);
      expect(user.past[0].content).toContain("confront");

      expect(fractal.present.non_physical).toContain("blackout");
      expect(fractal.past || []).toHaveLength(0);

      expect(mock_session.log_system_entry).toHaveBeenCalled();
      expect(mock_db.simulation_log.bulkPut).toHaveBeenCalled();
    });
  });
});

describe("resolve_vector_pool()", () => {
  const past = [{ id: "p1", timestamp: 1, content: "past mem", type: "past", emotional_weight: 5, meta: {} }];

  it("returns only the past pool — future is prose, not a vector pool", () => {
    const pool = resolve_vector_pool({ past, future: "An active trajectory." });
    expect(pool).toHaveLength(1);
    expect(pool[0].type).toBe("past");
    expect(pool[0].content).toBe("past mem");
  });

  it("returns past only when future is empty", () => {
    const pool = resolve_vector_pool({ past, future: "" });
    expect(pool).toHaveLength(1);
    expect(pool[0].type).toBe("past");
  });

  it("returns empty array for null, undefined, or memory-less objects", () => {
    expect(resolve_vector_pool(null)).toEqual([]);
    expect(resolve_vector_pool(undefined)).toEqual([]);
    expect(resolve_vector_pool({})).toEqual([]);
    expect(resolve_vector_pool({ past: [], future: "" })).toEqual([]);
  });

  it("normalizes content from directive fallback and infers past type", () => {
    const pool = resolve_vector_pool({ past: [{ id: "p1", directive: "a directive" }] });
    expect(pool[0].content).toBe("a directive");
    expect(pool[0].type).toBe("past");
  });
});

describe("temporal_engine.consolidate()", () => {
  it("preserves baseline clothing tags when merging memory forge present.physical updates", async () => {
    const mock_ai = {
      id: "ai-1",
      name: "Lord Benedict Silvers",
      type: "character",
      present: {
        physical: "[SUIT: tailored charcoal jacket] [RING: blood-diamond ring]",
        non_physical: "Observant",
      },
      past: [],
      future: "Standing objective",
    };
    const mock_user = {
      id: "user-1",
      name: "Julien the Banished Prince",
      type: "character",
      present: {
        physical: "[ROBES: sheer high-elven scholarly robes] [EXPRESSION: soft deferential gaze] [APPAREL: minimalist coral-rose silk thong]",
        non_physical: "Kneeling softly",
      },
      past: [],
      future: "Seeking structure",
    };
    const mock_session = {
      require_active: vi.fn(() => "story-1"),
      load_log: vi.fn(async () => [
        { id: 1, role: "user", text: "t1" },
        { id: 2, role: "ai", text: "t2" },
        { id: 3, role: "user", text: "t3" },
        { id: 4, role: "ai", text: "t4" },
        { id: 5, role: "user", text: "t5" },
        { id: 6, role: "ai", text: "t6" },
        { id: 7, role: "user", text: "t7" },
        { id: 8, role: "ai", text: "t8" },
      ]),
      log_system_entry: vi.fn(),
    };
    const mock_runtime = {
      active_ai: mock_ai,
      active_user: mock_user,
      active_fractal: null,
      update_entity: vi.fn(),
    };
    const mock_app = { log: vi.fn() };
    const mock_db = { simulation_log: { bulkPut: vi.fn() } };

    // Forge response provides condition/expression updates without repeating full robes/thong
    llm_service.generate.mockResolvedValue(
      JSON.stringify({
        _thought_process: "Consolidating state.",
        USER_PERSONA: {
          present: {
            physical: "[EXPRESSION: wide eyes, flushed] [CONDITION: blindfolded with midnight-blue silk]",
            non_physical: "Deeply submissive",
          },
          future: "New intent",
          past: [],
        },
      }),
    );

    await temporal_engine.consolidate(mock_session, mock_db, {}, mock_runtime, mock_app);

    expect(mock_user.present.physical).toContain("[ROBES: sheer high-elven scholarly robes]");
    expect(mock_user.present.physical).toContain("[APPAREL: minimalist coral-rose silk thong]");
    expect(mock_user.present.physical).toContain("[EXPRESSION: wide eyes, flushed]");
    expect(mock_user.present.physical).toContain("[CONDITION: blindfolded with midnight-blue silk]");
    expect(mock_user.present.non_physical).toBe("Deeply submissive");
  });
});

describe("prune", () => {
  it("returns empty array for invalid inputs", () => {
    expect(prune(null)).toEqual([]);
    expect(prune(undefined)).toEqual([]);
    expect(prune("not an array")).toEqual([]);
  });

  it("filters out future vectors and takes up to 3 past vectors", () => {
    const vectors = [
      { id: "1", content: "Memory 1", type: "past", emotional_weight: 7 },
      { id: "2", content: "Agenda 1", type: "future" },
      { id: "3", content: "Memory 2", type: "past", emotional_weight: 8 },
      { id: "4", content: "Memory 3", type: "past", emotional_weight: 9 },
      { id: "5", content: "Memory 4", type: "past", emotional_weight: 10 },
    ];
    const result = prune(vectors);
    expect(result).toHaveLength(3);
    expect(result.map((v) => v.id)).toEqual(["1", "3", "4"]);
    expect(result[0].type).toBe("past");
  });
});
