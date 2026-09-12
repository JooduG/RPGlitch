/**
 * src/intelligence/modules/history.js
 * ============================================================================
 * 📜 HISTORY MODULE — Turn History, Chapter Milestones & Dialogue Ingestion
 * ============================================================================
 *
 * Provides serialization and XML compilation of simulation history:
 * - Collapsing & formatting turn logs into <ENTRY> sequences (render_history)
 * - Recent dialogue JSON formatting for prompt ingestion (format_recent_history)
 * - Closed-chapter milestone boundary XML (render_chapter_history_xml)
 * - Enveloped recent history block (<INPUT_HISTORY>) (render_input_history_xml)
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation.
 * - Blueprint (format.js): `HISTORY_DEFAULTS` catalog + `resolve_history` resolver + pure compilers over @utils `render_xml_tag`.
 * - Single source of truth for conversational and episodic history formatting.
 * ============================================================================
 */

import { escape_xml, prompt_escape, collapse_history, truncate_at_word, render_xml_tag } from "@utils";

// ── 0. History Window Catalog & Resolver ──────────────────────────────────────

/**
 * Canonical history-window defaults. Modes override these via `prompts.js`
 * `history` layer config, resolved here so no call site hardcodes a window.
 * @type {Readonly<{ enabled: boolean, limit: number, max_chars: number, offset: number }>}
 */
export const HISTORY_DEFAULTS = Object.freeze({ enabled: true, limit: 16, max_chars: 400, offset: 0 });

/**
 * Resolves a mode's `history` config over the canonical defaults.
 * @param {Partial<typeof HISTORY_DEFAULTS>|null|undefined} [config]
 * @returns {{ enabled: boolean, limit: number, max_chars: number, offset: number }}
 */
export function resolve_history(config) {
  return { ...HISTORY_DEFAULTS, ...(config && typeof config === "object" ? config : {}) };
}

// ── 1. Turn Log XML Formatter ────────────────────────────────────────────────

/**
 * Collapses and formats turn history into clean XML entries.
 * @param {any[]} simulation_log
 * @param {number} [count=10]
 * @param {number} [offset=0]
 * @returns {string}
 */
export function render_history(simulation_log, count = 10, offset = 0) {
  if (!simulation_log || typeof simulation_log === "string") return simulation_log || "";
  const collapsed = collapse_history(simulation_log, { separator: "\n", stripBoldQuotes: true });
  const start = Math.max(0, collapsed.length - (count + offset));
  const end = Math.max(0, collapsed.length - offset);
  return collapsed
    .slice(start, end)
    .map((entry, index) => {
      const round_number = start + index + 1;
      const speaker = entry.name || (entry.role === "USER_PERSONA" ? "User" : entry.role === "FRACTAL" ? "Fractal" : "Character");
      const clean_content = String(entry.content || "")
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<\/?think>/gi, "")
        .trim();
      const origin = entry.origin || speaker;
      return `    <ENTRY round="${round_number}" origin="${escape_xml(origin)}">${prompt_escape(clean_content)}</ENTRY>`;
    })
    .join("\n");
}

// ── 2. Recent Dialogue JSON Ingestion ────────────────────────────────────────

/**
 * Formats recent dialogue / turn history for LLM prompt ingestion.
 * @param {Array<any>} [history]
 * @param {number} [max_turns=16]
 * @param {number} [max_chars=400]
 * @returns {string}
 */
export function format_recent_history(history = [], max_turns = 16, max_chars = 400) {
  const rows = Array.isArray(history) ? history.slice(-max_turns) : [];
  const compact = rows
    .filter((m) => {
      const text = String(m?.text ?? m?.content ?? "").trim();
      return text.length > 0;
    })
    .map((m) => ({
      role: m?.role || "",
      character_name: m?.character_name || "",
      text: truncate_at_word(String(m?.text ?? m?.content ?? ""), max_chars),
    }));
  return JSON.stringify(compact, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── 3. Chapter History & Input History XML ───────────────────────────────────

/**
 * Renders an entity's closed-chapter history so the Continuum Caretaker can
 * recognize milestone boundaries.
 * @param {any} entity
 * @param {number} [indent=0]
 * @returns {string}
 */
export function render_chapter_history_xml(entity, indent = 0) {
  const chapters = Array.isArray(entity?.chapters) ? entity.chapters : [];
  const closed = chapters.filter((c) => c?.status === "closed");
  if (!closed.length) return "";
  const rows = closed
    .slice(-6)
    .map((c) => `- Chapter ${escape_xml(String(c.title || "Untitled"))}: ${escape_xml(String(c.summary || "").slice(0, 220))}`);
  return render_xml_tag({ tag: "CHAPTER_HISTORY", children: rows, indent, separator: "\n" });
}

/**
 * Renders the full <INPUT_HISTORY> block with recent turn history.
 * @param {Array<any>} [history]
 * @param {number} [max_turns=16]
 * @param {number} [max_chars=400]
 * @returns {string}
 */
export function render_input_history_xml(history = [], max_turns = 16, max_chars = 400) {
  return render_xml_tag({
    tag: "INPUT_HISTORY",
    children: [format_recent_history(history, max_turns, max_chars)],
    indent: 2,
    child_indent: 2,
    separator: "\n",
  });
}

/**
 * CHANGELOG
 * - 2026-09-12: Standardization pass — added the `HISTORY_DEFAULTS` catalog + `resolve_history` resolver so modes drive their history window via `prompts.js` instead of call-site literals; `render_chapter_history_xml` / `render_input_history_xml` now compose through `render_xml_tag` (the `<INPUT_HISTORY>` JSON is uniformly indented).
 * - 2026-09-11: Initial creation of modular history.js extracting render_history, format_recent_history, render_chapter_history_xml, and render_input_history_xml.
 */
