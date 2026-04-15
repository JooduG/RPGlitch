/**
 * @file src/core/intelligence/context-broker.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔌 CONTEXT BROKER  —  The State Adapter & Document Assembler
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * context_broker is the "Secretary" of the Intelligence Kernel. It handles
 * the Hydration phase: pulling raw state from the runtime and repository,
 * cleaning it, and packaging it into a unified IntelligencePayload.
 */
import { runtime } from "@state/runtime.svelte.js";
import { ENTITY_CATALOG } from "./entity-fragments.js";
import { clean_text } from "../engine/text-parser.js";
import { dynamics_engine } from "./dynamics-engine.js";

/************************************************************************************
 * 🧩 [SECTION: PRIVATE HELPERS]
 ************************************************************************************/
/**
 * Resolves a dot-notation path against a nested object.
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
 */
function to_data_points(entity) {
  if (!entity) return [];
  const list = [];
  Object.entries(ENTITY_CATALOG).forEach(([fieldId, metadata]) => {
    let val = get_path_value(entity, fieldId);

    if (val && typeof val === "string") {
      // FIX: Increase limit to 2000 for Entity Fragments to prevent truncation of identity blocks
      list.push({
        text: clean_text(val, 2000),
        type: metadata.label,
        enhancer: metadata.enhancer,
        section: metadata.section_label || "Present",
        layer: metadata.layer_key,
      });
    }
  });
  return list.filter((f) => f.text.length > 0);
}
/************************************************************************************
 * 🧩 [SECTION: CONTEXT BROKER]
 ************************************************************************************/
export const context_broker = {
  /**
   * HYDRATION PHASE
   * Pulls and resolves all necessary state for an intelligence turn.
   * Returns a frozen IntelligencePayload.
   *
   * @param {string} input - The current user input.
   * @param {string} [type="simulation"] - 'simulation' | 'logic' | 'image'
   * @param {Array} simulation_log - Recent message log.
   */
  async hydrate(input, type = "simulation", simulation_log = []) {
    const round = runtime.round || 1;
    const active_vector = runtime.active_vector("FRACTAL");

    // Check for empathy/trust flags in recent input to conditionalize SUSPICIOUS_COGNITION
    const matches = dynamics_engine.dynamics_scan(input);
    const has_trust_plea = matches.some((m) => m.id === "VULNERABILITY" || m.id === "SUSPICIOUS");

    // 1. Resolve Entities mapping (Role -> Data)
    const entries = [
      { role: "AI", data: runtime.active_ai },
      { role: "USER", data: runtime.active_user },
      { role: "FRACTAL", data: runtime.active_fractal },
    ];

    // Vector Lifecycle Management
    await context_broker.manage_vector_lifecycle(entries, simulation_log);

    const entities = {};
    // Synchronous hydration of entities
    entries.forEach(({ role, data }) => {
      const raw = data || { name: role, role, fragments: [] };
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
      const fragments = {
        eternal: { physical: "", non_physical: "" },
        present: { physical: "", non_physical: "" },
      };
      filtered.forEach((f) => {
        const layer = f.layer?.toLowerCase();
        const field = f.type === "Physical" ? "physical" : "non_physical";
        if (fragments[layer] && fragments[layer][field] === "") {
          fragments[layer][field] = f.text;
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
        associated_ids: raw.associated_ids || [],
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
   */
  assemble_snapshot(history = []) {
    if (!history.length) return null;
    return history
      .map((m) => {
        const owner = m.character_name || (m.role === "user" ? "User" : "AI");
        const raw = m.content || "";
        const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        return `[${owner}]: ${clean_text(stripped, 500)}`;
      })
      .join("\n");
  },
  /**
   * Vector Lifecycle Manager
   * Scans future vectors and resolves them if they match semantic criteria in the recent simulation log.
   */
  async manage_vector_lifecycle(entries, simulation_log) {
    if (!simulation_log || simulation_log.length === 0) return;

    // We only check the most recent few messages to avoid resolving vectors based on ancient history
    const recent_log = simulation_log.slice(-3).map((m) => (m.content || "").toLowerCase()).join(" ");
    if (!recent_log) return;

    for (const { data } of entries) {
      if (!data || !Array.isArray(data.future) || data.future.length === 0) continue;

      const to_resolve = [];
      for (const vector of data.future) {
        if (!vector.text && (!vector.vector_tags || vector.vector_tags.length === 0)) continue;

        let matched = false;

        // Check if any specific vector tags were met
        if (vector.vector_tags) {
          for (const tag of vector.vector_tags) {
            if (tag && recent_log.includes(tag.toLowerCase())) {
              matched = true;
              break;
            }
          }
        }

        // Check if main keywords from the vector text are in the recent log
        if (!matched && vector.text) {
          const keywords = vector.text
            .toLowerCase()
            .split(/\W+/)
            .filter((w) => w.length > 4); // Only look for significant words

          let hit_count = 0;
          for (const keyword of keywords) {
             if (recent_log.includes(keyword)) {
                hit_count++;
             }
          }
          // Arbitrary threshold: if we match at least 2 significant words from the goal, it might be resolved
          if (hit_count >= 2 || (keywords.length > 0 && hit_count === keywords.length)) {
             matched = true;
          }
        }

        if (matched) {
          to_resolve.push(vector.id);
        }
      }

      if (to_resolve.length > 0) {
        // dynamic import once to avoid circular dependency and loop over to_resolve
        import("./vector-engine.js")
          .then(({ vector_engine }) => {
            for (const id of to_resolve) {
              vector_engine.resolve_vector(data, id, "MET_IN_SIMULATION");
            }
          })
          .catch((err) => console.warn("Vector resolution failed:", err));
      }
    }
  },

  /**
   * Relevance-based sorting for raw data points.
   */
  lexical_filter(data_points, objective) {
    if (!objective) return data_points;
    const keywords = objective
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);
    const get_text = (f) => (f.text || "").toLowerCase();
    return [...data_points].sort((a, b) => {
      const a_hit = keywords.some((k) => get_text(a).includes(k));
      const b_hit = keywords.some((k) => get_text(b).includes(k));
      return (b_hit ? 1 : 0) - (a_hit ? 1 : 0);
    });
  },
};
