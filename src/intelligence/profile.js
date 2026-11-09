/**
 * src/intelligence/profile.js
 * 🧬 PROFILE DOMAIN — Structuring, Entity Mapping & Character Genesis
 *
 * Sovereign domain file combining profile structuring, entity schema hydration,
 * and character genesis orchestration:
 * 1. Profile Structuring & Schema Mapper (structure_profile, apply_profile_to_entity)
 * 2. Character Genesis & Active Cast Spawning (spawn_character)
 */

import { generate_uuid, state_bridge } from "@utils";
import { FLAT_LEAF_MAP } from "../definitions/profile-fields.js";
import { stories } from "@storage";
import { temporal_engine } from "./temporal.js";
import { birth_entity_core as storage_birth_entity_core, structure_profile as storage_structure_profile } from "@storage";

export const birth_entity_core = storage_birth_entity_core;
export const structure_profile = storage_structure_profile;

// ── 1. Profile Structuring & Schema Mapper ────────────────────────────────────

/**
 * Applies a flat structured profile onto a freshly created entity, mapping flat
 * keys onto the nested Twin-Cylinder schema. Mutates and returns `entity`.
 *
 * @param {any} entity
 * @param {Object} profile
 * @returns {any}
 */
export function apply_profile_to_entity(entity, profile) {
  if (!profile || typeof profile !== "object") return entity;

  for (const [key, value] of Object.entries(profile)) {
    // Identity/asset keys are set by the orchestrator, never by the profile.
    if (key === "profile_picture" || key === "image" || key === "id" || key === "type") continue;

    if (key === "past") {
      // PAST accepts prose lists or a flat bracket string; the entity pool may be
      // a legacy vector array or a Veil bracket string — merge without type flips.
      const incoming_items = Array.isArray(value) ? value : typeof value === "string" ? [value] : null;
      if (incoming_items) {
        const cleaned_texts = incoming_items
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") return item.content || item.directive || JSON.stringify(item);
            return "";
          })
          .map((text) => String(text || "").trim())
          .filter(Boolean);
        if (cleaned_texts.length > 0) {
          if (typeof entity.past === "string") {
            const current_text = entity.past.trim();
            entity.past = current_text ? `${current_text} ${cleaned_texts.join(" ")}` : cleaned_texts.join(" ");
          } else {
            const new_vectors = cleaned_texts.map((vector_string) => ({
              ...temporal_engine.create(vector_string, key),
              id: `usr_${generate_uuid()}`,
              emotional_weight: 5,
            }));
            entity.past = [...(Array.isArray(entity.past) ? entity.past : []), ...new_vectors];
          }
        }
      }
    } else if (key === "future" && typeof value === "string") {
      entity.future = value.trim();
    } else if (key === "tags" && Array.isArray(value)) {
      entity.tags = value
        .map((tag) => String(tag).trim())
        .filter(Boolean)
        .slice(0, 30);
    } else if (typeof value === "object" && !Array.isArray(value)) {
      // Nested flat objects → shallow-copy their string leaves.
      for (const [sub_key, sub_value] of Object.entries(value)) {
        if (typeof sub_value === "string") {
          if (!entity[key]) entity[key] = {};
          entity[key][sub_key] = sub_value;
        }
      }
    } else if (typeof value === "string") {
      // Flat LLM keys → nested DB schema; everything else lands verbatim.
      if (FLAT_LEAF_MAP[key]) {
        const [main_key, sub_key] = FLAT_LEAF_MAP[key].split(".");
        if (!entity[main_key]) entity[main_key] = {};
        entity[main_key][sub_key] = value;
      } else if (key === "name") {
        entity.name = value.trim().slice(0, 80);
      } else {
        entity[key] = value;
      }
    }
  }

  return entity;
}

// ── 2. Unified Entity Birth Core (Re-exported from @storage) ──────────────────

// ── 3. Character Genesis & Active Cast Spawning ───────────────────────────────

/**
 * Spawns a new roster character, persists it to Dexie DB,
 * registers it on the active story cast, and puts it on-stage.
 *
 * @param {any} bridge
 * @param {{ name: string, description?: string, relationships?: string[], speaking_style?: string, signature_color?: string, scene_context?: string }} [draft]
 * @returns {Promise<any | null>}
 */
export async function spawn_character(bridge, draft = {}) {
  const name = String(draft?.name || "").trim();
  if (!name) return null;

  const saved_entity = await birth_entity_core("character", draft, {
    story_id: bridge.runtime?.story_id,
    run_sorter: true,
  });

  // 4. Register on active story
  const story_id = bridge.runtime?.story_id;
  if (story_id && story_id !== "debug") {
    try {
      const story = await stories.get(story_id);
      const npc_ids = [...new Set([...(story?.npc_ids || []), saved_entity.id])];
      if (npc_ids.length !== (story?.npc_ids || []).length) {
        await stories.update_cast(story_id, npc_ids);
      }
    } catch (err) {
      state_bridge.app?.log(`[GameMaster] Failed to register NPC on the story: ${err?.message || err}`, "warn");
    }
  }

  // 5. Hydrate into active runtime state & stage spotlight (Track 1.3: presence 'active')
  const npcs = { ...(bridge.runtime?.active_npcs || {}) };
  npcs[saved_entity.id] = { ...saved_entity, presence: "active" };
  if (bridge.runtime) {
    bridge.runtime.active_npcs = npcs;
  }
  state_bridge.app?.log(`[GameMaster] Roster expanded: ${name}.`, "system");
  return saved_entity;
}

/**
 * CHANGELOG
 * - 2026-10-16: Import reliability — `structure_profile` coerces the enhance() result to a primitive string before parsing (the raw:true engine path returns a boxed String object that the JSON parser rejects, silently voiding every sort).
 * - 2026-10-03: Hardened Ledger Integration — `birth_entity_core` now emits genesis ledger entries across all populated four-quadrant fields (`eternal.physical`, `eternal.non_physical`, `present.physical`, `present.non_physical`, `past`, `future`) with `writer: "genesis"` and `decider: "genesis"`.
 * - 2026-10-01: Universal Predicates Migration — purged legacy `relationships: []` array initialization from `spawn_character` under P4 Zero Backwards Compatibility.
 * - 2026-09-22: One input channel (recommendation #5) — `structure_profile` delivers the raw profile text through `<INPUT kind="ingestion">` via `render_profile_sorting({ input_data })` instead of a `messages` payload.
 * - 2026-09-11: Header correction — PROFILE_PROTOCOLS bundle pruned in favour of the modules/task.js primitives.
 * - 2026-09-11: Grand Purification: prompt compilation moved to builder.js, leaving profile.js a 100% pure structuring, entity mapping, and genesis engine.
 * - 2026-09-11: Modularized PROFILE_PROTOCOLS: bound SCHEMA, MACROS, SORTING, and OUTPUT_FORMATS to modular imports.
 * - 2026-09-11: Consolidated profile-pipeline.js and profile-prompts.js into profile.js, unifying structuring, entity mapping, genesis, and field enhancement prompt compilers into a single domain file.
 * - 2026-09-10: Redundancy sweep. render_enhancement_field_context is module-private (only render_enhancement consumes it).
 * - 2026-09-06: Modernized PROFILE_PROTOCOLS with inline JSON schema template, consolidated OUTPUT_FORMATS, and deep freeze.
 * - 2026-08-28: Ground-up deconstruct & refactor: streamlined field context rendering, standardized parameter naming, and removed redundant string/regex wrappers.
 */
