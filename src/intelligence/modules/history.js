/**
 * src/intelligence/modules/history.js
 * ============================================================================
 * 📜 HISTORY MODULE — History Plans & Thin Transcript Renderers
 * ============================================================================
 *
 * Owns conversation-history windowing for the intelligence layer. Two stages,
 * mirroring the entities.js actor-plan split:
 *
 * 1. Pure-data plans (`resolve_history_plan`, `resolve_sensory_plan`) decide
 *    WHAT survives: role exclusion, collapse, window slicing, stripping, and
 *    per-entry budgets. Every filter/migrate/drop decision is plan data.
 * 2. Thin renderers (`render_history_plan`, `render_sensory_plan`) map plans
 *    to XML or `Name: prose` lines without branching.
 *
 * Public compilers (`render_history`, `render_input_history_xml`,
 * `render_visual_history`, `format_sensory_history`) are one-line plan+render
 * compositions preserving the exact established output contracts.
 *
 * Single planning vocabulary across all four windows (replacing the old
 * `limit` vs `max_entries` split and the retired `maximum_characters` /
 * `input_tag` aliases): `limit` / `offset` / `max_chars` / `collapse` /
 * `exclude_roles` / `text_source`.
 *
 * Architecture & Design Laws:
 * - Unidirectional layer flow: pure data plans, then pure string compilation.
 * - Single source of truth for which history entries reach a prompt.
 * - Strict Full-Name domain nomenclature (zero clipped or single-letter variables).
 * - Zero Backwards Compatibility: ruthless purity, no deprecated wrappers or shims.
 * ============================================================================
 */

import {
  render_xml_tag,
  collapse_history,
  strip_cognition_blocks,
  collapse_whitespace,
  truncate_at_word,
  prompt_escape,
  escape_xml,
  role_display_label,
  wrap_tag,
} from "@utils";
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
  limit: 16,
  max_chars: 400,
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
  } = options;

  if (typeof entries === "string") {
    return Object.freeze({
      kind: "preformatted",
      included: Object.freeze([]),
      dropped: Object.freeze({ excluded: 0, empty: 0 }),
      total: 0,
      start_index: 0,
      preformatted: entries,
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

  const fallback = label_fallback ?? (label_policy === "visual" ? "narrator" : "Character");
  let empty_count = 0;
  const included = [];
  windowed.forEach((entry, window_position) => {
    const raw_text = text_source === "text" ? entry?.text : (entry?.content ?? entry?.text);
    let cleaned = strip_cognition_blocks(String(raw_text ?? "")).trim();
    if (normalize_whitespace) cleaned = collapse_whitespace(cleaned);
    if (!cleaned) {
      empty_count += 1;
      return;
    }
    const origin =
      label_policy === "visual"
        ? entry?.character_name || entry?.role || fallback
        : entry?.entity_id ||
          entry?.origin ||
          entry?.character_name ||
          entry?.name ||
          (entry?.role ? role_display_label(entry.role) : "") ||
          fallback;
    included.push(
      Object.freeze({
        origin: String(origin),
        round: start_index + window_position + 1,
        text: max_chars ? truncate_at_word(cleaned, max_chars) : cleaned,
      }),
    );
  });

  return Object.freeze({
    kind: "entries",
    included: Object.freeze(included),
    dropped: Object.freeze({ excluded: excluded_count, empty: empty_count }),
    total,
    start_index,
    preformatted: "",
  });
}

/**
 * Resolves a pre-rendered narrative string (typically visual `Name: prose`
 * lines) into a frozen sensory line plan: cognition-stripped, telemetry-free
 * lines ready for the optics `<HISTORY>` wrap.
 *
 * @param {string|null|undefined} [history_text]
 * @returns {Readonly<{ lines: ReadonlyArray<string>, dropped: Readonly<{ empty: number, telemetry: number }> }>}
 */
export function resolve_sensory_plan(history_text) {
  if (!history_text || typeof history_text !== "string") {
    return Object.freeze({ lines: Object.freeze([]), dropped: Object.freeze({ empty: 0, telemetry: 0 }) });
  }
  let empty_count = 0;
  let telemetry_count = 0;
  const lines = strip_cognition_blocks(history_text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) {
        empty_count += 1;
        return false;
      }
      if (TELEMETRY_PREFIX_PATTERN.test(line) || TELEMETRY_INLINE_PATTERN.test(line)) {
        telemetry_count += 1;
        return false;
      }
      return true;
    });
  return Object.freeze({
    lines: Object.freeze(lines),
    dropped: Object.freeze({ empty: empty_count, telemetry: telemetry_count }),
  });
}

// ============================================================================
// [SECTION 3: THIN PLAN RENDERERS — NO DECISIONS, ONLY XML]
// ============================================================================

/**
 * Maps an entry plan to a clean XML `<ENTRY>` sequence. Preformatted plans
 * pass through verbatim; every other decision is already plan data.
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

/**
 * Maps a sensory line plan to the optics `<HISTORY>` block.
 *
 * @param {ReturnType<typeof resolve_sensory_plan>} plan
 * @returns {string}
 */
export function render_sensory_plan(plan) {
  if (!plan || plan.lines.length === 0) return "";
  return `<HISTORY>\n${prompt_escape(plan.lines.join("\n"))}\n</HISTORY>\n`;
}

// ============================================================================
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
    }),
    { indent: options.indent ?? 0 },
  );
}

/**
 * Renders the enveloped recent dialogue history XML block (the single `<HISTORY>` tag).
 * Uncollapsed by contract; system entries pass through here exactly as before —
 * the exclusion policy is plan data (`exclude_roles`), deliberately unchanged.
 *
 * @param {Array<any>} [history=[]]
 * @param {Object} [options={}]
 * @param {number} [options.limit=16]
 * @param {number} [options.max_chars=400]
 * @param {string} [options.tag="HISTORY"]
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
    }),
  );
  if (!formatted_history) return "";
  return render_xml_tag({
    tag: options.tag || "HISTORY",
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
  return render_sensory_plan(resolve_sensory_plan(history_text));
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
export function render_visual_history(entries, { max_entries = 2, max_chars = 200 } = {}) {
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

  const chapter_rows = closed_chapters.slice(-6).map((chapter, position) => {
    const raw_title = String(chapter.title || "Untitled").trim();
    const normalized_title = raw_title.replace(/^Chapter\s+/i, "");
    const clean_summary = truncate_at_word(String(chapter.summary || ""), 220);
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

// ── Universal Prompt Plan slot resolvers ────────────────────────────────────
/**
 * System-layer slot: seals history. Prose modes wrap the accessor simulation
 * log; continuum renders the input window; optics shapes sensory history.
 */
export function resolve_history_slot(config, normalized = {}) {
  const args = normalized.history_args || {};
  if (args.kind === "input_history") {
    if (!args.enabled) return "";
    return render_input_history_xml(args.history || [], { limit: args.limit, max_chars: args.max_chars });
  }
  if (args.kind === "sensory") {
    const rendered = format_sensory_history(args.history);
    return rendered ? rendered.trim() : null;
  }
  return wrap_tag("HISTORY", args.accessors.simulation_log(), 2);
}

/**
 * System-layer slot: seals the continuum chapter history for the target.
 */
export function resolve_chapter_history_slot(config, normalized = {}) {
  const args = normalized.chapter_history_args || {};
  if (!args.enabled || !args.target_entity) return "";
  return render_chapter_history_xml(args.target_entity, 2);
}

/**
 * CHANGELOG
 * - 2026-10-04: Plan/render split (Plan 2) — `resolve_history_plan` owns all filter/collapse/window/strip/budget decisions as frozen pure data, `render_history_plan` maps plans to `<ENTRY>` XML without branching; sensory shaping splits into `resolve_sensory_plan` + `render_sensory_plan`; the four public compilers become one-line compositions with byte-identical output; retired the `maximum_characters` / `input_tag` aliases (P4) and the dual `limit` vs `max_entries` wording now shares one vocabulary.
 * - 2026-10-04: Reverted sensory/visual history shaping (format_sensory_history, render_visual_history) from media/optics.js — history shaping lives here; chapter milestones stay in sheets.js.
 * - 2026-10-04: Optics history shaping (format_sensory_history, render_visual_history) moves to media/optics.js; chapter milestones move to sheets.js. This module owns transcript windows only.
 * - 2026-09-25: Unified History Pipeline — `render_history` now delegates directly to `format_history_entries` from `@utils/text.js`, unifying turn transcript serialization across platform and intelligence layers.
 * - 2026-09-25: DRY pass — `resolve_entry_origin`'s role fallback now calls the shared `role_display_label`.
 * - 2026-09-25: Stripping standardization — retired the local `strip_think_blocks` helper (it duplicated `strip_cognition_blocks` minus the DYNAMICS/artifact passes) and routed `format_sensory_history` + `render_visual_history` through the shared `strip_cognition_blocks` + `collapse_whitespace`; chapter summaries now clip via `truncate_at_word` instead of a mid-word `slice`.
 * - 2026-09-24: `render_visual_history` now strips the leading cognition block (and collapses whitespace) BEFORE truncating, so a word-boundary slice can no longer leave an unclosed <THINK> that `format_sensory_history` strips through to end-of-string — which had collapsed the optics <HISTORY> to a bare `Name:` line.
 * - 2026-09-24: Added `render_visual_history` — the optics (Sensory Cortex) recent-narrative window moved out of `media/visual.svelte.js` (`_build_visual_history`) so history shaping lives with the rest of the history module.
 * - 2026-09-22: One input channel (recommendation #5) — `render_input_history_xml`'s default tag is now `HISTORY` (was `INPUT_HISTORY`), matching the single input/history vocabulary.
 * - 2026-09-18: Absorbed format_sensory_history from deconstructed optics.js into Section 5.
 * - 2026-09-16: Unified turn and dialogue transcript formatting: merged format_recent_history into render_history, pruned format_recent_history under P4 Zero Backwards Compatibility, and updated render_input_history_xml to consume render_history with structured options.
 * - 2026-09-16: Refactored and standardized: (1) Extracted shared strip_think_blocks and resolve_entry_origin helpers, eliminating duplicated regex and origin-fallback chains; (2) Aligned round/origin attributes and streamlined history options handling.
 * - 2026-09-13: Token Optimization pass: (1) Replaced bloated multi-line 2-space indented JSON in format_recent_history and render_input_history_xml with symmetrical XML <ENTRY> sequences, cutting ~150-250 tokens per Continuum Caretaker background turn; (2) Added unvoiced <think> tag stripping in format_recent_history to enforce epistemic law and preserve word-budget for dialogue; (3) Adjusted render_history indentation to canonical 2-space child indent; (4) Normalized chapter prefixes in render_chapter_history_xml to eliminate repetitive "Chapter Chapter" stutter; (5) Added comprehensive unit test suite history.test.js.
 * - 2026-09-13: Comprehensive architectural rebuild & prompts.js symmetry — aligned history configuration with prompts.js manifest; supported direct configuration objects in render_input_history_xml with dynamic input_tag; enforced strict Full-Name nomenclature (eliminated single-letter variables m, c); structured into 4 distinct temporal horizon sections with Universal File Architecture.
 * - 2026-09-12: Standardization pass — added the `HISTORY_DEFAULTS` catalog + `resolve_history` resolver so modes drive their history window via `prompts.js` instead of call-site literals; `render_chapter_history_xml` / `render_input_history_xml` now compose through `render_xml_tag` (the `<INPUT_HISTORY>` JSON is uniformly indented).
 * - 2026-09-11: Initial creation of modular history.js extracting render_history, format_recent_history, render_chapter_history_xml, and render_input_history_xml.
 * Modules Ground Refactor Phase 2 — telemetry patterns built from physics DYNAMICS_METRIC_NAMES (mirrored copy retired) — prompt bytes byte-identical.
 */
