/**
 * src/utils/story-export.js
 * 📚 STORY MARKDOWN TRANSCRIPT & EXPORT ENGINE
 *
 * Core Responsibilities:
 * - Compiles a story session record and its chronological simulation-log entries into clean, portable markdown.
 * - Formats narrative beats:
 *   - Narrator / Fractal / Prologue / Epilogue -> Multi-line markdown blockquotes (`> text`).
 *   - User / Persona -> Bold attribution (`**Name:** text` or `**You:** text`).
 *   - AI Characters -> Bold character name (`**Character:** text`).
 *   - System Telemetry -> Italicized notes (`_text_`), omitted by default for pure story immersion.
 * - Strips `<think>` cognition blocks before export.
 * - Generates sanitized, timestamped download filenames (`story-{slug}-{YYYY-MM-DD}.md`).
 *
 * Consumed by:
 * - `src/ui/story/StoryManager.svelte` (Story archive download).
 * - `src/ui/console/Console.svelte` (Dev console story export).
 */

import { format_datetime, strip_cognition_blocks } from "./text.js";

// ============================================================================
// [SECTION 1: CONSTANTS & NARRATOR ROLES]
// ============================================================================

/**
 * Roles rendered as narrator blockquotes (world/scene-setting prose).
 * @type {ReadonlySet<string>}
 */
export const NARRATOR_ROLES = Object.freeze(new Set(["prologue", "fractal", "narrator", "epilogue"]));

/**
 * @typedef {Object} StoryExportOptions
 * @property {boolean} [include_system=false] - Whether to include system telemetry entries.
 */

/**
 * @typedef {Object} StoryBeatEntry
 * @property {string} [role] - Log entry turn role (e.g. user, assistant, fractal, system).
 * @property {string} [character_name] - Name of the speaking entity.
 * @property {string} [text] - Primary narrative text.
 * @property {string} [content] - Fallback content text.
 */

/**
 * @typedef {Object} StoryRecord
 * @property {string} [title] - Title of the story fragment.
 * @property {string} [state] - Active state (active, concluded, collapsed).
 * @property {string} [conclusion_status] - Concluded status descriptor.
 * @property {number} [last_played] - Epoch timestamp of last turn.
 * @property {number} [updated_at] - Epoch timestamp of last update.
 * @property {boolean} [is_concluded] - Flag indicating conclusion.
 */

// ============================================================================
// [SECTION 2: BEAT FORMATTING ENGINE]
// ============================================================================

/**
 * Formats a raw simulation-log entry into a clean markdown beat. Returns null for empty entries.
 * @param {StoryBeatEntry | unknown} entry - Log entry to format.
 * @param {StoryExportOptions} [options={}]
 * @returns {string | null} Formatted markdown string, or null if filtered.
 */
export function format_story_beat(entry, options = {}) {
  if (!entry || typeof entry !== "object") return null;

  const raw_entry = /** @type {StoryBeatEntry} */ (entry);
  const raw_text = raw_entry.text ?? raw_entry.content ?? "";
  if (typeof raw_text !== "string" || !raw_text.trim()) return null;

  const role = String(raw_entry.role || "").toLowerCase();
  if (role === "system" && !options.include_system) return null;

  const text = strip_cognition_blocks(raw_text).trim();
  if (!text) return null;

  if (NARRATOR_ROLES.has(role)) {
    return `> ${text.replace(/\n+/g, "\n> ")}`;
  }

  if (role === "system") {
    return `_${text.replace(/\n+/g, " ")}_`;
  }

  const name = String(raw_entry.character_name || "").trim();
  const label = role === "user" ? name || "You" : name || "Unknown";
  return `**${label}:** ${text.replace(/\n+/g, " ")}`;
}

// ============================================================================
// [SECTION 3: DOCUMENT COMPILATION ENGINE]
// ============================================================================

/**
 * Compiles a story record and its simulation-log entries into a clean markdown document.
 * @param {StoryRecord} [story={}] - Story metadata record.
 * @param {Array<StoryBeatEntry>} [entries=[]] - Array of chronological log entries.
 * @param {StoryExportOptions} [options={}]
 * @returns {string} Fully compiled markdown transcript.
 */
export function export_story_markdown(story = {}, entries = [], options = {}) {
  const title = String(story.title || "Untitled Fragment");
  const is_collapsed = story.conclusion_status === "COLLAPSED" || story.state === "collapsed";
  const is_concluded = is_collapsed || story.state === "concluded" || !!story.is_concluded;
  const state_label = is_collapsed ? "Collapsed (Tragic Ending)" : is_concluded ? "Concluded" : "Active";

  const log = Array.isArray(entries) ? entries : [];
  const formatted_beats = [];

  for (const entry of log) {
    const beat = format_story_beat(entry, options);
    if (beat) {
      formatted_beats.push(beat);
    }
  }

  const timestamp = story.last_played ?? story.updated_at;
  const lines = [
    `# ${title}`,
    "",
    `> **State:** ${state_label} · **Last played:** ${format_datetime(timestamp)} · **Beats:** ${formatted_beats.length}`,
    "",
  ];

  for (const beat of formatted_beats) {
    lines.push(beat);
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

// ============================================================================
// [SECTION 4: EXPORT FILENAME BUILDER]
// ============================================================================

/**
 * Builds a standardized download filename for story exports (`story-{slug}-{YYYY-MM-DD}.md`).
 * @param {StoryRecord} [story={}] - Target story record.
 * @param {Date} [date=new Date()] - Date stamp for filename.
 * @returns {string} Sanitized filename string.
 */
export function build_story_export_filename(story = {}, date = new Date()) {
  const slug =
    String(story.title || "story")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "story";

  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `story-${slug}-${stamp}.md`;
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported frozen NARRATOR_ROLES collection, defined StoryRecord/Beat
 *   JSDoc schemas, and verified 100% test pass.
 * - 2026-06-15: Initial story markdown compilation and filename builder implementation.
 */
