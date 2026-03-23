import { describe, expect, it, vi } from "vitest";
import { CONFIG } from "../engine/config.js";
import { vector_engine } from "./vector-engine.js";

vi.mock("./dynamics-engine.js", () => ({
  dynamics_engine: {
    dynamics_scan: vi.fn(() => [{ id: "VIBE_CHECK", scan: "vibe" }]),
  },
}));

describe("vector_engine", () => {
  describe("create_vector", () => {
    it("creates a flat vector object — no score wrapper, no summary", () => {
      const vector = vector_engine.create_vector("He felt a strange vibe.");
      expect(vector).toHaveProperty("id");
      expect(vector.text).toBe("He felt a strange vibe.");
      expect(vector).not.toHaveProperty("score");
      expect(vector).not.toHaveProperty("summary");
      expect(vector.dynamics_tags[0].id).toBe("VIBE_CHECK");
      expect(Array.isArray(vector.vector_tags)).toBe(true);
      expect(typeof vector.timestamp).toBe("number");
    });

    it("defaults to Weight Baseline for plain input", () => {
      const vector = vector_engine.create_vector("They talked for a while.");
      expect(vector.emotional_weight).toBe(5);
    });
  });

  describe("score_vectors", () => {
    it("calculates relevance: base weight + bonuses (+1 ID, +2 Word, +3 Tag)", async () => {
      const { dynamics_engine } = await import("./dynamics-engine.js");
      vi.mocked(dynamics_engine.dynamics_scan).mockReturnValue([{ id: "EXPOSURE", scan: "kiss" }]);

      const vectors = [
        {
          id: 1,
          dynamics_tags: [{ id: "EXPOSURE", word: "kiss" }],
          vector_tags: ["Iron"],
          text: "A",
          emotional_weight: 5,
          timestamp: 100,
        },
      ];

      const ranked = vector_engine.score_vectors(vectors, "Iron kiss");
      const expected =
        5 +
        CONFIG.DYNAMICS.RELEVANCE_DYNAMICS_BONUS +
        CONFIG.DYNAMICS.RELEVANCE_TRIGGER_BONUS +
        CONFIG.DYNAMICS.RELEVANCE_VECTOR_BONUS;
      expect(ranked[0]._relevance).toBe(expected);
    });

    it("grants +1 for Vibe (ID) match but skip +2 if trigger word differs", async () => {
      const { dynamics_engine } = await import("./dynamics-engine.js");
      vi.mocked(dynamics_engine.dynamics_scan).mockReturnValue([{ id: "EXPOSURE", scan: "hug" }]);

      const vectors = [
        {
          id: 1,
          dynamics_tags: [{ id: "EXPOSURE", word: "kiss" }],
          vector_tags: [],
          text: "A",
          emotional_weight: 5,
          timestamp: 100,
        },
      ];

      const ranked = vector_engine.score_vectors(vectors, "hug");
      expect(ranked[0]._relevance).toBe(6);
    });
  });

  describe("formatting", () => {
    it("labels Core Threshold vectors as CORE_VECTOR", () => {
      const past = [
        { text: "She died.", dynamics_tags: [], vector_tags: [], emotional_weight: 10 },
      ];
      const result = vector_engine.format_past(past, "");
      expect(result).toContain("[CORE_VECTOR]: She died.");
    });

    it("labels Major Threshold vectors as MAJOR_VECTOR", () => {
      const past = [
        { text: "He betrayed me.", dynamics_tags: [], vector_tags: [], emotional_weight: 8 },
      ];
      const result = vector_engine.format_past(past, "");
      expect(result).toContain("[MAJOR_VECTOR]: He betrayed me.");
    });
  });

  describe("resolve_vector", () => {
    it("moves a future vector to past with a resolution tag", () => {
      const entity = {
        future: [{ id: "v1", text: "Goal", vector_tags: [] }],
        past: [],
      };
      vector_engine.resolve_vector(entity, "v1", "SUCCESS");
      expect(entity.future).toHaveLength(0);
      expect(entity.past).toHaveLength(1);
      expect(entity.past[0].text).toBe("Goal");
      expect(entity.past[0].vector_tags).toContain("RESOLUTION:SUCCESS");
    });
  });
});
