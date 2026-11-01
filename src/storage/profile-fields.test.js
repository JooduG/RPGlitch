import { describe, it, expect } from "vitest";
import { FLAT_LEAF_MAP, resolve_flat_path, ENHANCER_DIRECTIVES } from "./profile-fields.js";

describe("src/storage/profile-fields.js — Profile Fields & Enhancers", () => {
  describe("FLAT_LEAF_MAP & resolve_flat_path", () => {
    it("maps character aliases to canonical dot-notation paths", () => {
      expect(resolve_flat_path("appearance", "character")).toBe("eternal.physical");
      expect(resolve_flat_path("personality", "character")).toBe("eternal.non_physical");
      expect(resolve_flat_path("current_look", "character")).toBe("present.physical");
      expect(resolve_flat_path("state_of_mind", "character")).toBe("present.non_physical");
      expect(resolve_flat_path("future", "character")).toBe("future");
      expect(resolve_flat_path("past", "character")).toBe("past");
    });

    it("maps fractal aliases to canonical dot-notation paths", () => {
      expect(resolve_flat_path("environment", "fractal")).toBe("eternal.physical");
      expect(resolve_flat_path("permanent_truths", "fractal")).toBe("eternal.non_physical");
      expect(resolve_flat_path("atmosphere", "fractal")).toBe("present.physical");
      expect(resolve_flat_path("current_state", "fractal")).toBe("present.non_physical");
      expect(resolve_flat_path("future", "fractal")).toBe("future");
      expect(resolve_flat_path("past", "fractal")).toBe("past");
    });

    it("returns null for unknown keys", () => {
      expect(resolve_flat_path("non_existent_field", "character")).toBeNull();
      expect(resolve_flat_path("unknown", "fractal")).toBeNull();
      expect(resolve_flat_path(null, "character")).toBeNull();
    });

    it("exports FLAT_LEAF_MAP partitioned or accessible by entity type", () => {
      expect(FLAT_LEAF_MAP).toBeDefined();
      expect(typeof FLAT_LEAF_MAP.character).toBe("object");
      expect(typeof FLAT_LEAF_MAP.fractal).toBe("object");
    });
  });

  describe("ENHANCER_DIRECTIVES", () => {
    it("exports enhancer directives matching canonical roles", () => {
      expect(ENHANCER_DIRECTIVES.BIOMETRIC_RENDERER).toBeDefined();
      expect(ENHANCER_DIRECTIVES.COGNITIVE_ARCHITECT).toBeDefined();
      expect(ENHANCER_DIRECTIVES.SOMATIC_TRACKER).toBeDefined();
      expect(ENHANCER_DIRECTIVES.TACTICAL_ANALYZER).toBeDefined();
      expect(ENHANCER_DIRECTIVES.TRAJECTORY_SIMULATOR).toBeDefined();
      expect(ENHANCER_DIRECTIVES.PAST_COMPILER).toBeDefined();
      expect(ENHANCER_DIRECTIVES.SPATIAL_RENDERER).toBeDefined();
      expect(ENHANCER_DIRECTIVES.METAPHYSICAL_ARCHITECT).toBeDefined();
      expect(ENHANCER_DIRECTIVES.ATMOSPHERIC_TRACKER).toBeDefined();
      expect(ENHANCER_DIRECTIVES.ECOSYSTEM_ANALYZER).toBeDefined();
      expect(ENHANCER_DIRECTIVES.ECOSYSTEM_SIMULATOR).toBeDefined();
      expect(ENHANCER_DIRECTIVES.HISTORIAN).toBeDefined();
    });
  });
});
