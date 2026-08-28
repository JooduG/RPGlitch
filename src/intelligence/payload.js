/**
 * src/intelligence/payload.js
 * 📦 PAYLOAD BUILDER — State Snapshot & Intelligence Payload Assembler
 *
 * Hydrates, cleans, and packages raw simulation state into an IntelligencePayload
 * for consumption by the Story Pipeline, Director, and Prompt Builders.
 */

import { state_bridge, get_value, safe_parse_pseudo_json, CLOTHING_KEYS, CLEAR_TOKENS, AGGREGATE_KEYS } from "@utils";
import { PROFILE_FIELD_CATALOG } from "@data";
import { ensure_embeddings } from "@platform";
import { clean_text } from "./parser.js";
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

/**
 * Converts entity data into raw statistical data points.
 * @param {any} entity
 * @returns {DataPoint[]}
 */
export function to_data_points(entity) {
  if (!entity) return [];
  /** @type {DataPoint[]} */
  const list = [];
  Object.entries(PROFILE_FIELD_CATALOG).forEach(([field_id, metadata]) => {
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

    // 1.5. NPC WORLD CAST — hydrate the story's secondary characters for Director
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

/**
 * Pure simulation function that merges newly emitted [KEY: VALUE] bracket directives
 * into an entity's present physical/non-physical state field.
 * @param {string} current_field_value
 * @param {string} new_prose
 * @returns {string}
 */
export const merge_prose_into_field = (current_field_value, new_prose) => {
  if (!new_prose || !new_prose.trim()) return current_field_value || "";

  const MAX_FIELD_CHARS = 2000;
  const parsed = safe_parse_pseudo_json(current_field_value);
  const clean_new_prose = new_prose.trim();

  // Plain prose field (no structured keys, or raw-prose sentinel from safe_parse_pseudo_json)
  if (!parsed || parsed.__raw_prose__ || Object.keys(parsed).length === 0) {
    const existing = (current_field_value || "").trim();
    let result = !existing ? clean_new_prose : `${existing}\n${clean_new_prose}`;
    if (result.length > MAX_FIELD_CHARS) {
      result = result.substring(result.length - MAX_FIELD_CHARS);
    }
    return result;
  }

  // 1. Extract bracketed [KEY: Value] directives first
  const bracketed_regex = /\[([A-Z_ ]{3,25}):\s*([\s\S]*?)\]/g;
  let remaining_prose = clean_new_prose;
  let match;
  const key_updates = [];

  while ((match = bracketed_regex.exec(clean_new_prose)) !== null) {
    const full_match = match[0];
    const raw_key = match[1].toUpperCase().replace(/\s+/g, "_");
    const raw_val = match[2].trim();
    if (raw_val) {
      key_updates.push({ key: raw_key, val: raw_val });
      remaining_prose = remaining_prose.replace(full_match, "").trim();
    }
  }

  // 2. Extract unbracketed KEY: Value segments if any
  const unbracketed_regex = /(?:^|,\s*|\s*)([A-Z_]{3,15}):\s*([^,[\]]+(?:\s+[^,[\]]+)*)/g;
  while ((match = unbracketed_regex.exec(remaining_prose)) !== null) {
    const full_match = match[0];
    const raw_key = match[1].toUpperCase();
    const raw_val = match[2].trim();
    if (raw_val) {
      key_updates.push({ key: raw_key, val: raw_val });
      remaining_prose = remaining_prose.replace(full_match, "").trim();
    }
  }

  remaining_prose = remaining_prose
    .replace(/^[\s,;[\]]+|[\s,;[\]]+$/g, "")
    .replace(/,\s*,+/g, ",")
    .trim();

  // Apply structured key updates in sequence to respect hierarchy
  for (const { key, val } of key_updates) {
    let target_key = key;
    const is_clear_token = CLEAR_TOKENS.has(val.toLowerCase());

    // Wildcard purge: [CLOTHING: none] strips every clothing key at once.
    if (key === "CLOTHING" && is_clear_token) {
      for (const ck of CLOTHING_KEYS) delete parsed[ck];
      continue;
    }

    if (CLOTHING_KEYS.includes(key) && is_clear_token) {
      delete parsed[key];
      continue;
    }

    if (is_clear_token) {
      delete parsed[key];
      continue;
    }

    if (AGGREGATE_KEYS.has(key)) {
      const incoming = val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const existing = parsed[key];
      const list = Array.isArray(existing)
        ? existing
        : existing
          ? String(existing)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      for (const item of incoming) {
        if (item && !list.includes(item)) list.push(item);
      }
      parsed[key] = list;
      continue;
    }

    if (key === "CLOTHING" && parsed.SHIRT) target_key = "SHIRT";
    if (key === "SHIRT" && parsed.CLOTHING) target_key = "CLOTHING";
    parsed[target_key] = val;
  }

  // Append any remaining unstructured prose to CONDITION
  if (remaining_prose) {
    const cond_key = parsed.CONDITION ? "CONDITION" : parsed.condition ? "condition" : "CONDITION";
    if (parsed[cond_key]) {
      const clean_existing = parsed[cond_key].replace(/^[\s,]+|[\s,]+$/g, "").replace(/,\s*,+/g, ", ");
      parsed[cond_key] = `${clean_existing}, ${remaining_prose}`;
    } else {
      parsed[cond_key] = remaining_prose;
    }
  }

  // Clean up double commas inside all values of parsed
  for (const k in parsed) {
    if (typeof parsed[k] === "string") {
      parsed[k] = parsed[k].replace(/^[\s,]+|[\s,]+$/g, "").replace(/,\s*,+/g, ", ");
    }
  }

  let lines = Object.entries(parsed)
    .map(([k, v]) => `[${k}: ${String(Array.isArray(v) ? v.join(", ") : v).replace(/[[]]/g, "")}]`)
    .join(" ");

  if (lines.length > MAX_FIELD_CHARS) {
    lines = lines.substring(lines.length - MAX_FIELD_CHARS);
  }

  return lines;
};
