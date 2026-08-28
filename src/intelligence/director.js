/**
 * src/intelligence/director.js
 * 📐 DIRECTOR DOMAIN MODULE — Quick Shot Normalization, JSON Extraction, & Actuators.
 *
 * Normalizes Director outputs, extracts quick-shot JSON schemas defensively,
 * applies Stage Spotlight choreography, and reconciles the Relational Mesh.
 *
 * Architecture:
 * 1. Constants & Value Maps
 * 2. Action & Speaker Normalizers
 * 3. Quick Shot Payload Normalizer
 * 4. Fallback Synthesizer
 * 5. Safe JSON Extraction & Output Parser
 * 6. Stage Spotlight Choreography & NPC Resolution
 * 7. Relational Mesh Actuator
 */

import { entities } from "@data";
import { escape_unescaped_json_quotes, extract_json_block, first_sentence, state_bridge } from "@utils";
import { parse_think_block } from "./parser.js";

// ── 1. Constants & Value Maps ─────────────────────────────────────────────────

export const STORY_STATUS_VALUES = ["IN_PROGRESS", "CONCLUDED", "COLLAPSED"];

const SPEAKER_AI_ALIASES = new Set(["ai", "ai_character", "character", "companion"]);
const SPEAKER_FRACTAL_ALIASES = new Set(["fractal", "world", "narrator", "environment", "scene"]);
const SPEAKER_NPC_PATTERN = /^npc(?::[^\s]+)?$/i;

// ── 2. Action & Speaker Normalizers ───────────────────────────────────────────

/**
 * Strips the `npc:` prefix so an actor identifier resolves to a bare ID.
 * @param {any} id
 * @returns {string}
 */
export function strip_npc_id(id) {
  if (typeof id !== "string") return "";
  return id.replace(/^npc:/i, "").trim();
}

/**
 * Normalizes a Director `next_action` into its canonical enum or NPC target.
 * Unknown values gracefully fall back to "AI_CHARACTER".
 * @param {any} raw
 * @returns {string}
 */
export function normalize_next_action(raw) {
  if (typeof raw !== "string") return "AI_CHARACTER";
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();

  if (SPEAKER_AI_ALIASES.has(lower) || upper === "AI_CHARACTER") return "AI_CHARACTER";
  if (SPEAKER_FRACTAL_ALIASES.has(lower) || upper === "FRACTAL") return "FRACTAL";
  if (upper === "GENESIS") return "GENESIS";
  if (upper === "EPILOGUE_CONCLUDED" || lower === "concluded") return "EPILOGUE_CONCLUDED";
  if (upper === "EPILOGUE_COLLAPSED" || lower === "collapsed") return "EPILOGUE_COLLAPSED";
  if (SPEAKER_NPC_PATTERN.test(trimmed)) return trimmed;

  return "AI_CHARACTER";
}

/**
 * Coerces a raw Director `speaker` value into the canonical delegation target.
 * @param {any} raw
 * @returns {"ai" | "fractal" | "npc"}
 */
export function normalize_speaker(raw) {
  if (typeof raw !== "string") return "ai";
  const value = raw.trim().toLowerCase();
  if (SPEAKER_AI_ALIASES.has(value)) return "ai";
  if (SPEAKER_FRACTAL_ALIASES.has(value)) return "fractal";
  if (SPEAKER_NPC_PATTERN.test(value)) return "npc";
  return "ai";
}

/**
 * Sanitizes director's note to a clean 1-3 line string.
 * @param {any} raw
 * @returns {string}
 */
export function normalize_directors_note(raw) {
  if (typeof raw !== "string") return "";
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);
  return lines.join("\n").slice(0, 300);
}

/**
 * Normalizes the Director's Stage Spotlight choreography.
 * @param {any} raw
 * @returns {{ enter: string[], exit: string[] }}
 */
export function normalize_in_scene_change(raw) {
  const base = raw && typeof raw === "object" ? raw : {};
  const clean = (list) => (Array.isArray(list) ? list : []).map(strip_npc_id).filter(Boolean);
  return { enter: clean(base.enter), exit: clean(base.exit) };
}

/**
 * Normalizes the Director's relational-web mutations.
 * @param {any} raw
 * @returns {string[]}
 */
export function normalize_relationships(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const r of raw) {
    if (typeof r !== "string") continue;
    const clean = r.trim().replace(/\s+/g, " ");
    if (!clean || !/→|->|—\s*>/i.test(clean)) continue;
    out.push(clean.slice(0, 160));
    if (out.length >= 6) break;
  }
  return out;
}

// ── 3. Quick Shot Payload Normalizer ──────────────────────────────────────────

/**
 * Normalizes an entire Director payload with defensive fallbacks for every field.
 * @param {any} payload
 * @returns {any}
 */
export function normalize_director_data(payload) {
  const base = payload && typeof payload === "object" ? payload : {};
  const keywords = Array.isArray(base.keywords)
    ? base.keywords
        .filter((k) => typeof k === "string" && Boolean(k.trim()))
        .map((k) => k.trim())
        .slice(0, 3)
    : [];

  const raw_action = base.next_action || base.speaker;
  const next_action = normalize_next_action(raw_action);
  const speaker = next_action.startsWith("npc") ? "npc" : next_action === "FRACTAL" ? "fractal" : "ai";
  const npc_id = speaker === "npc" ? strip_npc_id(next_action) : "";

  const story_status =
    next_action === "EPILOGUE_CONCLUDED"
      ? "CONCLUDED"
      : next_action === "EPILOGUE_COLLAPSED"
        ? "COLLAPSED"
        : STORY_STATUS_VALUES.includes(base.story_status)
          ? base.story_status
          : "IN_PROGRESS";

  const directors_note = normalize_directors_note(base.directors_note || base.directive);

  return {
    ...base,
    next_action,
    speaker,
    npc_id,
    keywords,
    directors_note,
    story_status,
    in_scene_change: normalize_in_scene_change(base.in_scene_change),
    dynamics_deltas: base.dynamics_deltas || {},
  };
}

// ── 4. Fallback Synthesizer ───────────────────────────────────────────────────

/**
 * Minimal-mutation fallback synthesized when Director JSON parsing fails.
 * @param {any} prev_data
 * @param {string} input
 * @param {any} bridge
 * @returns {any}
 */
export function synthesize_director_fallback(prev_data, input, bridge) {
  const monologue = String(prev_data?.internal_monologue || input || "").trim();
  const fallback = {
    _parse_error: true,
    internal_monologue: monologue || "The scene continues.",
    trigger_image: "false",
    speaker: "ai",
    keywords: [],
    story_status: "IN_PROGRESS",
  };

  const ai = bridge?.runtime?.active_ai;
  const user = bridge?.runtime?.active_user;
  const fractal = bridge?.runtime?.active_fractal;

  if (ai) {
    fallback.AI_CHARACTER = {
      state_append: { physical: "", non_physical: first_sentence(monologue) || "Reacts to the turn's events." },
      vector_append: [],
    };
  }
  if (user) {
    fallback.USER_PERSONA = {
      state_append: { physical: "", non_physical: first_sentence(input) || "" },
      vector_append: [],
    };
  }
  if (fractal) {
    fallback.FRACTAL = {
      state_append: { physical: "", non_physical: "" },
      vector_append: [{ content: `${fractal.name || "The environment"} shifts with the turn's events.`, type: "past", emotional_weight: 3 }],
    };
  }
  return fallback;
}

// ── 5. Safe JSON Extraction & Output Parser ───────────────────────────────────

/**
 * Extracts and sanitizes the Director's JSON payload from raw LLM output.
 * Falls back to raw prose parsing if bracketed JSON is missing or malformed.
 * @param {string} raw_text
 * @returns {any}
 */
export function parse_director_json(raw_text) {
  if (!raw_text || !raw_text.trim()) return null;

  const json_string = extract_json_block(raw_text);
  if (!json_string) {
    const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
    console.warn("[GameMaster] Director JSON missing brackets, falling back to raw prose.");
    state_bridge.app.log("[GameMaster] Director JSON missing brackets — using raw prose fallback", "warn");
    const extracted_think = parse_think_block(stripped).think;
    return normalize_director_data({ internal_monologue: extracted_think || stripped, _parse_error: true });
  }

  const cleaned_json = escape_unescaped_json_quotes(json_string);
  const sanitized_json = cleaned_json.replace(/:\s*\+([0-9]+(?:\.[0-9]+)?)/g, ": $1");

  try {
    const payload = JSON.parse(sanitized_json);
    if (payload.prose) delete payload.prose;
    return normalize_director_data(payload);
  } catch (parse_err) {
    console.warn("[GameMaster] Director JSON invalid, falling back to raw prose:", parse_err);
    const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
    const extracted_think = parse_think_block(stripped).think;
    return normalize_director_data({ internal_monologue: extracted_think || stripped, _parse_error: true });
  }
}

// ── 6. Stage Spotlight Choreography & NPC Resolution ──────────────────────────

/**
 * Normalizes an actor identifier (e.g. "npc:elias" -> "elias") and resolves it
 * against active NPCs by key or name.
 * @param {string} raw
 * @param {Record<string, any>} [npcs={}]
 * @param {boolean} [allow_id_like=false]
 * @returns {string | null}
 */
export function normalize_actor_id(raw, npcs = {}, allow_id_like = false) {
  if (!raw) return null;
  const id = String(raw).trim().replace(/^npc:/i, "");
  if (!id) return null;
  if (npcs[id]) return id;

  const by_name = Object.values(npcs).find(
    (n) =>
      String(n?.name || "")
        .trim()
        .toLowerCase() === id.toLowerCase(),
  );
  if (by_name) return by_name.id;
  if (allow_id_like && /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)) return id;
  return null;
}

/**
 * Resolves a delegated NPC by id (bare or `npc:<id>`) or by name.
 * @param {any} bridge
 * @param {string} npc_id
 * @returns {any | null}
 */
export function resolve_npc_entity(bridge, npc_id) {
  if (!npc_id) return null;
  const npcs = bridge.runtime?.active_npcs || {};
  const resolved = normalize_actor_id(npc_id, npcs);
  return resolved ? npcs[resolved] || null : null;
}

/**
 * Applies the Director's Stage Spotlight choreography (enter/exit) to
 * runtime.in_scene_npc_ids.
 * @param {any} bridge
 * @param {{ enter?: string[], exit?: string[] } | null} change
 * @returns {Promise<boolean>}
 */
export async function apply_in_scene_change(bridge, change) {
  if (!change || typeof change !== "object") return false;
  const npcs = bridge.runtime?.active_npcs || {};
  const current = new Set(bridge.runtime?.in_scene_npc_ids || []);

  let changed = false;
  for (const id of change.enter || []) {
    const resolved = normalize_actor_id(id, npcs, true);
    if (resolved && !current.has(resolved)) {
      current.add(resolved);
      changed = true;
    }
  }
  for (const id of change.exit || []) {
    const resolved = normalize_actor_id(id, npcs);
    if (resolved && current.delete(resolved)) changed = true;
  }
  if (changed && bridge.runtime) {
    bridge.runtime.in_scene_npc_ids = [...current];
  }
  return changed;
}

// ── 7. Relational Mesh Actuator ───────────────────────────────────────────────

/**
 * Applies the Director's relational-web mutations across all participating entities.
 * @param {any} bridge
 * @param {string[]} rels
 */
export async function apply_relationships(bridge, rels) {
  const edges = Array.isArray(rels) ? rels : [];
  if (!edges.length) return;

  const targets = new Map();
  const register = (e) => {
    if (e?.id) targets.set(String(e.id), e);
  };
  register(bridge.runtime?.active_ai);
  register(bridge.runtime?.active_user);
  register(bridge.runtime?.active_fractal);
  for (const n of Object.values(bridge.runtime?.active_npcs || {})) register(n);

  const by_name = new Map();
  for (const e of targets.values()) {
    by_name.set(
      String(e.name || "")
        .trim()
        .toLowerCase(),
      e,
    );
  }

  const find = (raw) => {
    const key = String(raw || "").trim();
    if (!key) return null;
    return targets.get(key) || by_name.get(key.toLowerCase()) || null;
  };

  const dirty = new Set();
  for (const edge of edges) {
    const m = String(edge).match(/^\s*(.+?)\s*(?:→|->|—>\s*)\s*(.+?)\s*:\s*(.+)$/);
    if (!m) continue;
    const [, src_raw, tgt_raw, dyn] = m;
    const source = find(src_raw.trim());
    if (!source) continue;
    const clean_edge = `${src_raw.trim()} → ${tgt_raw.trim()}: ${dyn.trim()}`.slice(0, 160);
    const list = Array.isArray(source.relationships) ? source.relationships.slice() : [];
    const target_key = tgt_raw.trim().toLowerCase();
    const idx = list.findIndex((r) => {
      const before_colon = String(r).split(":")[0];
      const has_arrow = /→|->|—>/i.test(before_colon);
      const target_name = has_arrow
        ? before_colon
            .split(/→|->|—>/i)
            .pop()
            .trim()
            .toLowerCase()
        : before_colon.trim().toLowerCase();
      return target_name && (target_name === target_key || target_key.includes(target_name) || target_name.includes(target_key));
    });
    if (idx >= 0) list[idx] = clean_edge;
    else list.unshift(clean_edge);
    source.relationships = list.slice(0, 12);
    dirty.add(source);
  }

  for (const source of dirty) {
    try {
      const source_type = source.type === "fractal" ? "fractal" : "character";
      const updated = await entities.upsert(source_type, { ...source, relationships: source.relationships });
      const type = source.type === "fractal" ? "fractal" : "character";
      if (type === "fractal" && bridge.runtime?.active_fractal?.id === source.id) bridge.runtime.active_fractal = updated;
      else if (type === "character") {
        if (bridge.runtime?.active_ai?.id === source.id) bridge.runtime.active_ai = updated;
        else if (bridge.runtime?.active_user?.id === source.id) bridge.runtime.active_user = updated;
        else if (bridge.runtime?.active_npcs?.[source.id]) bridge.runtime.active_npcs = { ...bridge.runtime.active_npcs, [source.id]: updated };
      }
      state_bridge.app?.log(`[GameMaster] Relational web updated: ${source.name}.`, "system");
    } catch (err) {
      state_bridge.app?.log(`[GameMaster] Relationship update failed: ${err?.message || err}`, "warn");
    }
  }
}

/**
 * CHANGELOG
 * - 2026-08-28: Ground-up deconstruct & refactor: normalized action and speaker resolution, defensive JSON extraction, Stage Spotlight choreography, and unified Relational Mesh persistence.
 */
