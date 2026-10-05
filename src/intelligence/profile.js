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
import { FLAT_LEAF_MAP, entities, stories } from "@data";
import { parse_profile_json } from "./parser.js";
import { temporal_engine } from "./temporal.js";
import { llm_service } from "@platform";
import { compile_prompt } from "./prompts.js";

// ── 1. Profile Structuring & Schema Mapper ────────────────────────────────────

/**
 * Runs the LLM ingestion sorter over raw prose and returns the structured profile.
 * Returns null when the LLM fails to structure (lenient by design).
 *
 * @param {string} raw
 * @param {'character' | 'fractal'} type
 * @returns {Promise<Object | null>}
 */
export async function structure_profile(raw, type) {
  const payload = compile_prompt("sorting", {
    entity_type: type,
    options: { ingestion: true },
    input_data: typeof raw === "string" ? raw : JSON.stringify(raw, null, 2),
  });
  const result = await llm_service.enhance(payload);
  return parse_profile_json(result);
}

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

// ── 2. Unified Entity Birth Core ──────────────────────────────────────────────

/**
 * Common birth core shared across spawn_character and ImportModal.
 * Runs structuring (if prose), maps profile leaves, saves to DB,
 * writes genesis ledger entries, and chains post-save portrait generation.
 *
 * @param {'character' | 'fractal'} type
 * @param {Object} draft
 * @param {Object} [options]
 * @returns {Promise<any>}
 */
export async function birth_entity_core(type, draft = {}, options = {}) {
  const name = String(draft?.name || "").trim();
  const raw_color = String(draft?.signature_color || "").trim();
  const description = String(draft?.description || "").trim();
  const scene_context = String(draft?.scene_context || "").trim();

  let entity = {
    name: name || (type === "fractal" ? "New Fractal" : "New Character"),
    type,
    description,
    eternal: {
      physical: description,
      non_physical: "",
    },
    present: {
      physical: description,
      non_physical: "",
    },
    future: "",
    past: [],
    dynamics: { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
    dynamics_baseline: { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
    speaking_style: draft?.speaking_style || "casual",
    is_wanderer: false,
    signature_color: raw_color || undefined,
  };

  // Run structuring if rich synthesis text is provided
  if (options.run_sorter || (!draft?.eternal && !draft?.present && (name || description))) {
    try {
      const synthesis_source = [
        `Entity Name: ${entity.name}`,
        description ? `Core Concept: ${description}` : "",
        raw_color ? `Signature Color: ${raw_color}` : "",
        scene_context ? `Scene Context & Atmosphere: ${scene_context}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const rich_profile = await structure_profile(synthesis_source, type);
      if (rich_profile && typeof rich_profile === "object") {
        entity = apply_profile_to_entity(entity, rich_profile);
      }
    } catch (error) {
      state_bridge.app?.log(`[GameMaster] Genesis rich synthesis failed for "${name}": ${error?.message || error}`, "warn");
    }
  } else if (draft && typeof draft === "object") {
    entity = apply_profile_to_entity(entity, draft);
  }

  if (name) entity.name = name;
  if (raw_color) entity.signature_color = raw_color;

  const saved_entity = await entities.upsert(type, entity);

  // Write Genesis Ledger Entries for all populated quadrant fields
  const { append_ledger_entries } = await import("@data");
  const story_id = options.story_id ?? state_bridge.runtime?.story_id ?? null;
  const ledger_lines = [];

  const record_genesis_field = (field_path, value) => {
    if (!value) return;
    const string_value = Array.isArray(value) ? JSON.stringify(value) : typeof value === "object" ? JSON.stringify(value) : String(value);
    if (!string_value.trim()) return;
    ledger_lines.push({
      story_id,
      round: 0,
      seq: 0,
      entity_id: saved_entity.id,
      field: field_path,
      new_value: string_value,
      writer: "genesis",
      decider: "genesis",
    });
  };

  record_genesis_field("eternal.physical", saved_entity.eternal?.physical);
  record_genesis_field("eternal.non_physical", saved_entity.eternal?.non_physical);
  record_genesis_field("present.physical", saved_entity.present?.physical);
  record_genesis_field("present.non_physical", saved_entity.present?.non_physical);
  if (Array.isArray(saved_entity.past) ? saved_entity.past.length > 0 : saved_entity.past) {
    record_genesis_field("past", saved_entity.past);
  }
  record_genesis_field("future", saved_entity.future);

  if (ledger_lines.length > 0) {
    try {
      await append_ledger_entries(ledger_lines);
    } catch (err) {
      void err;
    }
  }

  // Chained post-save portrait generation (fire-and-forget)
  if (options.generate_portrait !== false && type === "character") {
    const { visual_engine } = await import("@media");
    if (typeof visual_engine?.generate === "function" && typeof window !== "undefined") {
      try {
        const portrait_promise = visual_engine
          .generate(saved_entity.id, { mode: "solo_entity", resolution: "512x512", _entity: saved_entity })
          .then(async (image_url) => {
            if (image_url && saved_entity.id) {
              const data_url = typeof image_url === "object" && image_url?.url ? image_url.url : image_url;
              await entities.update("character", saved_entity.id, { profile_picture: data_url });
              await state_bridge.runtime?.update_entity?.("character", saved_entity.id, { profile_picture: data_url });
            }
          });
        if (portrait_promise && typeof portrait_promise.catch === "function") {
          portrait_promise.catch((error) =>
            state_bridge.app?.log(`[GameMaster] Portrait generation for "${name}" failed: ${error?.message || error}`, "warn"),
          );
        }
      } catch (_error) {
        /* portrait failure must never break genesis */
      }
    }
  }

  return saved_entity;
}

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

  // 5. Hydrate into active runtime state & stage spotlight
  const npcs = { ...(bridge.runtime?.active_npcs || {}) };
  npcs[saved_entity.id] = saved_entity;
  if (bridge.runtime) {
    bridge.runtime.active_npcs = npcs;
    bridge.runtime.in_scene_npc_ids = [...new Set([...(bridge.runtime.in_scene_npc_ids || []), saved_entity.id])];
  }
  state_bridge.app?.log(`[GameMaster] Roster expanded: ${name}.`, "system");
  return saved_entity;
}

/**
 * CHANGELOG
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
