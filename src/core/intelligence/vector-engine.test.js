import { describe, expect, it, vi } from "vitest";
import { CONFIG } from "../engine/config.js";
import { VectorEngine } from "./vector-engine.js";
vi.mock("./dynamics-engine.js", () => ({
  DynamicsEngine: {
    dynamics_scan: vi.fn(() => [{ id: "VIBE_CHECK", scan: "vibe" }]),
  },
}));
describe("VectorEngine", () => {
  describe("create_vector", () => {
    it("creates a flat vector object — no score wrapper, no summary", () => {
      const vector = VectorEngine.create_vector("He felt a strange vibe.");
      expect(vector).toHaveProperty("id");
      expect(vector.text).toBe("He felt a strange vibe.");
      expect(vector).not.toHaveProperty("score");
      expect(vector).not.toHaveProperty("summary");
      expect(vector.dynamics_tags[0].id).toBe("VIBE_CHECK");
      expect(Array.isArray(vector.vector_tags)).toBe(true);
      expect(typeof vector.timestamp).toBe("number");
    });
    it("defaults to Weight Baseline for plain input", () => {
      const vector = VectorEngine.create_vector("They talked for a while.");
      expect(vector.emotional_weight).toBe(5);
    });
  });
  describe("score_vectors", () => {
    it("calculates relevance: base weight + bonuses (+1 ID, +2 Word, +3 Tag)", async () => {
      const { DynamicsEngine } = await import("./dynamics-engine.js");
      // Mock dynamics_scan to return a match with trigger word
      vi.mocked(DynamicsEngine.dynamics_scan).mockReturnValue([{ id: "EXPOSURE", scan: "kiss" }]);
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
      // - Vector Tag: Iron (+3)
      // - Base Weight: 5
      // Total: 11
      const ranked = VectorEngine.score_vectors(vectors, "Iron kiss");
      const expected =
        5 +
        CONFIG.DYNAMICS.RELEVANCE_DYNAMICS_BONUS +
        CONFIG.DYNAMICS.RELEVANCE_TRIGGER_BONUS +
        CONFIG.DYNAMICS.RELEVANCE_VECTOR_BONUS;
      expect(ranked[0]._relevance).toBe(expected);
    });
    it("grants +1 for Vibe (ID) match but skip +2 if trigger word differs", async () => {
      const { DynamicsEngine } = await import("./dynamics-engine.js");
      // Input "hug" matches EXPOSURE id, but trigger word is "hug"
      vi.mocked(DynamicsEngine.dynamics_scan).mockReturnValue([{ id: "EXPOSURE", scan: "hug" }]);
      const vectors = [
        {
          id: 1,
          dynamics_tags: [{ id: "EXPOSURE", word: "kiss" }], // Memory was triggered by "kiss"
          vector_tags: [],
          text: "A",
          emotional_weight: 5,
          timestamp: 100,
        },
      ];
      const ranked = VectorEngine.score_vectors(vectors, "hug");
      // EXPECTED: 5 (base) + 1 (Vibe bonus) + 0 (Trigger bonus) = 6
      expect(ranked[0]._relevance).toBe(6);
    });
    it("uses timestamp as a tie-breaker for identical relevance", () => {
      const vectors = [
        {
          id: "old",
          emotional_weight: 5,
          timestamp: 1000,
          vector_tags: [],
          dynamics_tags: [],
        },
        {
          id: "new",
          emotional_weight: 5,
          timestamp: 2000,
          vector_tags: [],
          dynamics_tags: [],
        },
      ];
      const ranked = VectorEngine.score_vectors(vectors, "nothing");
      expect(ranked[0].id).toBe("new");
    });
    it("high emotional weight outscores low weight even with less matches", async () => {
      const { DynamicsEngine } = await import("./dynamics-engine.js");
      vi.mocked(DynamicsEngine.dynamics_scan).mockReturnValue([]);
      const vectors = [
        {
          id: "low",
          dynamics_tags: [],
          vector_tags: ["Iron"],
          text: "A",
          emotional_weight: 3,
          timestamp: 100,
        },
        {
          id: "high",
          dynamics_tags: [],
          vector_tags: [],
          text: "B",
          emotional_weight: 10,
          timestamp: 100,
        },
      ];
      // low: 3 + 3 (Vector Bonus) = 6
      // high: 10 + 0 = 10
      const ranked = VectorEngine.score_vectors(vectors, "Iron");
      expect(ranked[0].id).toBe("high");
      expect(ranked[0]._relevance).toBe(10);
    });
  });
  describe("formatting", () => {
    it("labels Core Threshold vectors as CORE_VECTOR", () => {
      const past = [
        {
          text: "She died.",
          dynamics_tags: [],
          vector_tags: [],
          emotional_weight: 10,
        },
      ];
      const result = VectorEngine.format_past(past, "");
      expect(result).toContain("[CORE_VECTOR]: She died.");
    });
    it("labels Major Threshold vectors as MAJOR_VECTOR", () => {
      const past = [
        {
          text: "He betrayed me.",
          dynamics_tags: [],
          vector_tags: [],
          emotional_weight: 8,
        },
      ];
      const result = VectorEngine.format_past(past, "");
      expect(result).toContain("[MAJOR_VECTOR]: He betrayed me.");
    });
    it("labels vectors below Significant Threshold as VECTOR_ECHO", () => {
      const past = [
        {
          text: "Met a traveler.",
          dynamics_tags: [],
          vector_tags: [],
          emotional_weight: 6,
        },
      ];
      const result = VectorEngine.format_past(past, "");
      expect(result).toContain("[VECTOR_ECHO]: Met a traveler.");
    });
    it("labels Significant Threshold future vector as VECTOR", () => {
      const future = [
        {
          text: "Find the key.",
          dynamics_tags: [],
          vector_tags: [],
          emotional_weight: 7,
        },
      ];
      const result = VectorEngine.format_future(future, "");
      expect(result).toContain("[VECTOR]: Find the key.");
    });
    it("supports vector_text option to return raw text only", () => {
      const past = [{ text: "Strict content.", emotional_weight: 10 }];
      const result = VectorEngine.format_past(past, "", 1, 0, {
        vector_text: true,
        vector_label: false,
      });
      expect(result).toBe("Strict content.");
    });
    it("supports vector_label option to return label only", () => {
      const past = [{ text: "Strict content.", emotional_weight: 10 }];
      const result = VectorEngine.format_past(past, "", 1, 0, {
        vector_text: false,
        vector_label: true,
      });
      expect(result).toBe("CORE_VECTOR");
    });
    it("defaults to full [LABEL]: text format if no options provided", () => {
      const past = [{ text: "Merged content.", emotional_weight: 7 }];
      const result = VectorEngine.format_past(past, "", 1, 0);
      expect(result).toBe("[VECTOR]: Merged content.");
    });
  });
  describe("resolve_vector", () => {
    it("moves a future vector to past with a resolution tag", () => {
      const entity = {
        future: [{ id: "v1", text: "Goal", vector_tags: [] }],
        past: [],
      };
      VectorEngine.resolve_vector(entity, "v1", "SUCCESS");
      expect(entity.future).toHaveLength(0);
      expect(entity.past).toHaveLength(1);
      expect(entity.past[0].text).toBe("Goal");
      expect(entity.past[0].vector_tags).toContain("RESOLUTION:SUCCESS");
    });
  });
});
