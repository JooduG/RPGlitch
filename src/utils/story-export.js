/**
 * src/utils/story-export.js
 * 📚 STORY MARKDOWN ENGINE
 * Compiles a story record + its simulation log into a clean, portable .md
 * transcript for archival. Pure + deterministic; no DOM, no imports beyond @utils.
 */

import { strip_cognition_blocks } from "./text.js";

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
export function format_story_beat(entry) {
  if (!entry || typeof entry !== "object") return null;
  const raw_text = entry.text ?? entry.content ?? "";
  if (typeof raw_text !== "string" || !raw_text.trim()) return null;

  const text = strip_cognition_blocks(raw_text).trim();
  if (!text) return null;

  const role = String(entry.role || "").toLowerCase();
  if (NARRATOR_ROLES.has(role)) return `> ${text.replace(/\n+/g, "\n> ")}`;
  if (role === "system") return `_${text.replace(/\n+/g, " ")}_`;

  const name = String(entry.character_name || "").trim();
  const label = role === "user" ? name || "You" : name || "Unknown";
  return `**${label}:** ${text.replace(/\n+/g, " ")}`;
}

/**
 * Formats a timestamp as YYYY-MM-DD HH:mm (Swedish/ISO-adjacent, matches the
 * app's story-card display).
 * @param {number | string | Date | null | undefined} ts
 * @returns {string}
 */
function format_timestamp(ts) {
  if (!ts) return "---";
  return new Date(ts).toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Compiles a story record and its simulation-log entries into a markdown
 * document. Groups beats by round when the log carries round numbers.
 * @param {Object} story
 * @param {any[]} [entries]
 * @returns {string}
 */
export function export_story_markdown(story = {}, entries = []) {
  const title = String(story.title || "Untitled Fragment");
  const is_concluded = story.state === "concluded" || !!story.is_concluded;
  const log = Array.isArray(entries) ? entries : [];
  const beats = log.filter((e) => typeof (e?.text ?? e?.content) === "string" && (e.text || e.content).trim()).length;
  const rounds = new Set(log.filter((e) => e?.round != null).map((e) => e.round));

  const lines = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(
    `> **State:** ${is_concluded ? "Concluded" : "Active"} · **Last played:** ${format_timestamp(story.last_played ?? story.updated_at)} · **Beats:** ${beats} · **Rounds:** ${rounds.size}`,
  );
  lines.push("");

  let last_round = null;
  for (const entry of log) {
    const beat = format_story_beat(entry);
    if (!beat) continue;

    const round = entry.round ?? null;
    if (round != null && round !== last_round) {
      if (last_round !== null) lines.push("---", "");
      lines.push(`## Round ${round}`);
      lines.push("");
      last_round = round;
    }
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
