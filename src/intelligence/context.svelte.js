/**
 * @file src/intelligence/context.svelte.js
 * 🔌 CONTEXT BUILDER — State Adapter & Document Assembler
 * Hydrates, cleans, and packages raw simulation state into an IntelligencePayload.
 *
 * @typedef {import('@state/state_bridge.runtime.svelte.js').SimulationEntity} SimulationEntity
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

import { state_bridge } from "@utils";
import { ensure_embeddings } from "./embeddings.svelte.js";
import { ENTITY_CATALOG } from "../data/definitions/fragments.js";
import { clean_text } from "./parser.js";
import { temporal_engine, resolve_vector_pool } from "./temporal.js";

/************************************************************************************
 * [SECTION: PRIVATE HELPERS]
 ************************************************************************************/

/**
 * Resolves a dot-notation path against a nested object.
 * @param {any} obj
 * @param {string} path
 * @returns {any}
 */
function get_path_value(obj, path) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current && typeof current === "object") {
      current = current[part];
    } else if (typeof current === "string" && i < parts.length - 1) {
      return current;
    } else {
      return "";
    }
  }
  return current || "";
}

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

    let val = get_path_value(entity, field_id);

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

    // Resolve active fractal vector via temporal engine
    const active_vector =
      temporal_engine.format(
        resolve_vector_pool(clean?.FRACTAL).filter((v) => v?.type === "future"),
        null,
        {
          vector_text: true,
        },
      ) || "Continue the journey.";

    const entries = [
      { role: "AI", data: clean.AI },
      { role: "USER", data: clean.USER },
      { role: "FRACTAL", data: clean.FRACTAL },
    ];

    // Lifecycle Management: Resolve satisfied future vectors before hydration to ensure turn accuracy
    await Promise.all(entries.map(({ data }) => context_builder.manage_vector_lifecycle(data))).catch((err) =>
      console.warn("[Vector Lifecycle] Failed to auto-resolve vectors:", err),
    );

    // Pre-embed all temporal vectors for semantic scoring (awaited with timeout fallback)
    const all_vectors = [];
    entries.forEach(({ data }) => {
      const pool = resolve_vector_pool(data);
      if (pool.length) all_vectors.push(...pool);
    });
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
          future: [],
          past: [],
          dynamics: {},
        }
      );
      const data_points = to_data_points(raw);
      const filtered = context_builder.lexical_filter(data_points, active_vector);

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
        immediate_intent: raw.immediate_intent || null,
        dynamics: raw.dynamics,
        dynamics_baseline: raw.dynamics_baseline,
        associated_ids: /** @type {any} */ (raw).associated_ids || [],
      };
    });

    // 2. Build Unified Payload
    return {
      input,
      type,
      round,
      entities,
      view_id: "global",
      raw_messages: simulation_log,
      meta: {
        active_vector,
        timestamp: new Date().toISOString(),
      },
    };
  },

  /**
   * Dynamically resolves FUTURE_VECTOR items based on temporal_engine state constraints.
   * @param {any} entity
   * @returns {Promise<void>}
   */
  async manage_vector_lifecycle(entity) {
    const futures = resolve_vector_pool(entity).filter((v) => v?.type === "future");
    if (futures.length === 0) return;

    const vectors_to_resolve = [];

    for (const vector of futures) {
      // 1. chrono_engine Validation
      const round_threshold = vector.requires?.round ?? vector.meta?.round ?? vector.meta?.round_threshold;
      if (round_threshold !== undefined && typeof round_threshold === "number") {
        if ((state_bridge.runtime?.round ?? 0) < round_threshold) {
          continue;
        }
      }

      let is_resolved = false;
      const has_requires = vector.requires && typeof vector.requires === "object" && Object.keys(vector.requires).length > 0;

      if (has_requires) {
        // 2. State Evaluation
        let state_checks_passed = true;
        for (const [req_key, req_val] of Object.entries(vector.requires)) {
          if (req_key === "round") continue;

          let actual_val = state_bridge.runtime ? get_path_value(state_bridge.runtime, req_key) : undefined;
          if ((actual_val === undefined || actual_val === "") && state_bridge.app) {
            actual_val = get_path_value(state_bridge.app, req_key);
          }

          if (actual_val !== req_val) {
            state_checks_passed = false;
            break;
          }
        }

        if (state_checks_passed) {
          is_resolved = true;
        }
      }

      if (is_resolved) {
        vectors_to_resolve.push(vector.id);
      }
    }

    if (vectors_to_resolve.length > 0) {
      for (const id of vectors_to_resolve) {
        temporal_engine.resolve(entity, id, "AUTO_RESOLVED", state_bridge.session_driver);
      }
    }
  },

  /**
   * Relevance-based sorting for raw data points.
   * @param {DataPoint[]} data_points
   * @param {string} objective
   * @returns {DataPoint[]}
   */
  lexical_filter(data_points, objective) {
    if (!objective || !Array.isArray(data_points)) return data_points;

    const STOP_WORDS = new Set([
      "about",
      "their",
      "would",
      "there",
      "these",
      "other",
      "which",
      "could",
      "should",
      "shall",
      "might",
      "every",
      "those",
      "where",
      "when",
      "what",
      "that",
      "this",
      "they",
      "have",
      "from",
      "into",
      "your",
      "them",
      "were",
      "been",
      "more",
      "very",
      "some",
      "such",
      "than",
      "then",
      "also",
      "just",
      "only",
      "even",
      "much",
      "many",
      "most",
      "back",
      "like",
      "make",
      "made",
      "will",
      "does",
      "done",
      "came",
      "come",
      "going",
      "gets",
      "went",
      "want",
      "wants",
      "said",
      "says",
      "say",
      "one",
      "two",
      "with",
      "upon",
      "down",
    ]);

    const keywords = objective
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    if (keywords.length === 0) return data_points;

    return data_points
      .map((dp) => {
        const text = (dp?.text || "").toLowerCase();
        const layer = (dp?.layer || "").toLowerCase();

        let hit_count = 0;
        for (const k of keywords) {
          let idx = text.indexOf(k);
          while (idx !== -1) {
            hit_count++;
            idx = text.indexOf(k, idx + k.length);
          }
        }

        const emotional_weight = dp.emotional_weight ?? (layer === "eternal" ? 10 : 5);
        const density_multiplier = dp.density_multiplier ?? 1.0;

        let score = hit_count * density_multiplier + emotional_weight;
        if (layer === "eternal") score += 1000;

        return { dp, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((d) => d.dp);
  },
};
