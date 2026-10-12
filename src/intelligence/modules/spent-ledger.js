/**
 * src/intelligence/modules/spent-ledger.js
 * ============================================================================
 * 🚫 SPENT LEDGER ENGINE — Anti-Repetition Mannerism & Clause Tracker
 * ============================================================================
 *
 * Scans recent turns (default: 5 turns) for repetitive physical mannerisms,
 * recurring opening clauses, and high-frequency n-grams. Compiles a compact,
 * token-budgeted `# SPENT LEDGER` directive preventing output-anchored loops.
 *
 * Architecture & Design Laws:
 * - Pure data extraction: `extract_spent_ledger` produces a frozen record of spent items.
 * - Pure string compilation: `render_spent_ledger_directive` compiles clean prompt instructions.
 * - Strict Full-Name domain nomenclature (zero clipped or single-letter variables).
 * - Zero Backwards Compatibility: pre-beta purity.
 * ============================================================================
 */

import { strip_cognition_blocks, collapse_whitespace } from "@utils";

// ============================================================================
// [SECTION 1: CONSTANTS & MANNERISM PATTERNS]
// ============================================================================

/**
 * Common physical action stems and posture verbs frequently anchored into loops.
 * @type {ReadonlyArray<RegExp>}
 */
export const MANNERISM_PATTERNS = Object.freeze([
  /\b(?:gripped|gripping|clutched|clutching|held|holding|pinned|pinning)\s+(?:his|her|their|your|the)\s+[a-z]+/gi,
  /\b(?:pressed|pressing)\s+(?:his|her|their|your)\s+(?:lips|forehead|hand|fingers|back|chest)\b/gi,
  /\b(?:shifted|shifting)\s+(?:his|her|their|your)\s+weight\b/gi,
  /\b(?:nodded|nods|nodding)\s+(?:slowly|once|tersely|in silence)\b/gi,
  /\b(?:jaw|teeth)\s+(?:clenched|tightened|set)\b/gi,
  /\b(?:exhaled|inhaled|sighed)\s+(?:slowly|sharply|heavily)\b/gi,
  /\b(?:swallowed|swallowing)\s+(?:hard|dryly)\b/gi,
  /\b(?:furrowed|furrows)\s+(?:his|her|their|your)\s+brow\b/gi,
  /\b(?:narrowed|narrows)\s+(?:his|her|their|your)\s+eyes\b/gi,
  /\b(?:crossed|crossing)\s+(?:his|her|their|your)\s+arms\b/gi,
]);

export const DEFAULT_SPENT_WINDOW = 5;
export const MAX_SPENT_ITEMS = 8;

// ============================================================================
// [SECTION 2: SPENT LEDGER EXTRACTION]
// ============================================================================

/**
 * Extracts repetitive opening clauses, mannerisms, and n-grams from recent dialogue.
 *
 * @param {Array<any>} messages - Chronological message array.
 * @param {Object} [options={}]
 * @param {number} [options.window_size=5] - Number of recent turns to inspect.
 * @param {number} [options.maximum_items=8] - Maximum spent items to include.
 * @returns {Readonly<{
 *   opening_clauses: ReadonlyArray<string>,
 *   mannerisms: ReadonlyArray<string>,
 *   spent_items: ReadonlyArray<string>
 * }>}
 */
export function extract_spent_ledger(messages, options = {}) {
  const window_size = options.window_size ?? DEFAULT_SPENT_WINDOW;
  const maximum_items = options.maximum_items ?? MAX_SPENT_ITEMS;

  if (!Array.isArray(messages) || messages.length === 0) {
    return Object.freeze({
      opening_clauses: Object.freeze([]),
      mannerisms: Object.freeze([]),
      spent_items: Object.freeze([]),
    });
  }

  const recent_messages = messages.filter((entry) => entry && entry.role !== "system").slice(-window_size);

  const seen_openings = new Set();
  const found_mannerisms = new Set();
  const collected_spent = new Set();

  for (const message of recent_messages) {
    const raw_text = String(message.content ?? message.text ?? "");
    const clean_text = collapse_whitespace(strip_cognition_blocks(raw_text)).trim();
    if (!clean_text) continue;

    // 1. Extract Opening Clause (first 4 to 6 words)
    const words = clean_text.split(/\s+/);
    if (words.length >= 4) {
      const opening = words.slice(0, Math.min(words.length, 5)).join(" ");
      const normalized_opening = opening.toLowerCase().replace(/[^a-z0-9 ]/g, "");
      if (normalized_opening.length >= 12) {
        seen_openings.add(opening);
      }
    }

    // 2. Extract Physical Mannerisms
    for (const pattern of MANNERISM_PATTERNS) {
      const matches = clean_text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const normalized = match.toLowerCase().trim();
          found_mannerisms.add(normalized);
        }
      }
    }
  }

  for (const mannerism of found_mannerisms) {
    if (collected_spent.size >= maximum_items) break;
    collected_spent.add(mannerism);
  }

  for (const opening of seen_openings) {
    if (collected_spent.size >= maximum_items) break;
    collected_spent.add(opening);
  }

  return Object.freeze({
    opening_clauses: Object.freeze([...seen_openings]),
    mannerisms: Object.freeze([...found_mannerisms]),
    spent_items: Object.freeze([...collected_spent]),
  });
}

// ============================================================================
// [SECTION 3: DIRECTIVE COMPILER]
// ============================================================================

/**
 * Compiles a spent ledger into a prompt directive prohibiting repetition.
 *
 * @param {ReturnType<typeof extract_spent_ledger>} spent_ledger
 * @returns {string}
 */
export function render_spent_ledger_directive(spent_ledger) {
  if (!spent_ledger || !Array.isArray(spent_ledger.spent_items) || spent_ledger.spent_items.length === 0) {
    return "";
  }

  const items_list = spent_ledger.spent_items.map((item) => `"${item}"`).join(", ");
  return `# SPENT LEDGER (PROHIBITED REPETITIONS)\nThe following mannerisms and opening phrasing have been exhausted in recent turns. Do NOT repeat or echo them:\n${items_list}`;
}

/**
 * CHANGELOG
 * - Track 3.1: Initial creation of spent-ledger.js — extracts exhausted physical mannerisms and opening clauses from the last 5 turns and compiles # SPENT LEDGER directive.
 */
