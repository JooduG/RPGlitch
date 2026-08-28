/**
 * src/intelligence/director.js
 * 📐 DIRECTOR DOMAIN MODULE — Payload Normalization, Safe JSON Extraction, & Fallbacks.
 *
 * Normalizes Director outputs, extracts quick-shot JSON schemas defensively,
 * and synthesizes fallback payloads when output is malformed.
 */

import { detox_prose, SIGNATURE_COLORS, entities } from "@data";
import { escape_unescaped_json_quotes, first_sentence, state_bridge } from "@utils";
import { extract_json_block, parse_think_block } from "./parser.js";

export const STORY_STATUS_VALUES = ["IN_PROGRESS", "CONCLUDED", "COLLAPSED"];

export const NEXT_ACTION_VALUES = ["AI_CHARACTER", "FRACTAL", "GENESIS", "EPILOGUE_CONCLUDED", "EPILOGUE_COLLAPSED"];

const SPEAKER_AI_ALIASES = ["ai", "ai_character", "character", "companion"];
const SPEAKER_FRACTAL_ALIASES = ["fractal", "world", "narrator", "environment", "scene"];
const SPEAKER_NPC_PATTERN = /^npc(?::[^\s]+)?$/i;

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

  if (SPEAKER_AI_ALIASES.includes(lower) || upper === "AI_CHARACTER") return "AI_CHARACTER";
  if (SPEAKER_FRACTAL_ALIASES.includes(lower) || upper === "FRACTAL") return "FRACTAL";
  if (upper === "GENESIS") return "GENESIS";
  if (upper === "EPILOGUE_CONCLUDED" || lower === "concluded") return "EPILOGUE_CONCLUDED";
  if (upper === "EPILOGUE_COLLAPSED" || lower === "collapsed") return "EPILOGUE_COLLAPSED";
  if (SPEAKER_NPC_PATTERN.test(trimmed)) return trimmed;

  return "AI_CHARACTER";
}

/**
 * Coerces a raw Director `speaker` value into the canonical delegation target.
 * Unknown/empty values always degrade to "ai" so a broken payload can never
 * strand a turn without an executor.
 * @param {any} raw
 * @returns {"ai" | "fractal" | "npc"}
 */
export function normalize_speaker(raw) {
  if (typeof raw !== "string") return "ai";
  const value = raw.trim().toLowerCase();
  if (SPEAKER_AI_ALIASES.includes(value)) return "ai";
  if (SPEAKER_FRACTAL_ALIASES.includes(value)) return "fractal";
  if (SPEAKER_NPC_PATTERN.test(value)) return "npc";
  return "ai";
}

/**
 * Sanitizes director's note to 1-3 lines string.
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
 * Normalizes an entire Director payload with defensive fallbacks for every
 * schema field. Idempotent and safe on null/non-object input.
 * @param {any} payload
 * @returns {any}
 */
export function normalize_director_data(payload) {
  const base = payload && typeof payload === "object" ? payload : {};
  const keywords = Array.isArray(base.keywords)
    ? base.keywords
        .filter((k) => typeof k === "string" && k.trim())
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

  const result = {
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

  // Strip legacy fields from Track 1 schema output
  delete result.promotions;
  delete result.relationships;
  delete result.genesis;

  return result;
}

/**
 * Normalizes the Director's relational-web mutations — directed
 * `[Source] → [Target]: [Dynamic]` edges. Only string edges carrying a
 * direction marker survive; count and length are capped defensively so a
 * runaway payload can never bloat an entity's relationships array.
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

/**
 * Normalizes Director genesis requests — brand-new recurring NPCs the kernel
 * should spawn. Ids are NEVER minted here (the kernel assigns them); names and
 * descriptions are sanitized and capped so the model cannot inject junk.
 * @param {any} raw
 * @returns {Array<{ name: string, description: string, role_tier: number, voice_register: string, signature_color: string }>}
 */
export function normalize_genesis(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const g of raw) {
    const base = g && typeof g === "object" ? g : {};
    const name = String(base.name || "")
      .trim()
      .slice(0, 60);
    if (!name) continue;
    const tier = Number(base.role_tier);
    const color = String(base.signature_color || "").trim();
    out.push({
      name,
      description: String(base.description || "")
        .trim()
        .slice(0, 240),
      role_tier: Number.isFinite(tier) ? Math.max(1, Math.min(3, Math.round(tier))) : 1,
      voice_register: String(base.voice_register || "")
        .trim()
        .slice(0, 40),
      signature_color: SIGNATURE_COLORS.includes(color) ? color : "",
    });
    if (out.length >= 2) break;
  }
  return out;
}

/**
 * Maps a normalized speaker target onto the engine that executes the turn.
 * @param {"ai" | "fractal" | "npc"} [speaker]
 * @returns {"character" | "narrator" | "npc"}
 */
export function resolve_speaker_engine(speaker = "ai") {
  if (speaker === "fractal") return "narrator";
  if (speaker === "npc") return "npc";
  return "character";
}

/**
 * Strips the `npc:` prefix so a delegated speaker or cast id always resolves
 * to a bare entity id.
 * @param {any} id
 * @returns {string}
 */
export function strip_npc_id(id) {
  if (typeof id !== "string") return "";
  return id.replace(/^npc:/i, "").trim();
}

/**
 * Cleans an array of NPC ids (enter/exit lists).
 * @param {any} list
 * @returns {string[]}
 */
function clean_npc_list(list) {
  return (Array.isArray(list) ? list : []).map(strip_npc_id).filter(Boolean);
}

/**
 * Normalizes the Director's Stage Spotlight choreography.
 * @param {any} raw
 * @returns {{ enter: string[], exit: string[] }}
 */
export function normalize_in_scene_change(raw) {
  const base = raw && typeof raw === "object" ? raw : {};
  return { enter: clean_npc_list(base.enter), exit: clean_npc_list(base.exit) };
}

/**
 * Normalizes Director promotions (genesis tier bumps) to a canonical list of
 * `{ id, tier }` (tier clamped to 2|3 — tier 1 is the ephemeral default).
 * @param {any} raw
 * @returns {Array<{ id: string, tier: 2 | 3 }>}
 */
export function normalize_promotions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (typeof p === "string") return { id: strip_npc_id(p), tier: 2 };
      const id = strip_npc_id(p?.id ?? p?.npc_id);
      const tier = Number(p?.tier);
      const clamped = Number.isFinite(tier) ? Math.max(2, Math.min(3, Math.round(tier))) : 2;
      return { id, tier: /** @type {2 | 3} */ (clamped) };
    })
    .filter((p) => p.id);
}

/**
 * MINIMAL-MUTATION FALLBACK — when the Director JSON could not be parsed even
 * after a terse retry, synthesize just enough mutations that entity memory and
 * dynamics never freeze for a whole turn. Prevents the present/future stall that
 * occurred whenever the Director fell back to raw prose.
 * @param {any} prev_data - the failed parse result (may be undefined).
 * @param {string} input - the user's current input.
 * @param {any} bridge - the state bridge (for runtime entities).
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

/**
 * Scrubs banned somatic idioms out of Director state mutations before they are
 * applied, so clichéd phrases never seed prompt history for future turns
 * (the "Director crutch echo" loop).
 * @param {any} mutations
 * @returns {any}
 */
export function scrub_state_mutations(mutations) {
  if (!mutations || typeof mutations !== "object") return mutations;
  for (const key of ["AI_CHARACTER", "USER_PERSONA", "FRACTAL"]) {
    const m = mutations[key];
    if (m?.state_append && typeof m.state_append === "object") {
      if (typeof m.state_append.physical === "string" && m.state_append.physical.trim()) {
        m.state_append.physical = detox_prose(m.state_append.physical, "plain");
      }
      if (typeof m.state_append.non_physical === "string" && m.state_append.non_physical.trim()) {
        m.state_append.non_physical = detox_prose(m.state_append.non_physical, "plain");
      }
    }
  }
  return mutations;
}

/**
 * Helper to extract Director's JSON from a raw string.
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
    if (payload.prose) {
      delete payload.prose;
    }
    return normalize_director_data(payload);
  } catch (parse_err) {
    console.warn("[GameMaster] Director JSON invalid, falling back to raw prose:", parse_err);
    const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
    const extracted_think = parse_think_block(stripped).think;
    return normalize_director_data({ internal_monologue: extracted_think || stripped, _parse_error: true });
  }
}

// =========================================================================
// STAGE SPOTLIGHT & RELATIONAL MESH ACTUATORS
// =========================================================================

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
 * Resolves a delegated NPC by id (bare or `npc:<id>`) or by case-insensitive
 * name against the runtime world cast.
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

/**
 * Applies the Director's relational-web mutations — directed
 * `[Source] → [Target]: [Dynamic]` edges resolved against the active trio and
 * world cast (by id or case-insensitive name).
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
  for (const e of targets.values())
    by_name.set(
      String(e.name || "")
        .trim()
        .toLowerCase(),
      e,
    );
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
