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

import { escape_xml, prompt_escape, collapse_history, truncate_at_word, render_xml_tag } from "@utils";

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
// [SECTION 2: TURN TRANSCRIPT LOG FORMATTER]
// ============================================================================

/**
 * Collapses and formats turn-based simulation history into clean XML <ENTRY> sequences.
 * Strips internal <think> blocks and attaches verified round indices and origins.
 *
 * @param {any[]} simulation_log - Array of raw dialogue entries or message objects.
 * @param {number} [entry_limit=10] - Number of recent collapsed turns to display.
 * @param {number} [offset=0] - Offset from the end of the history window.
 * @returns {string}
 */
export function render_history(simulation_log, entry_limit = 10, offset = 0) {
  if (!simulation_log || typeof simulation_log === "string") {
    return simulation_log || "";
  }

  const collapsed_history = collapse_history(simulation_log, {
    separator: "\n",
    stripBoldQuotes: true,
  });

  const start_index = Math.max(0, collapsed_history.length - (entry_limit + offset));
  const end_index = Math.max(0, collapsed_history.length - offset);

  return collapsed_history
    .slice(start_index, end_index)
    .map((entry, index) => {
      const round_number = start_index + index + 1;
      const speaker = entry.name || (entry.role === "USER_PERSONA" ? "User" : entry.role === "FRACTAL" ? "Fractal" : "Character");

      const clean_content = String(entry.content || "")
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<\/?think>/gi, "")
        .trim();

      const origin = entry.origin || speaker;
      return `  <ENTRY round="${round_number}" origin="${escape_xml(origin)}">${prompt_escape(clean_content)}</ENTRY>`;
    })
    .join("\n");
}

// ============================================================================
// [SECTION 3: RECENT DIALOGUE FEED FORMATTER]
// ============================================================================

/**
 * Formats recent dialogue / turn history into compact XML <ENTRY> sequences for prompt ingestion.
 * Strips internal unvoiced <think> blocks before word-boundary truncation.
 *
 * @param {Array<any>} [history=[]]
 * @param {number} [message_limit=16]
 * @param {number} [maximum_characters=400]
 * @returns {string}
 */
export function format_recent_history(history = [], message_limit = 16, maximum_characters = 400) {
  const recent_messages = Array.isArray(history) ? history.slice(-message_limit) : [];
  return recent_messages
    .map((message, index) => {
      const raw_text = String(message?.text ?? message?.content ?? "");
      const clean_text = raw_text
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<\/?think>/gi, "")
        .trim();
      if (!clean_text) return null;

      const origin =
        message?.character_name ||
        message?.name ||
        message?.origin ||
        (message?.role === "USER_PERSONA" || message?.role === "user" ? "User" : message?.role === "FRACTAL" ? "Fractal" : "Character");

      const truncated_text = truncate_at_word(clean_text, maximum_characters);
      return `<ENTRY origin="${escape_xml(origin)}" round="${index + 1}">${prompt_escape(truncated_text)}</ENTRY>`;
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Renders the enveloped recent dialogue history XML block (<INPUT_HISTORY> or manifest-specified tag).
 * Accepts either explicit numeric bounds or a manifest history configuration object.
 *
 * @param {Array<any>} [history=[]]
 * @param {number|Object} [options_or_limit=16] - Message limit or configuration object.
 * @param {number} [maximum_characters=400]
 * @param {Object} [options={}]
 * @param {string} [options.tag="INPUT_HISTORY"]
 * @param {number} [options.indent=2]
 * @param {number} [options.child_indent=2]
 * @returns {string}
 */
export function render_input_history_xml(history = [], options_or_limit = 16, maximum_characters = 400, options = {}) {
  const is_options_object = typeof options_or_limit === "object" && options_or_limit !== null;
  const resolved_options = is_options_object
    ? { ...options_or_limit, ...options }
    : { limit: options_or_limit, max_chars: maximum_characters, ...options };

  const resolved_limit = resolved_options.limit ?? HISTORY_DEFAULTS.limit;
  const resolved_characters = resolved_options.max_chars ?? resolved_options.maximum_characters ?? HISTORY_DEFAULTS.max_chars;
  const tag = resolved_options.tag || resolved_options.input_tag || "INPUT_HISTORY";
  const indent = resolved_options.indent ?? 2;
  const child_indent = resolved_options.child_indent ?? 2;

  const formatted_history = format_recent_history(history, resolved_limit, resolved_characters);
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
    const clean_summary = String(chapter.summary || "").slice(0, 220);
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
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-13: Token Optimization pass: (1) Replaced bloated multi-line 2-space indented JSON in format_recent_history and render_input_history_xml with symmetrical XML <ENTRY> sequences, cutting ~150-250 tokens per Continuum Caretaker background turn; (2) Added unvoiced <think> tag stripping in format_recent_history to enforce epistemic law and preserve word-budget for dialogue; (3) Adjusted render_history indentation to canonical 2-space child indent; (4) Normalized chapter prefixes in render_chapter_history_xml to eliminate repetitive "Chapter Chapter" stutter; (5) Added comprehensive unit test suite history.test.js.
 * - 2026-09-13: Comprehensive architectural rebuild & prompts.js symmetry — aligned history configuration with prompts.js manifest; supported direct configuration objects in render_input_history_xml with dynamic input_tag; enforced strict Full-Name nomenclature (eliminated single-letter variables m, c); structured into 4 distinct temporal horizon sections with Universal File Architecture.
 * - 2026-09-12: Standardization pass — added the `HISTORY_DEFAULTS` catalog + `resolve_history` resolver so modes drive their history window via `prompts.js` instead of call-site literals; `render_chapter_history_xml` / `render_input_history_xml` now compose through `render_xml_tag` (the `<INPUT_HISTORY>` JSON is uniformly indented).
 * - 2026-09-11: Initial creation of modular history.js extracting render_history, format_recent_history, render_chapter_history_xml, and render_input_history_xml.
 */
