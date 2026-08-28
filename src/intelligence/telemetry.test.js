import { describe, expect, it } from "vitest";
import { build_update_entry, build_retrieval, capture_dynamics_delta, build_turn_summary } from "./telemetry.js";

describe("Telemetry Builders & Codecs (src/intelligence/telemetry.js)", () => {
  describe("build_update_entry()", () => {
    it("returns null when there are no mutations, dynamics, or vectors", () => {
      const entry = build_update_entry("Silvers", {}, [], []);
      expect(entry).toBeNull();
    });

    it("populates present, eternal, and vector mutations correctly", () => {
      const mutations = {
        state_append: { physical: "Scar on left cheek", non_physical: "Wary posture" },
        foundation_consolidated: { physical: "Tall stature", non_physical: "Stoic demeanor" },
        vector_append: [
          { directive: "Distrusts the corporation", emotional_weight: 8 },
          { content: "Prefers the shadows", weight: 6 },
        ],
      };
      const dynamics = [{ axis: "intensity", old_value: 50, new_value: 65, diff: 15 }];
      const retrieval = [{ type: "past", content: "Met in Neo-Stockholm", _relevance: 0.95 }];

      const entry = build_update_entry("Silvers", mutations, dynamics, retrieval);

      expect(entry).toBeDefined();
      expect(entry.name).toBe("Silvers");
      expect(entry.present_mutations).toEqual({
        physical: "Scar on left cheek",
        non_physical: "Wary posture",
      });
      expect(entry.eternal_mutations).toEqual({
        physical: "Tall stature",
        non_physical: "Stoic demeanor",
      });
      expect(entry.vectors.new).toEqual([
        { content: "Distrusts the corporation", emotional_weight: 8 },
        { content: "Prefers the shadows", emotional_weight: 6 },
      ]);
      expect(entry.vectors.retrieval).toEqual(retrieval);
      expect(entry.dynamics).toEqual(dynamics);
    });

    it("accepts and formats flat dynamics deltas without dropping data", () => {
      const dynamics = [{ axis: "chaos", old_value: 40, new_value: 55, diff: 15 }];
      const entry = build_update_entry("Aethelgard", null, dynamics, []);

      expect(entry).toBeDefined();
      expect(entry.name).toBe("Aethelgard");
      expect(entry.dynamics).toEqual(dynamics);
    });
  });

  describe("build_retrieval()", () => {
    it("strips embeddings and internal scores while sorting by _relevance descending", () => {
      const raw_vectors = [
        { content: "Low relevance memory", _relevance: 0.42, _embedding: [0.1, 0.2], _semantic_score: 0.3 },
        { content: "High relevance memory", _relevance: 0.88, _embedding: [0.3, 0.4], _recency_factor: 1.0 },
      ];

      const cleaned = build_retrieval(raw_vectors);

      expect(cleaned).toHaveLength(2);
      expect(cleaned[0].content).toBe("High relevance memory");
      expect(cleaned[0]._embedding).toBeUndefined();
      expect(cleaned[0]._recency_factor).toBeUndefined();
      expect(cleaned[1].content).toBe("Low relevance memory");
    });
  });

  describe("build_turn_summary()", () => {
    it("summarizes message counts by role in the recent feed tail", () => {
      const feed = [
        { role: "user", text: "Hello" },
        { role: "ai", text: "Greetings" },
        { role: "npc", text: "Who goes there?" },
        { role: "model", text: "Observing..." },
        { role: "system", text: "Ignore system" },
      ];

      const summary = build_turn_summary(feed, 4);
      expect(summary).toContain("Turn 4 complete");
      expect(summary).toContain("user×1");
      expect(summary).toContain("ai×2");
      expect(summary).toContain("npc×1");
      expect(summary).not.toContain("system");
    });
  });

  describe("capture_dynamics_delta()", () => {
    it("detects dynamics shifts and logs structured DYNAMICS_DELTA entries", async () => {
      const logged_entries = [];
      const bridge = {
        runtime: {
          ai: { intensity: 50, chaos: 50 },
          fractal: { entropy: 50, velocity: 50 },
          active_ai: { id: "char-1", name: "Silvers" },
          active_fractal: { id: "frac-1", name: "The Spire" },
          active_user: { name: "Operator" },
          update_entity: async () => {},
        },
        session_driver: {
          log_system_entry: async (log, type, payload) => {
            logged_entries.push({ log, type, payload });
          },
        },
      };

      const snapshot = {
        ai: { name: "Silvers", dynamics: { intensity: 65, chaos: 50 } },
        fractal: { name: "The Spire", dynamics: { entropy: 50, velocity: 60 } },
      };

      const meta = {
        mutations: {
          AI_CHARACTER: { intensity: 15 },
          FRACTAL: { velocity: 10 },
        },
        trigger_image: true,
        image_trigger: "entropy_shift",
      };

      await capture_dynamics_delta(bridge, snapshot, meta);

      expect(logged_entries.length).toBe(1);
      expect(logged_entries[0].payload.type).toBe("DYNAMICS_DELTA");
      expect(logged_entries[0].payload.trigger_image).toBe(true);
      expect(logged_entries[0].payload.updates.AI_CHARACTER).toBeDefined();
      expect(logged_entries[0].payload.updates.AI_CHARACTER.dynamics).toEqual([{ axis: "intensity", old_value: 50, new_value: 65, diff: 15 }]);
      expect(logged_entries[0].payload.updates.FRACTAL.dynamics).toEqual([{ axis: "velocity", old_value: 50, new_value: 60, diff: 10 }]);
    });
  });
});
