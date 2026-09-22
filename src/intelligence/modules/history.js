/**
 * src/intelligence/modules/history.js
 * ============================================================================
 * 📜 HISTORY MODULE — Turn History, Chapter Milestones & Dialogue Ingestion
 * ============================================================================
 *
 * Orchestrates conversation history, episodic milestone boundary XML, and turn
 * log serialization across the intelligence layer, establishing direct symmetrical
 * alignment with the prompt manifest specifications in `prompts.js`:
 *
 * 1. Manifest Window Resolver (HISTORY_DEFAULTS, resolve_history)
 * 2. Turn Transcript Log Formatter (render_history)
 * 3. Recent Dialogue Feed Formatter (format_recent_history, render_input_history_xml)
 * 4. Episodic Chapter Milestones (render_chapter_history_xml)
 *
 * Symmetrical Manifest Mapping:
 * - `config.history`                 ➔ `resolve_history`
 * - `config.task.input_tag`          ➔ `render_input_history_xml` wrapper tag
 * - `config.entities.chapter_history`➔ `render_chapter_history_xml`
 * - `accessors.simulation_log`       ➔ `render_history`
 *
 * Architecture & Design Laws:
 * - Unidirectional layer flow: pure string and structured XML compilation.
 * - Single source of truth for conversational, turn-based, and episodic history formatting.
 * - Strict Full-Name domain nomenclature (zero clipped or single-letter variables).
 * - Zero Backwards Compatibility: Ruthless purity, no deprecated wrappers or shims.
 * ============================================================================
 */

import {
  escape_xml,
  prompt_escape,
  collapse_history,
  collapse_whitespace,
  truncate_at_word,
  render_xml_tag,
  strip_cognition_blocks,
  role_display_label,
} from "@utils";

// ============================================================================
// [INTERNAL UTILITIES]
// ============================================================================

/**
 * Resolves a speaker's entity origin from raw entry or message properties.
 *
 * @param {Record<string, any>} entry
 * @returns {string}
 */
function resolve_entry_origin(entry) {
  return entry?.character_name || entry?.name || entry?.origin || role_display_label(entry?.role);
}

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
 * @returns {{ enabled: boolean, limit: number, max_chars: number, offset: number }}
 */
export function resolve_history(configuration) {
  return {
    ...HISTORY_DEFAULTS,
    ...(configuration && typeof configuration === "object" ? configuration : {}),
  };
}

// ============================================================================
// [SECTION 2: TURN & DIALOGUE TRANSCRIPT FORMATTER]
// ============================================================================

/**
 * Collapses and formats turn-based simulation history or dialogue messages into clean XML <ENTRY> sequences.
 * Strips internal unvoiced <think> blocks and attaches verified round indices and origins.
 *
 * @param {any[]} history - Array of raw dialogue entries or message objects.
 * @param {Object} [options={}]
 * @param {number} [options.limit=16] - Number of recent collapsed turns or messages to display.
 * @param {number} [options.offset=0] - Offset from the end of the history window.
 * @param {number} [options.max_chars] - Optional maximum characters to truncate entry content at word boundaries.
 * @param {boolean} [options.collapse=true] - Whether to collapse consecutive turns via collapse_history.
 * @param {number} [options.indent=0] - Indentation spaces preceding each <ENTRY> tag.
 * @returns {string}
 */
export function render_history(history, options = {}) {
  if (!history || typeof history === "string") {
    return history || "";
  }

  const limit = options.limit ?? HISTORY_DEFAULTS.limit;
  const offset = options.offset ?? 0;
  const max_chars = options.max_chars;
  const should_collapse = options.collapse ?? true;
  const indent = options.indent ?? 0;

  const raw_entries = should_collapse
    ? collapse_history(history, {
        separator: "\n",
        stripBoldQuotes: true,
      })
    : Array.isArray(history)
      ? history
      : [];

  const start_index = Math.max(0, raw_entries.length - (limit + offset));
  const end_index = Math.max(0, raw_entries.length - offset);

  return raw_entries
    .slice(start_index, end_index)
    .map((entry, index) => {
      const raw_text = String(entry?.text ?? entry?.content ?? "");
      const clean_text = strip_cognition_blocks(raw_text);
      if (!clean_text) return null;

      const round_number = start_index + index + 1;
      const origin = entry.origin || resolve_entry_origin(entry);
      const content = max_chars ? truncate_at_word(clean_text, max_chars) : clean_text;

      return render_xml_tag({
        tag: "ENTRY",
        attrs: { round: round_number, origin },
        children: [prompt_escape(content)],
        indent,
        inline: true,
      });
    })
    .filter(Boolean)
    .join("\n");
}

// ============================================================================
// [SECTION 3: RECENT DIALOGUE FEED XML ENVELOPE]
// ============================================================================

/**
 * Renders the enveloped recent dialogue history XML block (the single `<HISTORY>` tag).
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
  const resolved_limit = options.limit ?? HISTORY_DEFAULTS.limit;
  const resolved_characters = options.max_chars ?? options.maximum_characters ?? HISTORY_DEFAULTS.max_chars;
  const tag = options.tag || options.input_tag || "HISTORY";
  const indent = options.indent ?? 2;
  const child_indent = options.child_indent ?? 2;

  const formatted_history = render_history(history, {
    limit: resolved_limit,
    max_chars: resolved_characters,
    collapse: false,
    indent: 0,
  });

  if (!formatted_history) return "";

  return render_xml_tag({
    tag,
    children: [formatted_history],
    indent,
    child_indent,
    separator: "\n",
  });
}

// ============================================================================
// [SECTION 4: EPISODIC CHAPTER MILESTONES]
// ============================================================================

/**
 * Renders an entity's closed-chapter milestone boundaries into a structured <CHAPTER_HISTORY> XML block.
 * Symmetrically activated when `config.entities.chapter_history` is enabled.
 *
 * @param {any} target_entity
 * @param {number} [indentation_level=0]
 * @returns {string}
 */
export function render_chapter_history_xml(target_entity, indentation_level = 0) {
  const chapters = Array.isArray(target_entity?.chapters) ? target_entity.chapters : [];
  const closed_chapters = chapters.filter((chapter) => chapter?.status === "closed");
  if (!closed_chapters.length) return "";

  const chapter_rows = closed_chapters.slice(-6).map((chapter) => {
    const raw_title = String(chapter.title || "Untitled").trim();
    const normalized_title = raw_title.replace(/^Chapter\s+/i, "");
    const clean_summary = truncate_at_word(String(chapter.summary || ""), 220);
    return `- Chapter ${escape_xml(normalized_title)}: ${escape_xml(clean_summary)}`;
  });

  return render_xml_tag({
    tag: "CHAPTER_HISTORY",
    children: chapter_rows,
    indent: indentation_level,
    separator: "\n",
  });
}

// ============================================================================
// [SECTION 5: SENSORY CORTEX HISTORY FORMATTING]
// ============================================================================

/**
 * Formats recent narrative history for the sensory cortex, stripping dangling think tags and telemetry lines.
 * @param {string} [history_text]
 * @returns {string}
 */
export function format_sensory_history(history_text) {
  if (!history_text || typeof history_text !== "string") return "";
  const cleaned = strip_cognition_blocks(history_text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (/^(system|telemetry):\s*(?:chaos|intensity|openness|affinity|velocity|entropy)\s*[+-]\d+/i.test(line)) return false;
      if (/(?:chaos|intensity|openness|affinity|velocity|entropy)\s*[+-]\d+\s*\|/i.test(line)) return false;
      return true;
    })
    .join("\n")
    .trim();
  return cleaned ? `<HISTORY>\n${prompt_escape(cleaned)}\n</HISTORY>\n` : "";
}

// ============================================================================
// [SECTION 6: VISUAL STAGING HISTORY]
// ============================================================================

/**
 * Builds the compact recent-narrative history fed to the optics (Sensory Cortex) prompt —
 * one `Character: prose` line per recent non-system beat, truncated at word boundaries.
 * Owned here beside `format_sensory_history` so no media call site hand-rolls a window.
 *
 * @param {any[]} [entries] - Simulation feed entries (typically `simulation_log.feed`).
 * @param {Object} [options={}]
 * @param {number} [options.max_entries=2] - Number of most recent beats to include.
 * @param {number} [options.max_chars=200] - Per-entry character budget (word-boundary truncated).
 * @returns {string}
 */
export function render_visual_history(entries, { max_entries = 2, max_chars = 200 } = {}) {
  if (!Array.isArray(entries) || entries.length === 0) return "";
  return entries
    .filter((entry) => entry && entry.role !== "system" && typeof entry.text === "string" && entry.text.trim())
    .slice(-max_entries)
    .map((entry) => {
      // Strip cognition BEFORE truncating. Beats are stored with their leading
      // <THINK> block, and slicing the raw text first can leave that block unclosed;
      // format_sensory_history's strip_cognition_blocks then eats an unclosed <THINK>
      // through to end-of-string, collapsing the whole line to a bare "Name:".
      const prose = collapse_whitespace(strip_cognition_blocks(entry.text));
      if (!prose) return "";
      return `${entry.character_name || entry.role || "narrator"}: ${truncate_at_word(prose, max_chars)}`;
    })
    .filter(Boolean)
    .join("\n");
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
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
 */
