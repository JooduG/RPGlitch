/**
 * src/intelligence/profile.js
 * 🧬 PROFILE PIPELINE — LLM sorting + flat-profile application
 *
 * The "shape" step of the content-import pipeline. Raw source prose becomes a
 * flat sorted profile (sort_into_profile); that flat profile — whether it came
 * from the LLM sorter or a Character Card codec (@data/cards.js) — is then
 * applied onto a fresh Twin-Cylinder entity (apply_profile_to_entity).
 *
 * One shape in, one application function out: the import orchestrator never
 * thinks about schema mapping.
 */

import { parse_profile_json } from "./parser.js";
import { prompt_builder } from "./prompts.js";
import { temporal_engine } from "./temporal.js";
import { llm_service } from "@platform";
import { generate_uuid } from "@utils";

/** Flat profile keys that map onto a nested Twin-Cylinder leaf. */
const FLAT_LEAF_MAP = {
  appearance: "eternal.physical",
  personality: "eternal.non_physical",
  current_look: "present.physical",
  state_of_mind: "present.non_physical",
};

/**
 * Runs the LLM ingestion sorter over raw prose and returns the flat sorted
 * profile. Returns null when the LLM fails to sort — the import is silently
 * skipped (lenient by design).
 * @param {string} raw
 * @param {'character' | 'fractal'} type
 * @returns {Promise<Object | null>}
 */
export async function sort_into_profile(raw, type) {
  const payload = prompt_builder.build_profile_sorting_prompt(raw, type, { ingestion: true });
  const result = await llm_service.enhance(payload);
  return parse_profile_json(result);
}

/**
 * Applies a flat sorted profile onto a freshly created entity, mapping flat
 * keys onto the nested Twin-Cylinder schema. Mutates and returns `entity`.
 * @param {any} entity
 * @param {Object} profile
 * @returns {any}
 */
export function apply_profile_to_entity(entity, profile) {
  if (!profile || typeof profile !== "object") return entity;

  for (const [key, val] of Object.entries(profile)) {
    // Identity/asset keys are set by the orchestrator, never by the profile.
    if (key === "profile_picture" || key === "image" || key === "id" || key === "type") continue;

    if (key === "past") {
      // PAST is a vector array — each prose entry becomes a pinned memory.
      if (Array.isArray(val)) {
        const new_vectors = val
          .map((text_str) => {
            const vector_str = typeof text_str === "string" ? text_str : text_str.content || text_str.directive || JSON.stringify(text_str);
            if (!vector_str || !String(vector_str).trim()) return null;
            return {
              ...temporal_engine.create(vector_str, key),
              id: `usr_${generate_uuid()}`,
              emotional_weight: 5,
            };
          })
          .filter(Boolean);
        entity.past = [...(entity.past || []), ...new_vectors];
      }
    } else if (key === "future" && typeof val === "string") {
      // FUTURE is a prose field — import the flat text.
      entity.future = val.trim();
    } else if (key === "tags" && Array.isArray(val)) {
      entity.tags = val
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, 30);
    } else if (typeof val === "object" && !Array.isArray(val)) {
      // Nested flat objects → shallow-copy their string leaves.
      for (const [sub_key, subVal] of Object.entries(val)) {
        if (typeof subVal === "string") {
          if (!entity[key]) entity[key] = {};
          entity[key][sub_key] = subVal;
        }
      }
    } else if (typeof val === "string") {
      // Flat LLM keys → nested DB schema; everything else lands verbatim.
      if (FLAT_LEAF_MAP[key]) {
        const [main_key, sub_key] = FLAT_LEAF_MAP[key].split(".");
        if (!entity[main_key]) entity[main_key] = {};
        entity[main_key][sub_key] = val;
      } else if (key === "name") {
        entity.name = val.trim().slice(0, 80);
      } else {
        entity[key] = val;
      }
    }
  }
  return entity;
}
