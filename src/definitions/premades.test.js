/**
 * ============================================================================
 * src/definitions/premades.test.js
 * 🧪 TESTS FOR PREMADE ENTITIES REGISTRY & QUERY PRIMITIVES
 * ============================================================================
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_PREMADES,
  get_premade_characters,
  get_premade_entity_by_id,
  get_premade_fractals,
  has_premade_entity,
  PREMADE_CHARACTERS,
  PREMADE_ENTITY_MAP,
  PREMADE_FRACTALS,
} from "./premades.js";
import { NARRATIVE_STYLES } from "./narrative-styles.js";
import { VISUAL_STYLES } from "./visual-styles.js";

describe("premades registry", () => {
  it("exports frozen immutable arrays and maps", () => {
    expect(Array.isArray(PREMADE_CHARACTERS)).toBe(true);
    expect(Object.isFrozen(PREMADE_CHARACTERS)).toBe(true);
    expect(Array.isArray(PREMADE_FRACTALS)).toBe(true);
    expect(Object.isFrozen(PREMADE_FRACTALS)).toBe(true);
    expect(Array.isArray(ALL_PREMADES)).toBe(true);
    expect(Object.isFrozen(ALL_PREMADES)).toBe(true);
    expect(PREMADE_ENTITY_MAP instanceof Map).toBe(true);
  });

  it("contains unique IDs across all premade entities", () => {
    const ids = ALL_PREMADES.map((entity) => entity.id);
    const unique_ids = new Set(ids);
    expect(unique_ids.size).toBe(ids.length);
    expect(PREMADE_ENTITY_MAP.size).toBe(ids.length);
  });

  it("assigns 1st_person POV to all characters and 3rd_person POV to all fractals", () => {
    expect(PREMADE_CHARACTERS.length).toBe(7);
    for (const character of PREMADE_CHARACTERS) {
      expect(character.type).toBe("character");
      expect(character.pov).toBe("1st_person");
      expect(Object.keys(VISUAL_STYLES)).toContain(character.visual_style);
    }

    expect(PREMADE_FRACTALS.length).toBe(3);
    for (const fractal of PREMADE_FRACTALS) {
      expect(fractal.type).toBe("fractal");
      expect(fractal.pov).toBe("3rd_person");
      expect(Object.keys(VISUAL_STYLES)).toContain(fractal.visual_style);
      expect(Object.keys(NARRATIVE_STYLES)).toContain(fractal.narrative_style);
    }
  });

  it("retrieves entities case-insensitively via query primitives", () => {
    expect(get_premade_entity_by_id("orion")?.name).toBe("Orion the Pink Protector");
    expect(get_premade_entity_by_id("SILVERS")?.id).toBe("silvers");
    expect(get_premade_entity_by_id("unknown_id")).toBeNull();
    expect(has_premade_entity("TARTARUS")).toBe(true);
    expect(has_premade_entity("nonexistent")).toBe(false);
    expect(get_premade_characters().length).toBe(PREMADE_CHARACTERS.length);
    expect(get_premade_fractals().length).toBe(PREMADE_FRACTALS.length);
  });

  it("never leaks premade catalog imports into runtime code outside src/data/db.js", () => {
    const src_root = resolve(process.cwd(), "src");
    const premade_symbol_pattern =
      /\b(ALL_PREMADES|PREMADE_CHARACTERS|PREMADE_FRACTALS|PREMADE_ENTITY_MAP|ORION_NOVA_GLITCH_STORY|get_premade_entity_by_id|has_premade_entity|get_premade_characters|get_premade_fractals)\b/;

    const collect_files = (dir) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        const full_path = join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...collect_files(full_path));
        } else if (/\.(js|svelte)$/.test(entry.name) && !entry.name.endsWith(".test.js")) {
          files.push(full_path);
        }
      }
      return files;
    };

    const allowed_suffixes = ["src/data/entity-repository.js", "src/definitions/"];
    const violations = [];
    for (const file_path of collect_files(src_root)) {
      const normalized_path = file_path.replace(/\\/g, "/");
      if (allowed_suffixes.some((suffix) => normalized_path.includes(suffix))) continue;
      const content = readFileSync(file_path, "utf8");
      if (premade_symbol_pattern.test(content)) {
        violations.push(normalized_path);
      }
    }

    expect(violations).toEqual([]);
  });
});
