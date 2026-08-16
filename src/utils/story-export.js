/**
 * src/utils/story-export.js
 * 📚 STORY MARKDOWN ENGINE
 * Compiles a story record + its simulation log into a clean, portable .md
 * transcript for archival. Pure + deterministic; no DOM, no imports beyond @utils.
 */

import { format_datetime, strip_cognition_blocks } from "./text.js";

/** Roles rendered as narrator blockquotes (world/scene-setting prose). */
const NARRATOR_ROLES = new Set(["prologue", "fractal", "narrator", "epilogue"]);

/**
 * Formats a raw log entry into a markdown beat. Returns null for empty entries.
 *  - narrator roles   -> blockquote
 *  - system telemetry -> italic note
 *  - user/character   -> **Name:** prose
 * @param {any} entry
 * @returns {string|null}
 */
export function format_story_beat(entry, options = {}) {
  if (!entry || typeof entry !== "object") return null;
  const raw_text = entry.text ?? entry.content ?? "";
  if (typeof raw_text !== "string" || !raw_text.trim()) return null;

  const role = String(entry.role || "").toLowerCase();
  if (role === "system" && !options.include_system) return null;

  const text = strip_cognition_blocks(raw_text).trim();
  if (!text) return null;

  if (NARRATOR_ROLES.has(role)) return `> ${text.replace(/\n+/g, "\n> ")}`;
  if (role === "system") return `_${text.replace(/\n+/g, " ")}_`;

  const name = String(entry.character_name || "").trim();
  const label = role === "user" ? name || "You" : name || "Unknown";
  return `**${label}:** ${text.replace(/\n+/g, " ")}`;
}

/**
 * Compiles a story record and its simulation-log entries into a clean markdown
 * document formatted as pure dialogue and world narrative.
 * @param {Object} story
 * @param {any[]} [entries]
 * @param {Object} [options]
 * @returns {string}
 */
export function export_story_markdown(story = {}, entries = [], options = {}) {
  const title = String(story.title || "Untitled Fragment");
  const is_concluded = story.state === "concluded" || !!story.is_concluded;
  const log = Array.isArray(entries) ? entries : [];

  const formatted_beats = [];
  for (const entry of log) {
    const beat = format_story_beat(entry, options);
    if (beat) formatted_beats.push(beat);
  }

  const lines = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(
    `> **State:** ${is_concluded ? "Concluded" : "Active"} · **Last played:** ${format_datetime(story.last_played ?? story.updated_at)} · **Beats:** ${formatted_beats.length}`,
  );
  lines.push("");

  for (const beat of formatted_beats) {
    lines.push(beat);
    lines.push("");
  }
  return lines.join("\n").trim() + "\n";
}

/**
 * Builds the download filename for a story export: story-{slug}-{YYYY-MM-DD}.md
 * @param {Object} story
 * @param {Date} [date]
 * @returns {string}
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
