/**
 * @file src/intelligence/context.js
 * 🔌 CONTEXT BUILDER — State Adapter & Document Assembler
 * Hydrates, cleans, and packages raw simulation state into an IntelligencePayload.
 *
 * @typedef {import('@state/runtime.svelte.js').SimulationEntity} SimulationEntity
 *
 * @typedef {Object} DataPoint
 * @property {string} text
 * @property {string} type
 * @property {string} enhancer
 * @property {string} section
 * @property {string} [layer]
 * @property {number} [hit]
 * @property {number} [score]
 * @property {number} [emotional_weight]
 * @property {number} [density_multiplier]
 */

import { state_bridge, get_value } from "@utils";
import { ensure_embeddings } from "./embeddings.svelte.js";
import { ENTITY_CATALOG } from "@data";
import { clean_text } from "./parser.js";
import { resolve_vector_pool } from "./temporal.js";

/************************************************************************************
 * [SECTION: PRIVATE HELPERS]
 ************************************************************************************/

/**
 * Converts entity data into raw statistical data points.
 * @param {any} entity
 * @returns {DataPoint[]}
 */
function to_data_points(entity) {
  if (!entity) return [];
  /** @type {DataPoint[]} */
  const list = [];
  Object.entries(ENTITY_CATALOG).forEach(([field_id, metadata]) => {
    if (field_id.startsWith("character.") || field_id.startsWith("fractal.")) return;

    let val = get_value(entity, field_id);

    if (val && typeof val === "string") {
      const is_eternal = metadata.layer_key?.toLowerCase() === "eternal";
      const is_physical = field_id.endsWith(".physical");
      list.push({
        text: clean_text(val, 2000),
        type: is_physical ? "Physical" : (metadata.label ?? "unknown"),
        enhancer: metadata.enhancer ?? "SYSTEM",
        section: metadata.section_label || "Present",
        layer: metadata.layer_key,
        emotional_weight: metadata.emotional_weight ?? (is_eternal ? 10 : 5),
        density_multiplier: metadata.density_multiplier ?? 1.0,
      });
    }
  });
  return list.filter((f) => f.text.length > 0);
}

export const context_builder = {
  /**
   * HYDRATION PHASE
   * Pulls and resolves all necessary state for an intelligence turn.
   * Returns a structured IntelligencePayload.
   *
   * @param {string} input - The current user input.
   * @param {string} [type="simulation"] - 'simulation' | 'logic' | 'image'
   * @param {any[]} [simulation_log=[]] - Recent message log.
   * @returns {Promise<any>}
   */
  async build_context(input, type = "simulation", simulation_log = []) {
    const round = state_bridge.runtime?.round ?? 1;

    // 1. Resolve Entities mapping (Role -> Data)
    const clean = state_bridge.runtime?.snapshot_entities ?? {};

    const entries = [
      { role: "AI", data: clean.AI },
      { role: "USER", data: clean.USER },
      { role: "FRACTAL", data: clean.FRACTAL },
    ];

    // Pre-embed all temporal vectors for semantic scoring (awaited with timeout fallback)
    const all_vectors = [];
    entries.forEach(({ data }) => {
      const pool = resolve_vector_pool(data);
      if (pool.length) all_vectors.push(...pool);
    });
    for (const raw of Object.values(state_bridge.runtime?.snapshot_npcs ?? {})) {
      const pool = resolve_vector_pool(raw);
      if (pool.length) all_vectors.push(...pool);
    }
    if (all_vectors.length) {
      await Promise.race([ensure_embeddings(all_vectors).catch(() => {}), new Promise((resolve) => setTimeout(resolve, 30000))]);
    }

    const entities = /** @type {Record<string, any>} */ ({});

    // Synchronous hydration of entities
    entries.forEach(({ role, data }) => {
      const raw = /** @type {SimulationEntity} */ (
        data || {
          id: null,
          name: role,
          role,
          fragments: [],
          eternal: { physical: "", non_physical: "" },
          present: { physical: "", non_physical: "" },
          future: "",
          past: [],
          dynamics: {},
        }
      );
      const data_points = to_data_points(raw);
      const filtered = data_points;

      if (filtered.length === 0) {
        filtered.push({
          text: `A nascent ${role.toLowerCase()} entity. State: Initializing.`,
          type: "Status",
          enhancer: "SYSTEM",
          section: "Present",
        });
      }

      /** @type {Record<string, any>} */
      const fragments = {
        eternal: { physical: "", non_physical: "" },
        present: { physical: "", non_physical: "" },
      };

      filtered.forEach((f) => {
        const layer = f.layer?.toLowerCase();
        const field = f.type === "Physical" ? "physical" : "non_physical";
        if (layer && (layer === "eternal" || layer === "present")) {
          const l = /** @type {"eternal"|"present"} */ (layer);
          const fld = /** @type {"physical"|"non_physical"} */ (field);
          if (fragments[l][fld] === "") {
            fragments[l][fld] = f.text;
          } else {
            fragments[l][fld] += `\n${f.text}`;
          }
        }
      });

      entities[role] = {
        id: raw.id,
        name: raw.name || role,
        _data_points: filtered,
        fragments,
        eternal: fragments.eternal,
        present: fragments.present,
        memories: resolve_vector_pool(raw),
        dynamics: raw.dynamics,
        dynamics_baseline: raw.dynamics_baseline,
        associated_ids: /** @type {any} */ (raw).associated_ids || [],
      };
    });

    // 1.5. NPC WORLD CAST — hydrate the story's secondary characters into
    // compact entities for the Director's <WORLD_CAST>/<SCENE_ROSTER>, the
    // relational mesh, and the NPC speaker engine.
    const npc_map = state_bridge.runtime?.snapshot_npcs ?? {};
    const in_scene_ids = state_bridge.runtime?.snapshot_in_scene_npc_ids ?? [];
    const npc_entities = Object.values(npc_map).map((raw) => ({
      id: raw.id,
      name: raw.name || raw.id,
      type: "character",
      eternal: { physical: raw.eternal?.physical || "", non_physical: raw.eternal?.non_physical || "" },
      present: { physical: raw.present?.physical || "", non_physical: raw.present?.non_physical || "" },
      memories: resolve_vector_pool(raw),
      dynamics: raw.dynamics,
      dynamics_baseline: raw.dynamics_baseline,
      future: raw.future || "",
      relationships: Array.isArray(raw.relationships) ? raw.relationships : [],
      role_tier: Number(raw.role_tier) || 1,
      is_wanderer: !!raw.is_wanderer,
      voice: raw.voice,
      voice_register: raw.voice_register,
      profile_picture: raw.profile_picture,
      signature_color: raw.signature_color,
    }));

    // 2. Build Unified Payload
    return {
      input,
      type,
      round,
      entities,
      npc_entities,
      in_scene_ids,
      view_id: "global",
      raw_messages: simulation_log,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  },
};
