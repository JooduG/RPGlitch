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
 * 8. Shot 1 Director Execution Driver (execute_director_shot)
 */

import { entities } from "@data";
import { extract_json_block, collapse_whitespace, state_bridge } from "@utils";
import { llm_service, raw_stop_reason, raw_to_text } from "@platform";
import { compile_prompt } from "./prompts.js";
import { extract_and_repair_json, parse_think_block, validate_and_repair_response } from "./parser.js";

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
  if (!raw) return "AI_CHARACTER";
  if (typeof raw === "object" && raw.genesis) return "GENESIS";
  if (typeof raw !== "string") {
    console.warn(`[Director] next_action is not a valid action (${typeof raw}) — falling back to AI_CHARACTER.`);
    return "AI_CHARACTER";
  }
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();

  if (SPEAKER_AI_ALIASES.has(lower) || upper === "AI_CHARACTER") return "AI_CHARACTER";
  if (SPEAKER_FRACTAL_ALIASES.has(lower) || upper === "FRACTAL") return "FRACTAL";
  if (upper === "GENESIS") return "GENESIS";
  if (upper === "EPILOGUE_CONCLUDED" || lower === "concluded") return "EPILOGUE_CONCLUDED";
  if (upper === "EPILOGUE_COLLAPSED" || lower === "collapsed") return "EPILOGUE_COLLAPSED";
  if (SPEAKER_NPC_PATTERN.test(trimmed)) return trimmed;

  console.warn(`[Director] next_action "${trimmed}" is not a valid action — falling back to AI_CHARACTER.`);
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
 * Sanitizes director's note to a clean 1-5 line string.
 * @param {any} raw
 * @returns {string}
 */
export function normalize_directors_note(raw) {
  if (typeof raw !== "string") return "";
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
  return lines.join("\n").slice(0, 500);
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
    const clean = collapse_whitespace(r);
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
        .slice(0, 5)
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
  const visual_staging = typeof base.visual_staging === "string" ? base.visual_staging.trim() : "";

  const spotlight_source = base.spotlight || base.in_scene_change;
  const in_scene_change = normalize_in_scene_change(spotlight_source);
  const raw_genesis = base.next_action?.genesis || base.spotlight?.genesis || base.genesis;
  const genesis =
    raw_genesis && typeof raw_genesis === "object"
      ? {
          name: String(raw_genesis.name || "").trim(),
          description: String(raw_genesis.description || "").trim(),
          ...(raw_genesis.signature_color ? { signature_color: String(raw_genesis.signature_color).trim() } : {}),
          ...(raw_genesis.speaking_style ? { speaking_style: String(raw_genesis.speaking_style).trim() } : {}),
        }
      : undefined;

  return {
    ...base,
    next_action,
    speaker,
    npc_id,
    keywords,
    directors_note,
    visual_staging,
    story_status,
    in_scene_change,
    ...(genesis ? { genesis } : {}),
    dynamics_deltas: base.dynamics_deltas || base.mutations?.AI_CHARACTER?.dynamics_deltas || {},
    mutations: base.mutations || {},
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
export function synthesize_director_fallback(prev_data, input, _bridge) {
  const thought = String(prev_data?._thought_process || prev_data?.internal_monologue || input || "The scene continues.").trim();
  return {
    _parse_error: true,
    _thought_process: thought,
    internal_monologue: thought,
    next_action: "AI_CHARACTER",
    keywords: [],
    directors_note: "Continue the scene with grounded immersion and physical causality.",
    visual_staging: "",
    dynamics_deltas: {},
    in_scene_change: { enter: [], exit: [] },
    story_status: "IN_PROGRESS",
  };
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

  const parsed = extract_and_repair_json(raw_text, null);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    if (parsed.prose) delete parsed.prose;
    return normalize_director_data(parsed);
  }

  const json_string = extract_json_block(raw_text);
  if (!json_string) {
    console.warn("[GameMaster] Director JSON missing brackets, falling back to raw prose.");
    state_bridge.app.log("[GameMaster] Director JSON missing brackets — using raw prose fallback", "warn");
  } else {
    console.warn("[GameMaster] Director JSON invalid, falling back to raw prose.");
  }

  const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
  const extracted_think = parse_think_block(stripped).think;
  return normalize_director_data({ internal_monologue: extracted_think || stripped, _parse_error: true });
}

// ── 6. Stage Spotlight Choreography & NPC Resolution ──────────────────────────

/**
 * Normalizes an actor identifier (e.g. "npc:ELIAS" -> "ELIAS") and resolves it
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

// ── 8. Shot 1 Director Execution Driver ───────────────────────────────────────

/**
 * Executes Shot 1 (Director Staging & Turn Evaluation):
 * 1. Compiles Director planning prompt via compile_prompt("director").
 * 2. Dispatches LLM call with retry and refusal detection.
 * 3. On refusal or JSON truncation, retries gracefully with the terse director directive.
 * 4. Synthesizes minimal fallback if parsing fails completely.
 * 5. Normalizes the final payload under full domain contracts.
 *
 * @param {any} payload - Hydrated turn context payload
 * @param {any} snapshot - World and entity dynamics snapshot
 * @param {object} [options={}] - Execution options
 * @param {string} [options.node_id] - Execution turn node identifier
 * @param {string} [options.input] - User input string
 * @param {boolean} [options.is_opening_turn] - Whether this is round 1 opening turn
 * @param {Function} [options.execute_with_retry] - Retry wrapper function
 * @returns {Promise<{ director_data: any, director_duration_ms: number }>}
 */
export async function execute_director_shot(payload, snapshot, options = {}) {
  const { node_id = "turn", input = "", is_opening_turn = false, execute_with_retry, ...llm_options } = options;
  const retry_caller = typeof execute_with_retry === "function" ? execute_with_retry : async (fn) => fn();

  state_bridge.app?.log("[GameMaster] Context hydrated. Physics resolved. Entering DIRECTOR_TURN...", "system");
  const director_prompt = compile_prompt("director", { ...payload, compressed_snapshot: snapshot });

  const director_call = async (terse = false) => {
    let is_terse_attempt = terse;
    return await retry_caller(
      async () => {
        const terse_prompt = is_terse_attempt ? compile_prompt("director", { round: payload?.round, terse: true }) : null;
        const response = await llm_service.generate(
          {
            system: is_terse_attempt ? terse_prompt.system : director_prompt.system,
            task: is_terse_attempt ? terse_prompt.task : director_prompt.task,
            messages: [],
            role: "system",
            node_id: `${node_id}-director`,
          },
          {
            ...llm_options,
            json: true,
            silent: true,
            raw: true,
            onToken: null,
          },
        );
        const text = raw_to_text(response);
        const check = validate_and_repair_response(text);
        if (check.is_refused) {
          is_terse_attempt = true;
          throw new Error("AI_REFUSAL_DETECTED");
        }
        return response;
      },
      1,
      500,
    );
  };

  const start_time = performance.now();
  let director_raw;
  try {
    director_raw = await director_call(false);
  } catch (error) {
    state_bridge.app?.log(`[GameMaster] Primary Director call failed: ${error?.message || error} — attempting terse recovery...`, "warn");
    director_raw = await director_call(true);
  }

  let director_text = raw_to_text(director_raw);
  let director_data = parse_director_json(director_text) || {};

  // Truncation recovery
  if (director_data._parse_error) {
    const reason = raw_stop_reason(director_raw);
    state_bridge.app?.log(`[GameMaster] Director JSON truncated${reason ? ` (${reason})` : ""} — retrying with terse directive...`, "warn");
    try {
      const terse_raw = await director_call(true);
      const terse_text = raw_to_text(terse_raw);
      const retry_data = parse_director_json(terse_text) || {};
      if (!retry_data._parse_error) {
        if (!retry_data._thought_process && director_data?._thought_process) {
          retry_data._thought_process = director_data._thought_process;
        }
        if (!retry_data._thought_process) {
          retry_data._thought_process = "High tension turn evaluation completed.";
        }
        director_data = retry_data;
      }
    } catch (terse_error) {
      state_bridge.app?.log(`[GameMaster] Terse Director retry failed: ${terse_error?.message || terse_error}`, "warn");
    }
  }

  const director_duration_ms = Math.round(performance.now() - start_time);
  if (typeof state_bridge.runtime?.record_director_latency === "function") {
    state_bridge.runtime.record_director_latency(director_duration_ms);
  }

  if (!director_data || director_data._parse_error) {
    state_bridge.app?.log("[GameMaster] Director degraded — applying minimal-mutation fallback.", "warn");
    director_data = synthesize_director_fallback(director_data, input, state_bridge);
  }

  director_data = normalize_director_data(director_data);
  director_data.first_contact = Boolean(is_opening_turn || director_data.first_contact);

  return { director_data, director_duration_ms };
}

/**
 * CHANGELOG
 * - 2026-09-25: `normalize_relationships` now collapses whitespace via the shared `collapse_whitespace` instead of an inline regex.
 * - 2026-09-21: Terse fallback now compiles `compile_prompt("director", { round, terse: true })` — the retired `director_terse` mode collapsed into the `director` manifest record plus a `terse` flag.
 * - 2026-09-19: Opening-turn first-contact is emitted as an explicit `director_data.first_contact` flag instead of a synthetic "first_contact" keyword, so it can no longer pollute the somatic keyword channel or displace a real keyword.
 * - 2026-09-19: Replaced stale prompt_builder docstring and test references with unified compile_prompt("director") under P4 Zero Backwards Compatibility.
 * - 2026-09-18: Routed Director shot execution through compile_prompt("director") and switchboard compile_prompt("director_terse").
 * - 2026-09-16: Zero Backwards Compatibility (P4) — Migrated terse retry call from deprecated render_terse_director_task to compile_prompt("director_terse").
 * - 2026-09-13: Encapsulated Shot 1 execution: implemented execute_director_shot in director.js, absorbing LLM dispatch, refusal recovery, and terse fallback from story.js.
 * - 2026-09-11: Grand Purification: prompt compilation moved to builder.js, DIRECTOR_PROTOCOLS moved to modules/protocols.js, leaving director.js a 100% pure execution & normalization engine.
 * - 2026-09-11: Modularized prompt blocks: imported SCHEMA, TASK_RULES, SPOTLIGHT_RULES, and SYSTEM_ROLES from modules/.
 * - 2026-09-11: Consolidated Director domain: merged director-prompt.js into director.js, unifying prompt compilation, schemas, spotlight choreography, and normalization.
 * - 2026-09-06: Added support for next_action.genesis objects in normalize_next_action and normalize_director_data.
 * - 2026-09-05: Added support for unified spotlight schema (enter, exit, genesis) in normalize_director_data.
 * - 2026-08-28: Ground-up deconstruct & refactor: normalized action and speaker resolution, defensive JSON extraction, Stage Spotlight choreography, and unified Relational Mesh persistence.
 * - 2026-09-04: normalize_next_action warns on unknown/non-string next_action; synthesize_director_fallback also emits internal_monologue so the fallback keeps its think block.
 */
