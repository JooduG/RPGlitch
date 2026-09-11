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
 * - Single source of truth for conversational and episodic history formatting.
 * ============================================================================
 */

import { escape_xml, prompt_escape, collapse_history, truncate_at_word } from "@utils";

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
 * Renders an entity's closed-chapter history so the Memory Forge can
 * recognize milestone boundaries.
 * @param {any} entity
 * @returns {string}
 */
export function render_chapter_history_xml(entity) {
  const chapters = Array.isArray(entity?.chapters) ? entity.chapters : [];
  const closed = chapters.filter((c) => c?.status === "closed");
  if (!closed.length) return "";
  const rows = closed
    .slice(-6)
    .map((c) => `- Chapter ${escape_xml(String(c.title || "Untitled"))}: ${escape_xml(String(c.summary || "").slice(0, 220))}`);
  return `<CHAPTER_HISTORY>\n${rows.join("\n")}\n</CHAPTER_HISTORY>`;
}

/**
 * Renders the full <INPUT_HISTORY> block with recent turn history.
 * @param {Array<any>} [history]
 * @param {number} [max_turns=16]
 * @param {number} [max_chars=400]
 * @returns {string}
 */
export function render_input_history_xml(history = [], max_turns = 16, max_chars = 400) {
  return `  <INPUT_HISTORY>\n    ${format_recent_history(history, max_turns, max_chars)}\n  </INPUT_HISTORY>`;
}

/**
 * CHANGELOG
 * - 2026-09-11: Initial creation of modular history.js extracting render_history, format_recent_history, render_chapter_history_xml, and render_input_history_xml.
 */
