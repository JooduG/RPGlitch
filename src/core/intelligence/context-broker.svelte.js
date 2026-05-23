/**
 * @file src/core/intelligence/context-broker.svelte.js
 *
 * @typedef {import('../../state/runtime.svelte.js').SimulationEntity} SimulationEntity
 *
 * @typedef {Object} DataPoint
 * @property {string} text
 * @property {string} type
 * @property {string} enhancer
 * @property {string} section
 * @property {string} [layer]
 * @property {number} [hit]
 *
 * 🔌 CONTEXT BROKER    The State Adapter & Document Assembler
 *
 * PURPOSE
 * context_broker is the "Secretary" of the Intelligence Kernel. It handles
 * the Hydration phase: pulling raw state from the runtime and repository,
 * cleaning it, and packaging it into a unified IntelligencePayload.
 */
/* eslint-disable svelte/prefer-svelte-reactivity */
import { runtime } from "@state/runtime.svelte.js";
import { app } from "@state/app.svelte.js";
import { clean_text } from "@core/text-parser.js";
import { dynamics_engine } from "@core/intelligence/dynamics-engine.js";
import { ENTITY_CATALOG } from "@core/intelligence/entity-fragments.js";
import { temporal_engine } from "@core/intelligence/temporal-engine.js";

const RAW_CACHE = new Map();
const MAX_CACHE_SIZE = 1000;

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

  const sanitized = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

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
      list.push({
        text: clean_text(val, 2000),
        type: metadata.label ?? "unknown",
        enhancer: metadata.enhancer ?? "SYSTEM",
        section: metadata.section_label || "Present",
        layer: metadata.layer_key,
      });
    }
  });
  return list.filter((f) => f.text.length > 0);
}

/**
 * Extracts new input and the last logged turn text to avoid parsing full history.
 * @param {string} input
 * @param {any[]} simulation_log
 * @returns {string}
 */
function get_new_content_input(input, simulation_log) {
  const parts = [];
  if (input && typeof input === "string") {
    parts.push(input);
  }
  if (Array.isArray(simulation_log) && simulation_log.length > 0) {
    const last_msg = simulation_log[simulation_log.length - 1];
    const sanitized = get_sanitized_text(last_msg);
    if (sanitized) {
      parts.push(sanitized);
    }
  }
  return parts.join(" ");
}

/************************************************************************************
 * [SECTION: KNOWLEDGE CACHE]
 ************************************************************************************/
// Reactive local cache of active vectors.
/** @type {{ AI: any[], USER: any[], FRACTAL: any[] }} */
const KnowledgeCache = $state({
  AI: [],
  USER: [],
  FRACTAL: [],
});

let lastAIKeys = "";
let lastUserKeys = "";
let lastFractalKeys = "";

// Sync effect with explicit bouncer tracking on future vector sub-properties (length and IDs).
$effect.root(() => {
  $effect(() => {
    const aiFuture = runtime.active_ai?.future ?? [];
    const aiKeys = aiFuture.map((v) => `${v.id}:${v.timestamp}`).join("|");

    const userFuture = runtime.active_user?.future ?? [];
    const userKeys = userFuture.map((v) => `${v.id}:${v.timestamp}`).join("|");

    const fractalFuture = runtime.active_fractal?.future ?? [];
    const fractalKeys = fractalFuture.map((v) => `${v.id}:${v.timestamp}`).join("|");

    // Only assign and update active state subscribers when actual shifts happen
    if (aiKeys !== lastAIKeys) {
      KnowledgeCache.AI = aiFuture;
      lastAIKeys = aiKeys;
    }
    if (userKeys !== lastUserKeys) {
      KnowledgeCache.USER = userFuture;
      lastUserKeys = userKeys;
    }
    if (fractalKeys !== lastFractalKeys) {
      KnowledgeCache.FRACTAL = fractalFuture;
      lastFractalKeys = fractalKeys;
    }
  });
});

/************************************************************************************
 * [SECTION: CONTEXT BROKER]
 ************************************************************************************/
export const context_broker = {
  /**
   * O(1) getter for the KnowledgeCache.
   * @returns {{ AI: any[]; USER: any[]; FRACTAL: any[]; }}
   */
  get_active_vectors() {
    return KnowledgeCache;
  },

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

    // Use our O(1) Knowledge Cache getter to retrieve active vectors cleanly
    const active_vectors = context_broker.get_active_vectors();
    const active_vector = active_vectors.FRACTAL?.[0]?.text || "Continue the journey.";

    // Check for empathy/trust flags in recent input to conditionalize SUSPICIOUS_COGNITION
    const matches = dynamics_engine.dynamics_scan(input);
    const has_trust_plea = matches.some((m) => m.id === "VULNERABILITY" || m.id === "SUSPICIOUS");

    // Extract new content input for incremental lifecycle matching
    const new_content = get_new_content_input(input, simulation_log);

    // 1. Resolve Entities mapping (Role -> Data)
    const clean = runtime.snapshot_entities;
    const entries = [
      { role: "AI", data: clean.AI },
      { role: "USER", data: clean.USER },
      { role: "FRACTAL", data: clean.FRACTAL },
    ];

    // Lifecycle Management: Resolve satisfied future vectors before hydration to ensure current turn accuracy
    await Promise.all(
      entries.map(({ data }) => context_broker.manage_vector_lifecycle(data, new_content)),
    ).catch((err) => console.warn("[Vector Lifecycle] Failed to auto-resolve vectors:", err));

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
      // Lexical filtering for AI relevance
      const filtered =
        role === "AI" ? context_broker.lexical_filter(data_points, active_vector) : data_points;
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
          }
        }
      });
      entities[role] = {
        id: raw.id,
        name: raw.name || role,
        _data_points: filtered,
        fragments,
        past: raw.past,
        future: raw.future,
        dynamics: raw.dynamics, // Pass through for physics calculation
        associated_ids: /** @type {any} */ (raw).associated_ids || [],
      };
    });
    // 2. Build Unified Payload
    return {
      input,
      type,
      round,
      entities,
      simulation_log: context_broker.assemble_snapshot(simulation_log),
      rawMessages: simulation_log,
      meta: {
        active_vector,
        is_suspicious: has_trust_plea,
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
        const owner = m.character_name || (m.role === "user" ? "User" : "AI");
        const stripped = get_sanitized_text(m);
        return `[${owner}]: ${clean_text(stripped, 500)}`;
      })
      .join("\n");
  },
  /**
   * Dynamically resolves FUTURE_VECTOR items based on recent simulation log keywords.
   * @param {any} entity
   * @param {string} recent_log_text
   */
  async manage_vector_lifecycle(entity, recent_log_text) {
    if (!entity || !Array.isArray(entity.future) || entity.future.length === 0) return;

    const vectors_to_resolve = [];

    for (const vector of entity.future) {
      // 1. CHRONO VALIDATION
      const round_threshold =
        vector.requires?.round ?? vector.meta?.round ?? vector.meta?.round_threshold;
      if (round_threshold !== undefined && typeof round_threshold === "number") {
        if ((runtime.round ?? 0) < round_threshold) {
          continue; // immediately block resolution and continue to the next vector
        }
      }

      let is_resolved = false;
      const has_requires =
        vector.requires &&
        typeof vector.requires === "object" &&
        Object.keys(vector.requires).length > 0;

      if (has_requires) {
        // 2. STATE EVALUATION
        let state_checks_passed = true;
        for (const [req_key, req_val] of Object.entries(vector.requires)) {
          if (req_key === "round") continue; // Handled by Chrono Validation above

          let actual_val = get_path_value(runtime, req_key);
          if (actual_val === undefined || actual_val === "") {
            if (runtime.simulation) {
              actual_val = get_path_value(runtime.simulation, req_key);
            }
          }
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
      } else {
        // 3. FUZZY TEXT FALLBACK
        if (recent_log_text) {
          const log_lower = recent_log_text.toLowerCase();
          const log_words = new Set(log_lower.split(/[\s,.;:!?()"'[\]{}]+/));
          const escape_regex = (/** @type {string} */ str) =>
            str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

          // Check strict vector tags
          if (Array.isArray(vector.vector_tags)) {
            is_resolved = vector.vector_tags.some((/** @type {string} */ tag) => {
              const t = tag.toLowerCase();
              if (t.includes(" ")) {
                // Multi-word tag: use escaped regex with word boundaries
                try {
                  const regex = new RegExp(`\\b${escape_regex(t)}\\b`, "i");
                  return regex.test(recent_log_text);
                } catch {
                  return log_lower.includes(t);
                }
              }
              // Single word tag: fast O(1) lookup
              return log_words.has(t);
            });
          }

          // Check significant keywords from the vector text if no tag match
          if (!is_resolved && vector.text) {
            // Extract deduplicated words > 4 chars
            const words = vector.text
              .toLowerCase()
              .split(/[\s,.;:!?()"'[\]{}]+/)
              .filter((/** @type {string} */ w) => w.length > 4);

            const keywords = Array.from(new Set(words));

            if (keywords.length > 0) {
              // If at least 3 significant keywords (or all if < 3) are found, consider it matched
              const match_threshold = Math.min(3, keywords.length);

              let matched_count = 0;
              for (const k of keywords) {
                if (log_words.has(k)) {
                  matched_count++;
                }
              }

              if (matched_count >= match_threshold) {
                is_resolved = true;
              }
            }
          }
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

    // Schwartzian transform: decorate-sort-undecorate
    // This caches the lowercase text and the hit status once per data point,
    // avoiding repeated O(N) operations during the sort comparisons.
    return data_points
      .map((dp) => {
        const text = (dp?.text || "").toLowerCase();
        const layer = (dp?.layer || "").toLowerCase();
        const hit =
          layer === "eternal" || keywords.some((/** @type {string} */ k) => text.includes(k));
        return { dp, hit: hit ? 1 : 0 };
      })
      .sort((a, b) => b.hit - a.hit)
      .map((d) => d.dp);
  },
};
