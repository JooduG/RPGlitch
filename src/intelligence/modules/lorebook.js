/**
 * src/intelligence/modules/lorebook.js
 * ============================================================================
 * 📚 LOREBOOK MODULE — Standalone World Info & Triggered Inserts (Track 3.2)
 * ============================================================================
 *
 * Standalone lorebook entities (id, name, description, scan_depth, token_budget,
 * recursive, entries[]) scanned against the last N turns. Each entry carries
 * trigger keys matched multi-pass (regex → glob → whole-word) plus an optional
 * secondary filter ({mode: any|all|not_any, keys}). Matches render into a
 * budget-conscious <LOREBOOK> system slot sealed only when non-empty, so modes
 * without lorebooks compile byte-identical output.
 *
 * Architecture & Modification Rules:
 * - Pure domain utility: zero UI, zero persistence, zero LLM dependencies.
 * - Frozen plans in, frozen plans out; renderers only wrap.
 * - Unidirectional layer flow: pure functions over @utils. Zero sibling imports.
 * ============================================================================
 */

import { render_xml_tag, prompt_escape, collapse_whitespace, truncate_at_word, estimate_tokens } from "@utils";

// ============================================================================
// [SECTION 1: LOREBOOK DEFAULTS — FROZEN CALIBRATION CONFIG]
// ============================================================================

export const LOREBOOK_DEFAULTS = Object.freeze({
  SCAN_DEPTH: 5,
  TOKEN_BUDGET: 800,
  ENTRY_CHAR_CAP: 600,
  SECONDARY_MODES: Object.freeze(["any", "all", "not_any"]),
});

// ============================================================================
// [SECTION 2: NORMALIZERS — RAW RECORDS INTO FROZEN PLANS]
// ============================================================================

/**
 * Normalizes a raw lorebook entry into a frozen trigger plan.
 * @param {any} raw
 * @returns {Readonly<{ id: string, keys: ReadonlyArray<string>, content: string, enabled: boolean, filter: Readonly<{ mode: string, keys: ReadonlyArray<string> }>|null }>}
 */
export function normalize_lorebook_entry(raw) {
  const keys = Array.isArray(raw?.keys) ? raw.keys.map((key) => String(key ?? "").trim()).filter(Boolean) : [];
  const filter_raw = raw?.filter && typeof raw.filter === "object" ? raw.filter : null;
  const mode = LOREBOOK_DEFAULTS.SECONDARY_MODES.includes(filter_raw?.mode) ? filter_raw.mode : "any";
  const filter_keys = filter_raw && Array.isArray(filter_raw.keys) ? filter_raw.keys.map((key) => String(key ?? "").trim()).filter(Boolean) : [];
  return Object.freeze({
    id: String(raw?.id ?? "").trim(),
    keys: Object.freeze(keys),
    content: String(raw?.content ?? ""),
    enabled: raw?.enabled !== false,
    filter: filter_raw ? Object.freeze({ mode, keys: Object.freeze(filter_keys) }) : null,
  });
}

/**
 * Normalizes a raw lorebook record into a frozen scan plan.
 * @param {any} raw
 * @returns {Readonly<{ id: string, story_id: string, name: string, description: string, scan_depth: number, token_budget: number, recursive: boolean, entries: ReadonlyArray }>}
 */
export function normalize_lorebook(raw) {
  const scan_depth = Number(raw?.scan_depth);
  const token_budget = Number(raw?.token_budget);
  return Object.freeze({
    id: String(raw?.id ?? "").trim(),
    story_id: String(raw?.story_id ?? "").trim(),
    name: String(raw?.name ?? "").trim(),
    description: String(raw?.description ?? ""),
    scan_depth: Number.isFinite(scan_depth) && scan_depth > 0 ? Math.floor(scan_depth) : LOREBOOK_DEFAULTS.SCAN_DEPTH,
    token_budget: Number.isFinite(token_budget) && token_budget > 0 ? Math.floor(token_budget) : LOREBOOK_DEFAULTS.TOKEN_BUDGET,
    recursive: raw?.recursive === true,
    entries: Object.freeze(Array.isArray(raw?.entries) ? raw.entries.map(normalize_lorebook_entry) : []),
  });
}

// ============================================================================
// [SECTION 3: MULTI-PASS KEY MATCHING]
// ============================================================================

/**
 * Tests one trigger key against a haystack. Pass precedence: /regex/ literals
 * first, * ? glob wildcards second, bare strings as case-insensitive
 * whole-word matches last.
 * @param {string} key
 * @param {string} haystack
 * @returns {Readonly<{ hit: boolean, pass: "regex"|"glob"|"word"|"none" }>}
 */
export function match_lorebook_key(key, haystack) {
  const needle = String(key ?? "").trim();
  const text = String(haystack ?? "");
  if (!needle || !text) return Object.freeze({ hit: false, pass: "none" });
  if (needle.length > 2 && needle.startsWith("/") && needle.lastIndexOf("/") > 0) {
    const last_slash = needle.lastIndexOf("/");
    try {
      if (new RegExp(needle.slice(1, last_slash), needle.slice(last_slash + 1)).test(text)) return Object.freeze({ hit: true, pass: "regex" });
    } catch {
      /* invalid regex falls through to literal matching */
    }
    return Object.freeze({ hit: false, pass: "none" });
  }
  if (needle.includes("*") || needle.includes("?")) {
    const glob = needle
      .split("")
      .map((char) => (char === "*" ? ".*" : char === "?" ? "." : char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
      .join("");
    try {
      if (new RegExp(glob, "i").test(text)) return Object.freeze({ hit: true, pass: "glob" });
    } catch {
      /* unreachable — escaped construction cannot throw */
    }
    return Object.freeze({ hit: false, pass: "none" });
  }
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i").test(text)) return Object.freeze({ hit: true, pass: "word" });
  return Object.freeze({ hit: false, pass: "none" });
}

/**
 * Matches one entry against a turn text: primary keys multi-pass, then the
 * optional secondary filter (any = some secondary key hits, all = every
 * secondary key hits, not_any = no secondary key hits).
 * @param {ReturnType<typeof normalize_lorebook_entry>} entry
 * @param {string} text
 * @returns {Readonly<{ hit: boolean, matched_key: string, pass: string }>}
 */
export function match_lorebook_entry(entry, text) {
  const source = String(text ?? "");
  if (!entry || entry.enabled === false || !source) return Object.freeze({ hit: false, matched_key: "", pass: "none" });
  let primary = null;
  for (const key of entry.keys || []) {
    const attempt = match_lorebook_key(key, source);
    if (attempt.hit) {
      primary = { key, pass: attempt.pass };
      break;
    }
  }
  if (!primary) return Object.freeze({ hit: false, matched_key: "", pass: "none" });
  if (entry.filter && entry.filter.keys.length > 0) {
    const secondary_hits = entry.filter.keys.map((key) => match_lorebook_key(key, source).hit);
    const passes =
      entry.filter.mode === "all"
        ? secondary_hits.every(Boolean)
        : entry.filter.mode === "not_any"
          ? secondary_hits.every((hit) => !hit)
          : secondary_hits.some(Boolean);
    if (!passes) return Object.freeze({ hit: false, matched_key: "", pass: "none" });
  }
  return Object.freeze({ hit: true, matched_key: primary.key, pass: primary.pass });
}

// ============================================================================
// [SECTION 4: SCAN PLANS — LOREBOOKS OVER RECENT TURNS]
// ============================================================================

/**
 * Scans normalized lorebooks against recent turns (newest last). Each lorebook
 * reads at most its scan_depth trailing turns. Recursive lorebooks run one
 * extra pass with matched contents appended as haystacks to catch chained
 * entries. First match per entry wins (most recent turn).
 * @param {Array} lorebooks - Normalized (or raw — normalized on the fly) lorebooks
 * @param {Array<{ text: string }>} turns - Oldest first
 * @returns {Readonly<{ matches: ReadonlyArray, scanned_turns: number }>}
 */
export function scan_lorebooks(lorebooks, turns) {
  const books = (Array.isArray(lorebooks) ? lorebooks : []).map((book) =>
    book && book.entries && Object.isFrozen(book) ? book : normalize_lorebook(book),
  );
  const trail = Array.isArray(turns) ? turns : [];
  const matches = [];
  const seen = new Set();
  const scan_pass = (haystacks) => {
    for (const book of books) {
      if (!book.id) continue;
      const window = haystacks.slice(-book.scan_depth);
      for (const entry of book.entries) {
        if (!entry.id || seen.has(`${book.id}\u0000${entry.id}`)) continue;
        for (let position = window.length - 1; position >= 0; position -= 1) {
          const attempt = match_lorebook_entry(entry, window[position]?.text);
          if (attempt.hit) {
            seen.add(`${book.id}\u0000${entry.id}`);
            matches.push(
              Object.freeze({
                lorebook_id: book.id,
                lorebook_name: book.name,
                entry_id: entry.id,
                content: entry.content,
                turn_index: trail.length - window.length + position,
                matched_key: attempt.matched_key,
              }),
            );
            break;
          }
        }
      }
    }
  };
  scan_pass(trail);
  const chained = books.some((book) => book.recursive) ? matches.map((match) => ({ text: match.content })) : [];
  if (chained.length > 0) scan_pass([...trail, ...chained]);
  return Object.freeze({ matches: Object.freeze(matches), scanned_turns: trail.length });
}

/**
 * Resolves lorebooks + turns into a frozen scan plan.
 * @param {Array} [lorebooks=[]]
 * @param {Array} [turns=[]]
 * @returns {Readonly<{ matches: ReadonlyArray, scanned_turns: number }>}
 */
export function resolve_lorebook_plan(lorebooks = [], turns = []) {
  return scan_lorebooks(lorebooks, turns);
}

// ============================================================================
// [SECTION 5: RENDERERS — BUDGET-CONSCIOUS XML]
// ============================================================================

/**
 * Renders lorebook matches into the <LOREBOOK> block, enforcing a strict token
 * ceiling: lowest-priority (oldest-turn) matches drop first. Empty matches
 * render "" so modes without lorebooks compile byte-identical output.
 * @param {Array} matches
 * @param {number} [token_budget=800]
 * @param {number} [indentation_level=2]
 * @returns {string}
 */
export function render_lorebook_xml(matches, token_budget = LOREBOOK_DEFAULTS.TOKEN_BUDGET, indentation_level = 2) {
  const pool = (Array.isArray(matches) ? matches : []).filter((match) => String(match?.content || "").trim());
  if (pool.length === 0) return "";
  const budget = Number.isFinite(Number(token_budget)) && Number(token_budget) > 0 ? Number(token_budget) : LOREBOOK_DEFAULTS.TOKEN_BUDGET;
  const ordered = [...pool].sort((left, right) => (right.turn_index ?? 0) - (left.turn_index ?? 0));
  const kept = [];
  for (const match of ordered) {
    const candidate = [...kept, match];
    const probe = candidate
      .map((item) => truncate_at_word(collapse_whitespace(String(item.content)).trim(), LOREBOOK_DEFAULTS.ENTRY_CHAR_CAP))
      .join("\n");
    if (estimate_tokens(probe) <= budget) kept.push(match);
  }
  if (kept.length === 0) {
    const fallback = ordered[0];
    kept.push(fallback);
  }
  kept.sort((left, right) => (left.turn_index ?? 0) - (right.turn_index ?? 0));
  const lines = kept.map((match, position) => {
    const clean = truncate_at_word(collapse_whitespace(String(match.content)).trim(), LOREBOOK_DEFAULTS.ENTRY_CHAR_CAP);
    return `${position + 1}. [${match.lorebook_name || match.lorebook_id}: ${prompt_escape(clean)}]`;
  });
  return render_xml_tag({
    tag: "LOREBOOK",
    children: ["Triggered world entries — treat as established fact.", ...lines],
    indent: indentation_level,
    separator: "\n",
  });
}

/**
 * System-layer slot: seals triggered lorebook entries. Disabled args, missing
 * lorebooks, or zero matches all seal "" for byte-identical compiles.
 * @param {any} config
 * @param {Record<string, any>} [normalized={}]
 * @returns {string}
 */
export function resolve_lorebook_slot(config, normalized = {}) {
  const args = normalized.lorebook_args || {};
  if (!args.enabled) return "";
  const books = Array.isArray(args.lorebooks) ? args.lorebooks : [];
  if (books.length === 0) return "";
  const plan = resolve_lorebook_plan(books, args.turns || []);
  if (plan.matches.length === 0) return "";
  const budgets = books.map((book) => Number(book?.token_budget)).filter((value) => Number.isFinite(value) && value > 0);
  return render_lorebook_xml(plan.matches, args.token_budget || (budgets.length > 0 ? Math.min(...budgets) : LOREBOOK_DEFAULTS.TOKEN_BUDGET));
}

/**
 * CHANGELOG
 * - Track 3.2: Standalone lorebook system — normalize/entries, multi-pass key matching (regex/glob/whole-word), any/all/not_any secondary filters, scan-depth windows + one-pass recursive chaining, token-budgeted <LOREBOOK> renderer, resolve_lorebook_slot (empty seals "").
 */
