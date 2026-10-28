/**
 * src/intelligence/modules/recency.js
 * ============================================================================
 * 📜 RECENCY MODULE — Recent Rounds Plans & Thin Dialogue Renderers
 * ============================================================================
 *
 * Owns conversation-history and recent-turn windowing for the intelligence layer.
 * Rebranded from history.js under P4 Pre-Beta Purity with the following upgrades:
 *
 * 1. Semantic Tagging: Dialogue turns render as `<ENTRY round="..." origin="...">`
 *    wrapped in `<RECENT_ROUNDS>`.
 * 2. Pure-data plans (`resolve_history_plan`, `resolve_sensory_plan`) decide
 *    WHAT survives: role exclusion, collapse, window slicing, stripping, and
 *    per-entry budgets. Every filter/migrate/drop decision is plan data.
 * 3. Thin renderers (`render_history_plan`, `render_sensory_plan`) map plans
 *    to XML or `Name: prose` lines without branching.
 *
 * Public compilers (`render_history`, `render_input_history_xml`,
 * `render_visual_history`, `format_sensory_history`) are one-line plan+render
 * compositions preserving the exact established output contracts.
 *
 * Architecture & Design Laws:
 * - Unidirectional layer flow: pure data plans, then pure string compilation.
 * - Single source of truth for which history entries reach a prompt.
 * - Strict Full-Name domain nomenclature (zero clipped or single-letter variables).
 * - Zero Backwards Compatibility: ruthless purity, no deprecated wrappers or shims.
 * ============================================================================
 */

import { render_xml_tag, collapse_history, strip_cognition_blocks, truncate_at_word, prompt_escape, escape_xml, estimate_tokens } from "@utils";
import { DIALOGUE_WINDOW, VISUAL_FEED_WINDOW, CHAPTER, PROSE, CONTEXT_TOKEN_CLIFF } from "@config";
import { DYNAMICS_METRIC_NAMES } from "../dynamics.js";

// ============================================================================
// [SECTION 1: MANIFEST CONFIGURATION & WINDOW RESOLVER]
// ============================================================================

/**
 * Canonical history-window defaults. Modes override these via `prompts.js`
 * `history` layer configuration, resolved here so no call site hardcodes a window.
 *
 * @type {Readonly<{ enabled: boolean, limit: number, max_chars: number, offset: number }>}
 */
export const HISTORY_DEFAULTS = Object.freeze({
  enabled: true,
  limit: DIALOGUE_WINDOW.ROUNDS * 2,
  max_chars: DIALOGUE_WINDOW.MAX_CHARS,
  offset: 0,
});

/**
 * Resolves a prompt manifest mode's `history` configuration over canonical defaults.
 *
 * @param {Partial<typeof HISTORY_DEFAULTS>|null|undefined} [configuration]
 * @returns {Readonly<{ enabled: boolean, limit: number, max_chars: number, offset: number }>}
 */
export function resolve_history(configuration) {
  return Object.freeze({
    ...HISTORY_DEFAULTS,
    ...(configuration && typeof configuration === "object" ? configuration : {}),
  });
}

// ── Track 2.2: Context Window Compiler budgets ──────────────────────────────
// Inference servers truncate the middle of prompts past ~6,000 tokens. Every
// variable-size block carries a token budget; dispatchers that stay under
// budget (including all CONTRACT fixtures) compile byte-identical output.

/** Hard cliff: no dispatched assembly may exceed ~6,000 tokens. */
export { CONTEXT_TOKEN_CLIFF };

/** Token budget for one transcript window (history slot, all modes). */
export const HISTORY_TOKEN_BUDGET = 1600;

import { normalize_history_beat } from "@utils";

// ============================================================================
// [SECTION 2: HISTORY PLANS — PURE DATA, NO XML]
// ============================================================================

/**
 * Telemetry lines stripped from sensory shaping. The canonical dynamics metric
 * names live in physics.js (`build_turn_summary`); these patterns mirror them
 * so the optics `<HISTORY>` never carries `system:` telemetry or `metric ±N |` rows.
 */
const TELEMETRY_METRICS_PATTERN = DYNAMICS_METRIC_NAMES.join("|");
const TELEMETRY_PREFIX_PATTERN = new RegExp(`^(system|telemetry):\\s*(?:${TELEMETRY_METRICS_PATTERN})\\s*[+-]\\d+`, "i");
const TELEMETRY_INLINE_PATTERN = new RegExp(`(?:${TELEMETRY_METRICS_PATTERN})\\s*[+-]\\d+\\s*\\|`, "i");

/**
 * Resolves raw dialogue/feed entries into a frozen, render-ready plan. Every
 * filter, collapse, window, strip, and budget decision happens here — renderers
 * map `plan.included` to output without branching.
 *
 * Stage order (each stage's drops are counted in `plan.dropped`):
 * 1. Exclude `exclude_roles` entries and (for `text` sources) non-string or
 *    blank raw texts — pre-window, so excluded rows never consume the window.
 * 2. Collapse consecutive same-speaker turns (transcript windows only).
 * 3. Slice the `limit`/`offset` window; round numbers are assigned here, so
 *    rows dropped in stage 4 keep their round gaps (established contract).
 * 4. Strip cognition blocks, normalize whitespace, drop telemetry-shaped
 *    rows when requested, drop newly-emptied rows, truncate to `max_chars`.
 *
 * @param {any[]|string|null|undefined} entries - Raw dialogue entries, feed rows,
 *   or a pre-rendered string (passed through untouched as a preformatted plan).
 * @param {Object} [options={}]
 * @param {number} [options.limit] - Window size taken from the end (falsy = all).
 * @param {number} [options.offset=0] - Rows skipped from the end of the window.
 * @param {number} [options.max_chars] - Per-entry budget (word-boundary truncated).
 * @param {boolean} [options.collapse=true] - Merge consecutive same-speaker turns.
 * @param {string} [options.separator="\n"] - Paragraph separator for merged turns.
 * @param {boolean} [options.stripBoldQuotes=false] - Unwrap bold-markdown quotes while collapsing.
 * @param {string[]} [options.exclude_roles=[]] - Exact-match roles dropped pre-window.
 * @param {string} [options.text_source="content"] - `"content"` reads
 *   `content ?? text`; `"text"` reads `text` only (visual feed rows).
 * @param {boolean} [options.normalize_whitespace=false] - Collapse whitespace post-strip.
 * @param {string} [options.label_policy="entry"] - `"entry"` resolves the full
 *   origin chain; `"visual"` resolves the `Name:` line label.
 * @param {string} [options.label_fallback] - Origin fallback (entry: `"Character"`, visual: `"narrator"`).
 * @param {number} [options.token_budget=Infinity] - Track 2.2 cliff guard: prunes oldest rows first
 *   (recency is the transcript weight proxy) until the window fits; pruned rows keep round gaps.
 * @returns {Readonly<{ kind: string, included: ReadonlyArray<Readonly<{ origin: string, round: number, text: string }>>,
 *   dropped: Readonly<{ excluded: number, empty: number }>, total: number, start_index: number, preformatted: string }>}
 */
export function resolve_history_plan(entries, options = {}) {
  const {
    limit,
    offset = 0,
    max_chars,
    collapse = true,
    separator = "\n",
    stripBoldQuotes = false,
    exclude_roles = [],
    text_source = "content",
    normalize_whitespace = false,
    label_policy = "entry",
    label_fallback,
    token_budget = Infinity,
  } = options;

  if (typeof entries === "string") {
    return Object.freeze({
      kind: "preformatted",
      included: Object.freeze([]),
      dropped: Object.freeze({ excluded: 0, empty: 0 }),
      total: 0,
      start_index: 0,
      preformatted: entries,
      budget_pruned: 0,
    });
  }

  const excluded_roles = new Set(Array.isArray(exclude_roles) ? exclude_roles : []);
  let excluded_count = 0;
  const eligible = (Array.isArray(entries) ? entries : []).filter((entry) => {
    if (!entry || (entry.role && excluded_roles.has(entry.role))) {
      excluded_count += 1;
      return false;
    }
    if (text_source === "text" && (typeof entry.text !== "string" || !entry.text.trim())) {
      excluded_count += 1;
      return false;
    }
    return true;
  });

  const collapsed = collapse ? collapse_history(eligible, { separator, stripBoldQuotes }) : eligible;

  const total = collapsed.length;
  const start_index = limit ? Math.max(0, total - (limit + offset)) : 0;
  const end_index = Math.max(0, total - offset);
  const windowed = collapsed.slice(start_index, end_index);

  let empty_count = 0;
  let included = [];
  windowed.forEach((entry, window_position) => {
    const beat = normalize_history_beat(entry, {
      text_source,
      normalize_whitespace,
      max_chars,
      label_policy,
      label_fallback,
    });
    if (!beat || !beat.text) {
      empty_count += 1;
      return;
    }
    included.push(
      Object.freeze({
        origin: beat.origin,
        round: start_index + window_position + 1,
        text: beat.text,
      }),
    );
  });

  const budgeted = prune_history_plan_to_budget(included, token_budget);
  return Object.freeze({
    kind: "entries",
    included: Object.freeze(budgeted.kept),
    dropped: Object.freeze({ excluded: excluded_count, empty: empty_count }),
    total,
    start_index,
    preformatted: "",
    budget_pruned: budgeted.pruned,
  });
}

/**
 * Prunes the oldest plan rows until the window fits a token budget
 * (Track 2.2: recency is the transcript weight proxy, so the oldest — the
 * lowest-weight leaves — fall first; the newest row always survives).
 * @param {Array<{ origin: string, round: number, text: string }>} rows - Newest last.
 * @param {number} [token_budget=Infinity]
 * @returns {{ kept: Array, pruned: number }}
 */
export function prune_history_plan_to_budget(rows, token_budget = Infinity) {
  if (!Number.isFinite(token_budget) || !Array.isArray(rows) || rows.length <= 1) return { kept: rows, pruned: 0 };
  const row_cost = (record) => estimate_tokens(`${record.origin || ""}: ${record.text || ""}`);
  let running_total = rows.reduce((sum, record) => sum + row_cost(record), 0);
  if (running_total <= token_budget) return { kept: rows, pruned: 0 };
  const kept = [...rows];
  let pruned = 0;
  while (kept.length > 1 && running_total > token_budget) {
    const dropped_record = kept.shift();
    running_total -= row_cost(dropped_record);
    pruned += 1;
  }
  return { kept, pruned };
}
/**
 * Maps an entry plan to a clean XML `<ENTRY>` sequence. Preformatted plans
 * pass through verbatim.
 *
 * @param {ReturnType<typeof resolve_history_plan>} plan
 * @param {Object} [options={}]
 * @param {number} [options.indent=0] - Indentation spaces preceding each `<ENTRY>` tag.
 * @returns {string}
 */
export function render_history_plan(plan, { indent = 0 } = {}) {
  if (!plan) return "";
  if (plan.kind === "preformatted") return plan.preformatted;
  const prefix = indent > 0 ? " ".repeat(indent) : "";
  return plan.included
    .map((record) => `${prefix}<ENTRY round="${record.round}" origin="${escape_xml(record.origin)}">${prompt_escape(record.text)}</ENTRY>`)
    .join("\n");
}

// [SECTION 4: PUBLIC WINDOW COMPILERS — ONE-LINE PLAN + RENDER]
// ============================================================================

/**
 * Collapses and formats turn-based simulation history or dialogue messages
 * into clean XML `<ENTRY>` sequences.
 *
 * @param {any[]} history - Array of raw dialogue entries or message objects.
 * @param {Object} [options={}]
 * @param {number} [options.limit=16] - Number of recent collapsed turns to display.
 * @param {number} [options.offset=0] - Offset from the end of the history window.
 * @param {number} [options.max_chars] - Optional per-entry budget at word boundaries.
 * @param {boolean} [options.collapse=true] - Whether to collapse consecutive turns.
 * @param {number} [options.indent=0] - Indentation spaces preceding each `<ENTRY>` tag.
 * @param {number} [options.token_budget=Infinity] - Track 2.2 cliff guard (oldest pruned first).
 * @returns {string}
 */
export function render_history(history, options = {}) {
  const should_collapse = options.collapse ?? true;
  return render_history_plan(
    resolve_history_plan(history, {
      limit: options.limit ?? HISTORY_DEFAULTS.limit,
      offset: options.offset ?? 0,
      max_chars: options.max_chars,
      collapse: should_collapse,
      separator: "\n",
      stripBoldQuotes: true,
      exclude_roles: should_collapse ? ["system"] : [],
      token_budget: options.token_budget ?? Infinity,
    }),
    { indent: options.indent ?? 0 },
  );
}

/**
 * Renders the enveloped recent dialogue history XML block (default `<RECENT_ROUNDS>` tag).
 * Uncollapsed by contract; system entries pass through here exactly as before —
 * the exclusion policy is plan data (`exclude_roles`), deliberately unchanged.
 *
 * @param {Array<any>} [history=[]]
 * @param {Object} [options={}]
 * @param {number} [options.limit=16]
 * @param {number} [options.max_chars=400]
 * @param {number} [options.token_budget=Infinity] - Track 2.2 cliff guard (oldest pruned first).
 * @param {string} [options.tag="RECENT_ROUNDS"]
 * @param {number} [options.indent=2]
 * @param {number} [options.child_indent=2]
 * @returns {string}
 */
export function render_input_history_xml(history = [], options = {}) {
  const formatted_history = render_history_plan(
    resolve_history_plan(history, {
      limit: options.limit ?? HISTORY_DEFAULTS.limit,
      max_chars: options.max_chars ?? HISTORY_DEFAULTS.max_chars,
      collapse: false,
      token_budget: options.token_budget ?? Infinity,
    }),
  );
  if (!formatted_history) return "";
  return render_xml_tag({
    tag: options.tag || "RECENT_ROUNDS",
    children: [formatted_history],
    indent: options.indent ?? 2,
    child_indent: options.child_indent ?? 2,
    separator: "\n",
  });
}

/**
 * Formats recent narrative history for the sensory cortex, stripping dangling
 * think tags and telemetry lines.
 *
 * @param {string} [history_text]
 * @returns {string}
 */
export function format_sensory_history(history_text) {
  if (!history_text || typeof history_text !== "string") return "";
  const lines = strip_cognition_blocks(history_text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (TELEMETRY_PREFIX_PATTERN.test(line) || TELEMETRY_INLINE_PATTERN.test(line)) {
        return false;
      }
      return true;
    });
  if (lines.length === 0) return "";
  return `<RECENT_ROUNDS>\n${prompt_escape(lines.join("\n"))}\n</RECENT_ROUNDS>\n`;
}

/**
 * Builds the compact recent-narrative history fed to the optics (Sensory Cortex)
 * prompt — one `Character: prose` line per recent non-system beat, truncated at
 * word boundaries.
 *
 * @param {any[]} [entries] - Simulation feed entries (typically `simulation_log.feed`).
 * @param {Object} [options={}]
 * @param {number} [options.max_entries=2] - Number of most recent beats to include.
 * @param {number} [options.max_chars=200] - Per-entry character budget (word-boundary truncated).
 * @returns {string}
 */
export function render_visual_history(entries, { max_entries = VISUAL_FEED_WINDOW.ROUNDS * 2, max_chars = VISUAL_FEED_WINDOW.MAX_CHARS } = {}) {
  const plan = resolve_history_plan(entries, {
    limit: max_entries,
    max_chars,
    collapse: false,
    exclude_roles: ["system"],
    text_source: "text",
    normalize_whitespace: true,
    label_policy: "visual",
  });
  if (plan.kind !== "entries" || plan.included.length === 0) return "";
  return plan.included.map((record) => `${record.origin}: ${record.text}`).join("\n");
}

/**
 * Renders an entity's closed-chapter milestone boundaries into a structured
 * <CHAPTER_HISTORY> XML block carrying one <CHAPTER> child per closed chapter.
 * @param {any} target_entity
 * @param {number} [indentation_level=0]
 * @returns {string}
 */
export function render_chapter_history_xml(target_entity, indentation_level = 0) {
  const chapters = Array.isArray(target_entity?.chapters) ? target_entity.chapters : [];
  const closed_chapters = chapters.filter((chapter) => chapter?.status === "closed");
  if (!closed_chapters.length) return "";

  const chapter_rows = closed_chapters.slice(-CHAPTER.PROMPT_HISTORY_LIMIT).map((chapter, position) => {
    const raw_title = String(chapter.title || "Untitled").trim();
    const normalized_title = raw_title.replace(/^Chapter\s+/i, "");
    const clean_summary = truncate_at_word(String(chapter.summary || ""), PROSE.SNIPPET);
    return render_xml_tag({
      tag: "CHAPTER",
      attrs: { index: position + 1, title: normalized_title },
      children: [clean_summary],
      inline: true,
    });
  });

  return render_xml_tag({
    tag: "CHAPTER_HISTORY",
    children: chapter_rows,
    indent: indentation_level,
    separator: "\n",
  });
}
