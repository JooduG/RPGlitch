/**
 * ============================================================================
 * src/data/definitions/premade-entities.test.js
 * 🧪 TESTS FOR PREMADE ENTITIES REGISTRY & QUERY PRIMITIVES
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import {
  PREMADE_CHARACTERS,
  PREMADE_FRACTALS,
  PREMADE_ENTITIES,
  PREMADE_ENTITY_MAP,
  premade,
  get_premade_entity_by_id,
  has_premade_entity,
  get_premade_characters,
  get_premade_fractals,
} from "./premade-entities.js";
import { SIGNATURE_COLORS } from "./signature-colors.js";
import { VISUAL_STYLES } from "./visual-styles.js";
import { SPEAKING_STYLES } from "./speaking-styles.js";
import { NARRATIVE_STYLES } from "./narrative-styles.js";

describe("premade-entities registry", () => {
  it("exports frozen immutable arrays and maps", () => {
    expect(Array.isArray(PREMADE_CHARACTERS)).toBe(true);
    expect(Object.isFrozen(PREMADE_CHARACTERS)).toBe(true);
    expect(Array.isArray(PREMADE_FRACTALS)).toBe(true);
    expect(Object.isFrozen(PREMADE_FRACTALS)).toBe(true);
    expect(Array.isArray(PREMADE_ENTITIES)).toBe(true);
    expect(Object.isFrozen(PREMADE_ENTITIES)).toBe(true);
    expect(PREMADE_ENTITY_MAP instanceof Map).toBe(true);
    expect(premade.entities).toBe(PREMADE_ENTITIES);
  });

  it("contains unique IDs across all premade entities", () => {
    const ids = PREMADE_ENTITIES.map((entity) => entity.id);
    const unique_ids = new Set(ids);
    expect(unique_ids.size).toBe(ids.length);
    expect(PREMADE_ENTITY_MAP.size).toBe(ids.length);
  });

  it("has valid schema for every character blueprint", () => {
    expect(PREMADE_CHARACTERS.length).toBeGreaterThan(0);
    for (const character of PREMADE_CHARACTERS) {
      expect(character.id).toBeTruthy();
      expect(character.name).toBeTruthy();
      expect(character.type).toBe("character");
      expect(character.description).toBeTruthy();
      expect(character.profile_picture).toMatch(/^https?:\/\//);
      expect(SIGNATURE_COLORS).toContain(character.signature_color);
      expect(Object.keys(VISUAL_STYLES)).toContain(character.visual_style);
      expect(SPEAKING_STYLES).toContain(character.speaking_style);
      expect(character.voice).toBeDefined();
      expect(character.voice.name).toBeTruthy();
      expect(character.voice.cadence).toBeTruthy();

      // Dynamics verification
      expect(character.dynamics).toBeDefined();
      expect(typeof character.dynamics.chaos).toBe("number");
      expect(typeof character.dynamics.intensity).toBe("number");
      expect(typeof character.dynamics.openness).toBe("number");
      expect(typeof character.dynamics.affinity).toBe("number");

      // 4-Fragment verification
      expect(character.eternal?.physical).toBeTruthy();
      expect(character.eternal?.non_physical).toBeTruthy();
      expect(character.present?.physical).toBeTruthy();
      expect(character.present?.non_physical).toBeTruthy();
      expect(character.future).toBeTruthy();
      expect(Array.isArray(character.relationships)).toBe(true);

      // Past memory verification
      expect(Array.isArray(character.past)).toBe(true);
      for (const memory of character.past) {
        expect(memory.id).toBeTruthy();
        expect(memory.content).toBeTruthy();
        expect(memory.meta?.origin).toBe(true);
      }
    }
  });

  it("has valid schema for every fractal blueprint", () => {
    expect(PREMADE_FRACTALS.length).toBeGreaterThan(0);
    for (const fractal of PREMADE_FRACTALS) {
      expect(fractal.id).toBeTruthy();
      expect(fractal.name).toBeTruthy();
      expect(fractal.type).toBe("fractal");
      expect(fractal.description).toBeTruthy();
      expect(fractal.profile_picture).toMatch(/^https?:\/\//);
      expect(SIGNATURE_COLORS).toContain(fractal.signature_color);
      expect(Object.keys(VISUAL_STYLES)).toContain(fractal.visual_style);
      expect(Object.keys(NARRATIVE_STYLES)).toContain(fractal.narrative_style);
      expect(fractal.voice).toBeDefined();
      expect(fractal.voice.name).toBeTruthy();
      expect(fractal.voice.cadence).toBeTruthy();

      // Dynamics verification
      expect(fractal.dynamics).toBeDefined();
      expect(typeof fractal.dynamics.velocity).toBe("number");
      expect(typeof fractal.dynamics.entropy).toBe("number");

      // 4-Fragment verification
      expect(fractal.eternal?.physical).toBeTruthy();
      expect(fractal.eternal?.non_physical).toBeTruthy();
      expect(fractal.present?.physical).toBeTruthy();
      expect(fractal.present?.non_physical).toBeTruthy();
      expect(fractal.future).toBeTruthy();
      expect(Array.isArray(fractal.relationships)).toBe(true);

      // Past memory verification
      expect(Array.isArray(fractal.past)).toBe(true);
      for (const memory of fractal.past) {
        expect(memory.id).toBeTruthy();
        expect(memory.content).toBeTruthy();
        expect(memory.meta?.origin).toBe(true);
      }
    }
  });

  describe("query primitives", () => {
    it("retrieves entity by ID via get_premade_entity_by_id", () => {
      const orion = get_premade_entity_by_id("orion");
      expect(orion).toBeDefined();
      expect(orion?.name).toBe("Orion the Pink Protector");

      const nova = get_premade_entity_by_id("nova");
      expect(nova).toBeDefined();
      expect(nova?.name).toBe("Nova City");

      expect(get_premade_entity_by_id("unknown_id")).toBeNull();
      expect(get_premade_entity_by_id("")).toBeNull();
      expect(get_premade_entity_by_id(null)).toBeNull();
    });

    it("checks existence via has_premade_entity", () => {
      expect(has_premade_entity("orion")).toBe(true);
      expect(has_premade_entity("nova")).toBe(true);
      expect(has_premade_entity("glitch")).toBe(true);
      expect(has_premade_entity("nonexistent")).toBe(false);
      expect(has_premade_entity("")).toBe(false);
      expect(has_premade_entity(null)).toBe(false);
    });

    it("returns subset lists via get_premade_characters and get_premade_fractals", () => {
      const characters = get_premade_characters();
      expect(characters.every((c) => c.type === "character")).toBe(true);
      expect(characters.length).toBe(PREMADE_CHARACTERS.length);

      const fractals = get_premade_fractals();
      expect(fractals.every((f) => f.type === "fractal")).toBe(true);
      expect(fractals.length).toBe(PREMADE_FRACTALS.length);
    });
  });
});
