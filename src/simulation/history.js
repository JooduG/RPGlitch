/**
 * src/simulation/history.js
 * ============================================================================
 * 📜 TURN HISTORY & NARRATIVE TRANSCRIPT DOMAIN (Rank 1, pure simulation)
 * ============================================================================
 *
 * Canonical home for role canonicalization, beat normalization, history
 * collapsing / filtering / serialization, transcript reconstruction, tempo
 * scoring, turn summaries, speaker resolution, write-guard predicates, and
 * story-title decomposition.
 *
 * Phase 2 unification: merged from `src/utils/text.js` (role + history +
 * title + guard sections) + `turns.js#calculate_turn_tempo`,
 * `turns.js#build_turn_summary`, `turns.js#reconstruct_history_from_feed` +
 * `sessions.svelte.js#match_speaker_snapshots` +
 * `log.svelte.js#resolve_entity_id_by_name`.
 *
 * Pure, stateless. No Svelte runes, no IndexedDB, no DOM.
 * Imports only Rank 0 (`@config`, `@utils`) and the sibling `llm-output.js`.
 * ============================================================================
 */

import { CANONICAL_ROLES, LENGTH_THRESHOLDS } from "@config";
import { collapse_whitespace, truncate_at_word } from "@utils";
import { strip_cognition_blocks } from "./llm-output.js";

/**
 * Maps an entry/message role to its human-readable display label used in
 * history envelopes (`User` / `Fractal` / `Character`).
 * @param {string | null | undefined} role
 * @returns {"User" | "Fractal" | "Character"}
 */
function role_display_label(role) {
  const key = String(role || "").toLowerCase();
  if (key === "user" || key === "user_persona") return "User";
  if (key === "fractal") return "Fractal";
  return "Character";
}

/**
 * Resolves any raw role string to its canonical Sovereign RPGlitch role.
 *
 * @param {string|null|undefined} role
 * @returns {"user" | "ai" | "npc" | "fractal" | "system" | string}
 */
export function canonicalize_role(role) {
  const normalized = String(role || "")
    .toLowerCase()
    .trim();
  if (normalized === "user" || normalized === "user_persona") {
    return CANONICAL_ROLES.USER;
  }
  if (normalized === "ai" || normalized === "ai_character" || normalized === "model" || normalized === "assistant") {
    return CANONICAL_ROLES.AI;
  }
  if (normalized === "npc") {
    return CANONICAL_ROLES.NPC;
  }
  if (normalized === "fractal" || normalized === "prologue" || normalized === "epilogue" || normalized === "narrator") {
    return CANONICAL_ROLES.FRACTAL;
  }
  if (normalized === "system" || normalized === "telemetry") {
    return CANONICAL_ROLES.SYSTEM;
  }
  return role ? String(role).toLowerCase().trim() : CANONICAL_ROLES.AI;
}

/**
 * Canonical normalizer for turn beats, simulation log rows, and narrative dialog.
 * Unifies role mapping, cognition stripping, whitespace normalization, speaker
 * attribution, and image attachments into a clean, frozen record.
 */
export function normalize_history_beat(entry, options = {}) {
  if (!entry || typeof entry !== "object") return null;

  const { include_cognition = false, normalize_whitespace = false, max_chars, text_source = "content", label_policy = "entry", label_fallback } = options;

  const raw_role = String(entry.role || "");
  const canonical_role = canonicalize_role(raw_role);

  const raw_text = text_source === "text" ? entry?.text : (entry?.content ?? entry?.text);
  let text = String(raw_text ?? "");
  if (!include_cognition) {
    text = strip_cognition_blocks(text);
  }
  text = text.trim();
  if (normalize_whitespace) {
    text = collapse_whitespace(text);
  }
  if (max_chars && max_chars > 0) {
    text = truncate_at_word(text, max_chars);
  }

  const fallback =
    label_fallback ??
    (label_policy === "visual" ? "narrator"
    : canonical_role === CANONICAL_ROLES.USER ? "User"
    : canonical_role === CANONICAL_ROLES.FRACTAL ? "Fractal"
    : "Character");

  const origin =
    label_policy === "visual" ?
      entry?.character_name || entry?.role || fallback
    : entry?.entity_id || entry?.origin || entry?.character_name || entry?.name || (entry?.role ? role_display_label(entry.role) : "") || fallback;

  const character_name = String(
    entry?.character_name || (canonical_role === CANONICAL_ROLES.USER ? "You" : entry?.origin || entry?.name || (origin !== fallback ? origin : "")),
  ).trim();

  const attachments = Array.isArray(entry.attachments) ? Object.freeze([...entry.attachments]) : Object.freeze([]);
  const round = entry.round != null && Number.isFinite(Number(entry.round)) ? Number(entry.round) : null;
  const timestamp = entry.timestamp ?? entry.created_at ?? null;

  return Object.freeze({ role: canonical_role, raw_role, origin: String(origin), character_name, text, attachments, round, timestamp, raw_entry: entry });
}

/**
 * @param {string | null | undefined} role
 * @returns {boolean} Whether a role is a narrative participant.
 */
export function is_narrative_role(role) {
  if (role == null) return false;
  return String(role).toLowerCase() !== CANONICAL_ROLES.SYSTEM;
}

/**
 * Filters a sequence of dialogue messages or log records to retain only narrative turns.
 * Strips out system messages and optionally excludes consolidated rounds.
 */
export function filter_narrative_messages(messages, options = {}) {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  const { exclude_consolidated = false, keep_resolved_image_rows = false } = options;

  return messages.filter((message) => {
    if (!message || message.role === CANONICAL_ROLES.SYSTEM) return false;
    if (exclude_consolidated && message.meta?.consolidated) return false;
    const text = String(message.content ?? message.text ?? "").trim();
    if (!text && !message.meta?.is_prologue && !message.meta?.is_epilogue) {
      if (keep_resolved_image_rows && Array.isArray(message.attachments)) {
        const first_source = message.attachments[0]?.src;
        if (typeof first_source === "string" && first_source.trim()) return true;
      }
      return false;
    }
    return true;
  });
}

/**
 * Decomposes a flat story title into styled title parts matching active entities.
 * Highlights AI, User, and Fractal names with their signature colors.
 */
export function decompose_story_title(title, entities = {}) {
  if (!title || typeof title !== "string") return [{ text: "" }];
  const clean = title.trim();
  if (!clean) return [{ text: "" }];

  const { ai, user, fractal, get_color = () => "" } = entities;
  const matches = [];

  if (ai?.name) {
    const idx = clean.indexOf(ai.name);
    if (idx !== -1) {
      matches.push({ name: ai.name, color: get_color(ai), start: idx, end: idx + ai.name.length });
    }
  }
  if (user?.name && (!ai?.name || user.name !== ai.name)) {
    const idx = clean.indexOf(user.name);
    if (idx !== -1) {
      matches.push({ name: user.name, color: get_color(user), start: idx, end: idx + user.name.length });
    }
  }
  if (fractal?.name) {
    const idx = clean.indexOf(fractal.name);
    if (idx !== -1) {
      matches.push({ name: fractal.name, color: get_color(fractal), start: idx, end: idx + fractal.name.length });
    }
  }

  if (matches.length === 0) {
    return [{ text: clean }];
  }

  matches.sort((a, b) => a.start - b.start);

  const parts = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) {
      parts.push({ text: clean.slice(cursor, m.start) });
    }
    if (m.start >= cursor) {
      parts.push({ text: m.name, color: m.color });
      cursor = m.end;
    }
  }
  if (cursor < clean.length) {
    parts.push({ text: clean.slice(cursor) });
  }

  return parts;
}

/**
 * Evaluates recent dialogue density and returns the calibrated Turn Tempo (beat budget).
 * Enforces dynamic conversational rhythm matching the newest round in history:
 * - Tiny (< 25 chars): 1 snappy beat
 * - Small (< 150 chars): 2 beats
 * - Medium (< 500 chars): 3 beats
 * - Expansive (>= 500 chars): 4 beats
 *
 * @param {Array<any>} [history=[]]
 * @returns {number} Allowed sentence / beat count
 */
export function calculate_turn_tempo(history = []) {
  if (!Array.isArray(history) || history.length === 0) return 2;

  const newest = history[history.length - 1];
  const text = typeof newest === "string" ? newest.trim() : (newest?.text || "").trim();
  if (!text) return 2;

  const len = text.length;
  if (len < LENGTH_THRESHOLDS.TINY) return 1;
  if (len < LENGTH_THRESHOLDS.SMALL) return 2;
  if (len < LENGTH_THRESHOLDS.EXPANSIVE) return 3;
  return 4;
}

/**
 * Builds a brief human-readable turn summary from the recent feed tail.
 *
 * @param {any[]} feed - Recent feed array
 * @param {number} round - Current round index
 * @returns {string}
 */
export function build_turn_summary(feed, round) {
  const tail = (feed || []).slice(-16);
  const counts = {};
  for (const m of tail) {
    if (!m || m.role === "system") continue;
    const role = m.role;
    counts[role] = (counts[role] || 0) + 1;
  }
  const parts = Object.entries(counts).map(([r, n]) => `${r}×${n}`);
  return `Turn ${round} complete - ${parts.length ? parts.join(", ") : "no messages recorded"}.`;
}

/**
 * Reconstructs clean Kernel dialogue history from the UI / simulation log feed.
 * Accepts both `.text` and `.content` payload shapes.
 *
 * @param {Array<object>} feed
 * @param {object} cast
 * @returns {Array<object>}
 */
export function reconstruct_history_from_feed(feed = [], cast = {}) {
  if (!Array.isArray(feed)) return [];

  const user_name = cast.user?.name || "USER";
  const ai_name = cast.ai?.name || "AI";
  const fractal_name = cast.fractal?.name || "WORLD";

  return feed
    .filter((entry) => entry && typeof (entry.text ?? entry.content) === "string" && String(entry.text ?? entry.content).trim())
    .map((entry) => {
      let role;
      let origin = entry.character_name || entry.origin || "";

      if (entry.role === "user") {
        role = "user";
        origin = origin || user_name;
      } else if (entry.role === "fractal") {
        role = "fractal";
        origin = origin || fractal_name;
      } else if (entry.role === "system") {
        role = "system";
        origin = origin || "SYSTEM";
      } else {
        role = "ai";
        origin = origin || ai_name;
      }

      return { role, origin, text: String(entry.text ?? entry.content).trim(), round: Number(entry.round || 1) };
    });
}

/**
 * Matches a speaker name against snapshot entities (trio + NPC cast, case-insensitive).
 * Accepts both UPPERCASE (`AI`/`USER`/`FRACTAL`/`NPCS`) and lowercase
 * (`ai`/`user`/`fractal`/`npcs`) snapshot key shapes.
 * Single shared core for log-time stamping and feed-time stamping.
 * @param {{ AI?: any, USER?: any, FRACTAL?: any, NPCS?: any, ai?: any, user?: any, fractal?: any, npcs?: any } | null} [snapshots]
 * @param {string} key - lowercased trimmed speaker name
 * @returns {string|null} canonical entity id
 */
export function match_speaker_snapshots(snapshots, name) {
  const key = String(name || "")
    .toLowerCase()
    .trim();
  if (!key || !snapshots || typeof snapshots !== "object") return null;
  const trio = [snapshots.AI ?? snapshots.ai, snapshots.USER ?? snapshots.user, snapshots.FRACTAL ?? snapshots.fractal];
  for (const candidate of trio) {
    if (candidate?.name && String(candidate.name).toLowerCase().trim() === key && candidate?.id) return String(candidate.id);
  }
  const npcs = snapshots.NPCS ?? snapshots.npcs;
  const npc_list =
    Array.isArray(npcs) ? npcs
    : npcs && typeof npcs === "object" ? Object.values(npcs)
    : [];
  for (const npc of npc_list) {
    if (npc?.name && String(npc.name).toLowerCase().trim() === key && npc?.id) return String(npc.id);
  }
  return null;
}

// ============================================================================
// [SHARED WRITE-GUARD PREDICATES - single home for db.js + sessions write guards]
// ============================================================================

const TELEMETRY_MESSAGE_TYPES = new Set(["DYNAMICS_DELTA", "STORY_START", "VECTOR_RESOLUTION", "CONTINUUM_FORMATION", "MEMORY_FORMATION"]);

/**
 * Shared telemetry predicate (db.js + sessions write guards).
 * @param {any} meta
 * @returns {boolean}
 */
export function is_telemetry_meta(meta) {
  return Boolean(meta) && (TELEMETRY_MESSAGE_TYPES.has(meta.type) || Boolean(meta.is_telemetry));
}

/**
 * Shared empty-write predicate (db.js + sessions write guards).
 * @param {string} text
 * @param {{ attachments?: any[], meta?: any }} [options={}]
 * @returns {boolean}
 */
export function is_empty_narrative_message(text, { attachments = [], meta = {} } = {}) {
  return (
    typeof text === "string" &&
    !text.trim() &&
    (!attachments || attachments.length === 0) &&
    !meta?.is_prologue &&
    !meta?.is_epilogue &&
    !meta?.is_prologue_image &&
    !is_telemetry_meta(meta)
  );
}
