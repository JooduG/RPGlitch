/**
 * @file src/intelligence/context.svelte.js
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
 *
 * 🔌 CONTEXT BROKER    The State Adapter & Document Assembler
 *
 * PURPOSE
 * context_broker is the "Secretary" of the Intelligence Kernel. It handles
 * the Hydration phase: pulling raw state from the runtime and repository,
 * cleaning it, and packaging it into a unified IntelligencePayload.
 */
import { clean_text, strip_cognition_blocks } from "./parser.js";
import { ENTITY_CATALOG } from "./fragments.js";
import { temporal_engine } from "./temporal.js";
import { app, runtime } from "@state";

const RAW_CACHE = new Map();
const MAX_CACHE_SIZE = 1000;
const SNAPSHOT_ITEM_CACHE = new WeakMap();

/************************************************************************************
 * [SECTION: PRIVATE HELPERS]
 ************************************************************************************/
/**
 * @param {any} msg
 * @returns {string}
 */
function get_sanitized_text(msg) {
  if (!msg || typeof msg !== "object") return "";

  const raw = msg.text || msg.content || "";
  if (RAW_CACHE.has(raw)) return RAW_CACHE.get(raw);

  const sanitized = strip_cognition_blocks(raw).trim();

  if (RAW_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = RAW_CACHE.keys().next().value;
    RAW_CACHE.delete(firstKey);
  }

  RAW_CACHE.set(raw, sanitized);
  return sanitized;
}
/**
 * Resolves a dot-notation path against a nested object.
 * @param {any} obj
 * @param {string} path
 * @returns {any}
 */
function get_path_value(obj, path) {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object") {
      current = current[part];
    } else if (typeof current === "string" && parts.indexOf(part) < parts.length - 1) {
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
  Object.entries(ENTITY_CATALOG).forEach(([fieldId, metadata]) => {
    let val = get_path_value(entity, fieldId);

    if (val && typeof val === "string") {
      const isEternal = metadata.layer_key?.toLowerCase() === "eternal";
      const isPhysical = fieldId.endsWith(".physical");
      list.push({
        text: clean_text(val, 2000),
        type: isPhysical ? "Physical" : (metadata.label ?? "unknown"),
        enhancer: metadata.enhancer ?? "SYSTEM",
        section: metadata.section_label || "Present",
        layer: metadata.layer_key,
        emotional_weight: metadata.emotional_weight ?? (isEternal ? 10 : 5),
        density_multiplier: metadata.density_multiplier ?? 1.0,
      });
    }
  });
  return list.filter((f) => f.text.length > 0);
}

export const context_broker = {
  /**
   * HYDRATION PHASE
   * Pulls and resolves all necessary state for an intelligence turn.
   * Returns a frozen IntelligencePayload.
   *
   * @param {string} input - The current user input.
   * @param {string} [type="simulation"] - 'simulation' | 'logic' | 'image'
   * @param {any[]} [simulation_log] - Recent message log.
   */
  async hydrate(input, type = "simulation", simulation_log = []) {
    const round = runtime.round ?? 1;

    // 1. Resolve Entities mapping (Role -> Data)
    const clean = runtime.snapshot_entities;

    // Resolve active fractal vector via temporal engine
    const active_vector =
      temporal_engine.format(clean.FRACTAL?.future, null, {
        mode: "future",
        limit: 1,
        vector_text: true,
      }) || "Continue the journey.";

    const entries = [
      { role: "AI", data: clean.AI },
      { role: "USER", data: clean.USER },
      { role: "FRACTAL", data: clean.FRACTAL },
    ];

    // Lifecycle Management: Resolve satisfied future vectors before hydration to ensure current turn accuracy
    await Promise.all(entries.map(({ data }) => context_broker.manage_vector_lifecycle(data))).catch((err) =>
      console.warn("[Vector Lifecycle] Failed to auto-resolve vectors:", err),
    );

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
          past: [],
          future: [],
          dynamics: {},
        }
      );
      const data_points = to_data_points(raw);
      // Lexical filtering for relevance against active vector
      const filtered = context_broker.lexical_filter(data_points, active_vector);
      // Safety boot-strap
      if (filtered.length === 0) {
        filtered.push({
          text: `A nascent ${role.toLowerCase()} entity. State: Initializing.`,
          type: "Status",
          enhancer: "SYSTEM",
          section: "Present",
        });
      }
      // Build the structured Fragment view (Sovereign Schema)
      /** @type {Record<string, any>} */
      const fragments = {
        eternal: { physical: "", non_physical: "" },
        present: { physical: "", non_physical: "" },
      };
      filtered.forEach((/** @type {DataPoint} */ f) => {
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
        past: raw.past,
        future: raw.future,
        dynamics: raw.dynamics, // Pass through for physics calculation
        dynamics_baseline: raw.dynamics_baseline, // Gravitational center
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
      simulation_log: context_broker.assemble_snapshot(simulation_log),
      rawMessages: simulation_log,
      meta: {
        active_vector,
        timestamp: new Date().toISOString(),
      },
    };
  },
  /**
   * Creates a dense beat-map of recent history.
   * @param {any[]} history
   */
  assemble_snapshot(history = []) {
    if (!history.length) return null;
    return history
      .map((m) => {
        if (m && typeof m === "object") {
          const cached = SNAPSHOT_ITEM_CACHE.get(m);
          if (cached !== undefined) return cached;
        }
        const owner = m.character_name || (m.role === "user" ? "User" : "AI");
        const stripped = get_sanitized_text(m);
        const formatted = `[${owner}]: ${clean_text(stripped, 500)}`;
        if (m && typeof m === "object") {
          SNAPSHOT_ITEM_CACHE.set(m, formatted);
        }
        return formatted;
      })
      .join("\n");
  },
  /**
   * Dynamically resolves FUTURE_VECTOR items based on temporal_engine state constraints.
   * @param {any} entity
   */
  async manage_vector_lifecycle(entity) {
    if (!entity || !Array.isArray(entity.future) || entity.future.length === 0) return;

    const vectors_to_resolve = [];

    for (const vector of entity.future) {
      // 1. CHRONO VALIDATION
      const round_threshold = vector.requires?.round ?? vector.meta?.round ?? vector.meta?.round_threshold;
      if (round_threshold !== undefined && typeof round_threshold === "number") {
        if ((runtime.round ?? 0) < round_threshold) {
          continue; // immediately block resolution and continue to the next vector
        }
      }

      let is_resolved = false;
      const has_requires = vector.requires && typeof vector.requires === "object" && Object.keys(vector.requires).length > 0;

      if (has_requires) {
        // 2. STATE EVALUATION
        let state_checks_passed = true;
        for (const [req_key, req_val] of Object.entries(vector.requires)) {
          if (req_key === "round") continue; // Handled by Chrono Validation above

          let actual_val = get_path_value(runtime, req_key);
          if ((actual_val === undefined || actual_val === "") && app) {
            actual_val = get_path_value(app, req_key);
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
        temporal_engine.resolve(entity, id, "AUTO_RESOLVED");
      }
    }
  },
  /**
   * Relevance-based sorting for raw data points.
   * @param {DataPoint[]} data_points
   * @param {string} objective
   */
  lexical_filter(data_points, objective) {
    if (!objective || !Array.isArray(data_points)) return data_points;

    const keywords = objective
      .toLowerCase()
      .split(/\W+/)
      .filter((/** @type {string} */ w) => w.length > 3);

    if (keywords.length === 0) return data_points;

    return data_points
      .map((dp) => {
        const text = (dp?.text || "").toLowerCase();
        const layer = (dp?.layer || "").toLowerCase();

        let hitCount = 0;
        for (const k of keywords) {
          const regex = new RegExp(k.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"), "g");
          const matches = text.match(regex);
          if (matches) hitCount += matches.length;
        }

        const emotional_weight = dp.emotional_weight ?? (layer === "eternal" ? 10 : 5);
        const density_multiplier = dp.density_multiplier ?? 1.0;

        let score = hitCount * density_multiplier + emotional_weight;
        if (layer === "eternal") score += 1000;

        return { dp, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((d) => d.dp);
  },
};
