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

    // Extract raw log text without truncation or owner headers for lifecycle matching
    const full_log_text = Array.isArray(simulation_log)
      ? simulation_log
          .map((m) => (m.text || m.content || "").replace(/<think>[\s\S]*?<\/think>/gi, ""))
          .join(" ")
      : "";

    // 1. Resolve Entities mapping (Role -> Data)
    const entries = [
      { role: "AI", data: runtime.active_ai },
      { role: "USER", data: runtime.active_user },
      { role: "FRACTAL", data: runtime.active_fractal },
    ];

    // Lifecycle Management: Resolve satisfied future vectors asynchronously without blocking hydration
    Promise.all(
      entries.map(({ data }) => context_broker.manage_vector_lifecycle(data, full_log_text)),
    ).catch((err) => console.warn("[Vector Lifecycle] Failed to auto-resolve vectors:", err));

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
   * Dynamically resolves FUTURE_VECTOR items based on recent simulation log keywords.
   */
  async manage_vector_lifecycle(entity, recent_log_text) {
    if (!entity || !Array.isArray(entity.future) || entity.future.length === 0) return;
    if (!recent_log_text) return;

    const log_lower = recent_log_text.toLowerCase();

    // Create a Set of lowercase words for O(1) lookup
    const log_words = new Set(log_lower.split(/[\s,.;:!?()"'[\]{}]+/));

    // Helper to safely escape strings for RegExp if needed
    const escape_regex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const vectors_to_resolve = [];

    for (const vector of entity.future) {
      let is_resolved = false;

      // 1. Check strict vector tags
      if (Array.isArray(vector.vector_tags)) {
        is_resolved = vector.vector_tags.some((tag) => {
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

      // 2. Check significant keywords from the vector text if no tag match
      if (!is_resolved && vector.text) {
        // Extract deduplicated words > 4 chars
        const words = vector.text
          .toLowerCase()
          .split(/[\s,.;:!?()"'[\]{}]+/)
          .filter((w) => w.length > 4);

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

      if (is_resolved) {
        vectors_to_resolve.push(vector.id);
      }
    }

    if (vectors_to_resolve.length > 0) {
      const { vector_engine } = await import("./vector-engine.js");
      for (const id of vectors_to_resolve) {
        vector_engine.resolve_vector(entity, id, "AUTO_RESOLVED");
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
