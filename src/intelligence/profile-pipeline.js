/**
 * src/intelligence/profile-pipeline.js
 * 🧬 PROFILE PIPELINE — Profile Structuring, Entity Mapping & Character Spawning
 *
 * Provides two primary services:
 * 1. Content Ingestion & Shape Pipeline (structure_profile, apply_profile_to_entity):
 *    - Ingests raw source text, structures into flat profiles via LLM.
 *    - Maps flat profile keys onto the nested Twin-Cylinder entity schema.
 * 2. Character Genesis & Active Cast Spawning (execute_genesis, spawn_character):
 *    - Processes Director genesis requests and synthesizes recurring characters.
 *    - Persists new characters to Dexie DB, adds them to the story cast, and registers them on-stage.
 */

import { parse_profile_json } from "./parser.js";
import { prompt_builder } from "./prompts/builder.js";
import { temporal_engine } from "./temporal-pipeline.js";
import { llm_service } from "@platform";
import { entities, stories, FLAT_LEAF_MAP } from "@data";
import { generate_uuid, state_bridge } from "@utils";

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
  const payload = prompt_builder.build_profile_sorting(raw, type, { ingestion: true });
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
      entity.future = val.trim();
    } else if (key === "tags" && Array.isArray(val)) {
      entity.tags = val
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, 30);
    } else if (typeof val === "object" && !Array.isArray(val)) {
      // Nested flat objects → shallow-copy their string leaves.
      for (const [sub_key, sub_val] of Object.entries(val)) {
        if (typeof sub_val === "string") {
          if (!entity[key]) entity[key] = {};
          entity[key][sub_key] = sub_val;
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

// ── 2. Character Genesis & Active Cast Spawning ───────────────────────────────

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
  const raw_color = String(draft?.signature_color || "").trim();
  const desc = String(draft?.description || "").trim();
  const scene_context = String(draft?.scene_context || "").trim();

  // 1. Base entity shell
  let entity = {
    name,
    type: "character",
    description: desc,
    eternal: {
      physical: desc,
      non_physical: "",
    },
    present: {
      physical: desc,
      non_physical: "",
    },
    future: "",
    past: [],
    dynamics: { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
    dynamics_baseline: { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
    relationships: Array.isArray(draft?.relationships) ? draft.relationships : [],
    speaking_style: draft?.speaking_style || "casual",
    is_wanderer: false,
    signature_color: raw_color || undefined,
  };

  // 2. Rich Character Profile Synthesis (same pipeline as import)
  try {
    const synthesis_source = [
      `Character Name: ${name}`,
      desc ? `Core Concept: ${desc}` : "",
      raw_color ? `Signature Color: ${raw_color}` : "",
      scene_context ? `Scene Context & Atmosphere: ${scene_context}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const rich_profile = await structure_profile(synthesis_source, "character");
    if (rich_profile && typeof rich_profile === "object") {
      entity = apply_profile_to_entity(entity, rich_profile);
    }
  } catch (err) {
    state_bridge.app?.log(`[GameMaster] Genesis rich synthesis failed for "${name}", using raw draft: ${err?.message || err}`, "warn");
  }

  // Ensure signature color and name are firmly grounded
  if (name) entity.name = name;
  if (raw_color) entity.signature_color = raw_color;

  const saved_entity = await entities.upsert("character", entity);

  // 3. Genesis portrait — fire-and-forget in background using rich physical description
  const { visual_engine } = await import("@media");
  if (typeof visual_engine?.generate === "function" && typeof window !== "undefined") {
    try {
      const portrait_promise = visual_engine.generate(saved_entity.id, { mode: "solo_entity", resolution: "512x512", _entity: saved_entity });
      if (portrait_promise && typeof portrait_promise.catch === "function") {
        portrait_promise.catch((err) =>
          state_bridge.app?.log(`[GameMaster] Portrait generation for "${name}" failed: ${err?.message || err}`, "warn"),
        );
      }
    } catch (_err) {
      /* portrait failure must never break genesis */
    }
  }

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
 * - 2026-08-28: Pruned unused execute_genesis, renamed sort_into_profile -> structure_profile, spawn_npc -> spawn_character; purged legacy 3-tier system references.
 */
