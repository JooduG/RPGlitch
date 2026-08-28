/**
 * src/intelligence/payload.js
 * 📦 PAYLOAD BUILDER — State Snapshot & Intelligence Payload Assembler
 *
 * Hydrates, cleans, and packages raw simulation state into an IntelligencePayload
 * for consumption by the Story Pipeline, Director, and Prompt Builders:
 * 1. Data Points Extractor (to_data_points)
 * 2. Primary Context & Snapshot Assembler (context_builder)
 *
 * Architecture:
 * - Pure, deterministic data transformation.
 * - Extracts temporal fragments (eternal, present, future, memories).
 * - Hydrates primary triad (AI, USER, FRACTAL) and active NPC world-cast.
 */

import { state_bridge, get_value, clean_text } from "@utils";
import { PROFILE_FIELD_CATALOG } from "@data";
import { ensure_embeddings } from "@platform";
import { resolve_vector_pool } from "./temporal-pipeline.js";

/**
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

// ── 1. Data Points Extractor ──────────────────────────────────────────────────

/**
 * Converts entity data into raw statistical data points according to the canonical profile field catalog.
 * @param {any} entity
 * @returns {DataPoint[]}
 */
export function to_data_points(entity) {
  if (!entity) return [];
  const entity_type = entity.type === "user" ? "character" : entity.type || "character";
  const prefix = `${entity_type}.`;
  /** @type {DataPoint[]} */
  const list = [];

  for (const [field_id, metadata] of Object.entries(PROFILE_FIELD_CATALOG)) {
    if (!field_id.startsWith(prefix)) continue;
    const val = get_value(entity, metadata.path);

    if (val && typeof val === "string") {
      const is_eternal = metadata.layer_key?.toLowerCase() === "eternal";
      const is_physical = metadata.path.endsWith(".physical");
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
  }

  return list.filter((item) => item.text.length > 0);
}

// ── 2. Context & Snapshot Assembler ───────────────────────────────────────────

export const context_builder = {
  /**
   * Pulls and resolves all necessary state for an intelligence turn.
   * Returns a structured IntelligencePayload.
   *
   * @param {string} input - The current user input.
   * @param {"simulation"|"logic"|"image"} [type="simulation"] - Generation mode.
   * @param {any[]} [simulation_log=[]] - Recent message log.
   * @returns {Promise<any>}
   */
  async build_context(input, type = "simulation", simulation_log = []) {
    const round = state_bridge.runtime?.round ?? 1;

    // 1. Resolve Triad Entities (Role -> Data)
    const clean = state_bridge.runtime?.snapshot_entities ?? {};
    const entries = [
      { role: "AI", data: clean.AI },
      { role: "USER", data: clean.USER },
      { role: "FRACTAL", data: clean.FRACTAL },
    ];

    // Pre-embed all temporal vectors for semantic scoring (awaited with timeout fallback)
    const all_vectors = [];
    for (const { data } of entries) {
      const pool = resolve_vector_pool(data);
      if (pool.length) all_vectors.push(...pool);
    }
    for (const raw of Object.values(state_bridge.runtime?.snapshot_npcs ?? {})) {
      const pool = resolve_vector_pool(raw);
      if (pool.length) all_vectors.push(...pool);
    }

    if (all_vectors.length) {
      await Promise.race([ensure_embeddings(all_vectors).catch(() => {}), new Promise((resolve) => setTimeout(resolve, 30000))]);
    }

    const entities = /** @type {Record<string, any>} */ ({});

    // 2. Synchronous hydration of triad entities
    for (const { role, data } of entries) {
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
      const filtered = data_points.length
        ? data_points
        : [
            {
              text: `A nascent ${role.toLowerCase()} entity. State: Initializing.`,
              type: "Status",
              enhancer: "SYSTEM",
              section: "Present",
            },
          ];

      /** @type {Record<string, any>} */
      const fragments = {
        eternal: { physical: "", non_physical: "" },
        present: { physical: "", non_physical: "" },
      };

      for (const item of filtered) {
        const layer = item.layer?.toLowerCase();
        const field = item.type === "Physical" ? "physical" : "non_physical";
        if (layer === "eternal" || layer === "present") {
          if (fragments[layer][field] === "") {
            fragments[layer][field] = item.text;
          } else {
            fragments[layer][field] += `\n${item.text}`;
          }
        }
      }

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
    }

    // 3. NPC World Cast — Hydrate secondary characters for Director choreography
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
      is_wanderer: !!raw.is_wanderer,
      voice: raw.voice,
      speaking_style: raw.speaking_style,
      profile_picture: raw.profile_picture,
      signature_color: raw.signature_color,
    }));

    // 4. Assemble Unified Intelligence Payload
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

/**
 * CHANGELOG
 * - 2026-08-28: Ground-up refactor: streamlined loops, added JSDoc typings, relocated merge_prose_into_field to @utils/text.js.
 */
