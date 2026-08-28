/**
 * src/intelligence/profile-pipeline.js
 * 🧬 PROFILE PIPELINE — LLM sorting + flat-profile application
 *
 * The "shape" step of the content-import pipeline. Raw source prose becomes a
 * flat sorted profile (sort_into_profile); that flat profile — whether it came
 * from the LLM sorter or a Character Card codec (@data/character-cards.js) — is then
 * applied onto a fresh Twin-Cylinder entity (apply_profile_to_entity).
 *
 * One shape in, one application function out: the import orchestrator never
 * thinks about schema mapping.
 */

import { parse_profile_json } from "./parser.js";
import { prompt_builder } from "./prompts/builder.js";
import { temporal_engine } from "./temporal-pipeline.js";
import { llm_service } from "@platform";
import { entities } from "@data";
import { generate_uuid, state_bridge } from "@utils";

/** Flat profile keys that map onto a nested Twin-Cylinder leaf. */
export const FLAT_LEAF_MAP = {
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

// =========================================================================
// NPC GENESIS & ACTIVE CAST SPAWNING
// =========================================================================

/**
 * Applies Director genesis requests — spawns brand-new recurring NPCs.
 * @param {any} bridge
 * @param {Array<{ name: string, description?: string, role_tier?: number, voice_register?: string, signature_color?: string }>} genesis
 * @param {(bridge: any, draft: any) => Promise<any>} [spawner_fn]
 */
export async function apply_genesis(bridge, genesis, spawner_fn = spawn_npc) {
  const items = Array.isArray(genesis) ? genesis : [];
  if (!items.length) return;

  const scene_context = [
    bridge.runtime?.active_fractal?.name ? `Setting: ${bridge.runtime.active_fractal.name}` : "",
    bridge.runtime?.active_fractal?.present?.physical || "",
    bridge.runtime?.active_fractal?.present?.non_physical || "",
  ]
    .filter(Boolean)
    .join(" — ");

  const existing_names = new Set(
    [
      bridge.runtime?.active_ai,
      bridge.runtime?.active_user,
      bridge.runtime?.active_fractal,
      ...Object.values(bridge.runtime?.active_npcs || {}),
    ]
      .filter(Boolean)
      .map((e) => String(e.name || "").trim().toLowerCase()),
  );

  const spawn_tasks = [];
  for (const g of items) {
    if (!g?.name) continue;
    const norm_name = String(g.name).trim().toLowerCase();
    if (existing_names.has(norm_name)) {
      state_bridge.app?.log(`[GameMaster] Genesis "${g.name}" already in cast — convergence guard.`, "warn");
      continue;
    }
    existing_names.add(norm_name);

    spawn_tasks.push(
      spawner_fn(bridge, {
        name: g.name,
        description: g.description,
        role_tier: g.role_tier,
        voice_register: g.voice_register,
        signature_color: g.signature_color,
        scene_context,
      })
        .then((npc) => {
          if (npc) state_bridge.app?.log(`[GameMaster] ✨ Genesis: ${npc.name} entered the scene.`, "system");
          return npc;
        })
        .catch((err) => {
          state_bridge.app?.log(`[GameMaster] Genesis failed for "${g.name}": ${err?.message || err}`, "error");
          return null;
        }),
    );
  }

  if (spawn_tasks.length) {
    await Promise.allSettled(spawn_tasks);
  }
}

/**
 * Spawns a new roster NPC (Tier 1 by default), persists it to Dexie,
 * registers it on the active story, and puts it on-stage.
 * @param {any} bridge
 * @param {{ name: string, description?: string, role_tier?: number, relationships?: string[], voice_register?: string, signature_color?: string, scene_context?: string }} [draft]
 * @returns {Promise<any | null>}
 */
export async function spawn_npc(bridge, draft = {}) {
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
    role_tier: Math.max(1, Math.min(3, Number(draft?.role_tier) || 1)),
    relationships: Array.isArray(draft?.relationships) ? draft.relationships : [],
    voice_register: draft?.voice_register || "low_curt",
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

    const rich_profile = await sort_into_profile(synthesis_source, "character");
    if (rich_profile && typeof rich_profile === "object") {
      entity = apply_profile_to_entity(entity, rich_profile);
    }
  } catch (err) {
    state_bridge.app?.log(`[GameMaster] Genesis rich synthesis failed for "${name}", using raw draft: ${err?.message || err}`, "warn");
  }

  // Ensure signature color and name are firmly grounded
  if (name) entity.name = name;
  if (raw_color) entity.signature_color = raw_color;
  entity.role_tier = Math.max(1, Math.min(3, Number(draft?.role_tier) || entity.role_tier || 1));

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
      const { stories } = await import("@data");
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
