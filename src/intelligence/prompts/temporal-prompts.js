/**
 * src/intelligence/prompts/temporal-prompts.js
 * ⏳ TEMPORAL PROMPTS — Memory Forge & State Extraction
 *
 * Dedicated prompt generator for the Temporal Engine (Memory Forge):
 * compiles single-entity memory extraction prompts and JSON schemas.
 * - Temporal Contract Definition (TEMPORAL_PROTOCOLS.CONTRACT)
 * - Memory Forge JSON Schema (TEMPORAL_PROTOCOLS.SCHEMA)
 * - Chapter History XML (render_chapter_history_xml)
 * - Entity Memory Context (render_entity_memory_context)
 * - Memory Forge Compiler (render_memory)
 */

import { ind, escape_xml, physical_to_xml, clean_xml } from "@utils";
import { PROFILE_FIELDS } from "@data";
import { render_protocols } from "./shared.js";

// ── 1. Temporal Contract & Schema Definitions ─────────────────────────────────

export const TEMPORAL_PROTOCOLS = {
  CONTRACT: `TEMPORAL LAYER CONTRACT — ETERNAL / PRESENT / FUTURE / PAST
- ETERNAL: Permanent baseline identity, personality traits, and physical form. Permanent narrative transformations update it; transient states belong in PRESENT. Explicit user edits always override.
- PRESENT: Immediate volatile state. "physical" holds active attire, injuries, and held props via bracketed state tags ([KEY: VALUE]); "non_physical" holds immediate mindset and emotional state. True only in this moment.
- FUTURE: Single consolidated standing agenda — impending intent, immediate objective, or unresolved tension driving the character forward. Written in active future tense.
- PAST: Settled historical anchors and durable facts. Append new consequential events only; never record transient moods.`,

  SCHEMA: `{
  "_thought_process": "<one short sentence analyzing recent events for target entity>",
  "target": "'AI_CHARACTER' | 'USER_PERSONA' | 'FRACTAL' | 'NPC_<id>'",
  "eternal": { "physical": "Permanent baseline appearance change or empty string", "non_physical": "Permanent personality shift or empty string" },
  "present": { "physical": "Clean updated current conditions (or empty string if unchanged)", "non_physical": "1-3 sentences of evocative present-tense state of mind matching the entity's register" },
  "future": "2-5 sentences of active future tense standing agenda rewritten from recent events",
  "past": [ { "content": "Durable fact emerged worth keeping (empty list if none)", "type": "past", "emotional_weight": 5 } ],
  "relationships": ["Source → Target: dynamic description"]
}`,
};

// ── 2. Context & History Helper Formatters ────────────────────────────────────

/**
 * Formats recent dialogue / turn history for LLM prompt ingestion.
 * @param {Array<any>} [history]
 * @param {number} [max_turns=8]
 * @param {number} [max_chars=400]
 * @returns {string}
 */
export function format_recent_history(history = [], max_turns = 8, max_chars = 400) {
  const rows = Array.isArray(history) ? history.slice(-max_turns) : [];
  const compact = rows
    .filter((m) => {
      const text = String(m?.text ?? m?.content ?? "").trim();
      return text.length > 0;
    })
    .map((m) => ({
      role: m?.role || "",
      character_name: m?.character_name || "",
      text: String(m?.text ?? m?.content ?? "").slice(0, max_chars),
    }));
  return JSON.stringify(compact, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
 * Renders an entity's internal memory context block.
 * @param {string} key
 * @param {any} entity
 * @returns {string}
 */
export function render_entity_memory_context(key, entity) {
  if (!entity) return "";
  const name = escape_xml(entity?.name || key);
  const is_fractal = key === "FRACTAL";
  const kind = is_fractal ? "fractal" : "character";

  const get_tag = (sec, sub) => PROFILE_FIELDS[sec]?.[sub]?.[kind]?.label?.toUpperCase()?.replace(/\s+/g, "_") || "";

  const tag_personality = get_tag("eternal", "non_physical");
  const tag_state_of_mind = get_tag("present", "non_physical");
  const tag_appearance = get_tag("eternal", "physical");
  const tag_current_look = get_tag("present", "physical");
  const tag_future = "AGENDA";

  return clean_xml(`
  <${key} name="${name}">
    <NAME>${name}</NAME>
    <${tag_personality}>${escape_xml(entity?.eternal?.non_physical || "")}</${tag_personality}>
    <${tag_state_of_mind}>${escape_xml(entity?.present?.non_physical || "")}</${tag_state_of_mind}>
    <${tag_appearance}>
      ${ind(
        physical_to_xml(entity?.eternal?.physical, "PHYSICAL")
          .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </${tag_appearance}>
    <${tag_current_look}>
      ${ind(
        physical_to_xml(entity?.present?.physical, "PHYSICAL")
          .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </${tag_current_look}>
    <${tag_future}>${escape_xml(String(entity?.future || "").trim())}</${tag_future}>
  </${key}>
  `).trim();
}

// ── 3. Memory Forge Compiler ──────────────────────────────────────────────────

/**
 * Memory Forge prompt compiler.
 * @param {Object} params
 * @param {any} params.target_entity
 * @param {string} [params.target_key="AI_CHARACTER"]
 * @param {Record<string, any>} [params.other_entities={}]
 * @param {Array<any>} [params.history=[]]
 * @returns {string}
 */
export function render_memory({ target_entity, target_key = "AI_CHARACTER", other_entities = {}, history = [] }) {
  const target_name = target_entity?.name || target_key;
  const target_xml = render_entity_memory_context(target_key, target_entity);

  const other_blocks = Object.entries(other_entities)
    .filter(([k, e]) => e && k !== target_key)
    .map(([k, e]) => {
      const summary = e.present?.non_physical || e.eternal?.non_physical || "Active in scene";
      return `  <IN_SCENE_PARTICIPANT name="${escape_xml(e.name || k)}" role="${escape_xml(k)}">\n    <SUMMARY>${escape_xml(summary)}</SUMMARY>\n  </IN_SCENE_PARTICIPANT>`;
    });

  const scene_cast_xml = other_blocks.length ? `  <SCENE_CAST>\n${other_blocks.join("\n")}\n  </SCENE_CAST>\n` : "";
  const chapter_xml = target_entity ? render_chapter_history_xml(target_entity) : "";

  return clean_xml(`
<SYSTEM role="CONTINUUM_CARETAKER" target="${escape_xml(target_key)}" name="${escape_xml(target_name)}">
  <PROTOCOLS>
    ${ind(render_protocols("HYGIENE.DATA, AGENCY.PRESENT_TENSE, HYGIENE.STATE_EMISSION"), 4)}
  </PROTOCOLS>
  <TARGET_ENTITY_CONTEXT>
${target_xml}
  </TARGET_ENTITY_CONTEXT>
${scene_cast_xml}${chapter_xml ? `  <CHAPTER_HISTORY>\n${ind(chapter_xml, 4)}\n  </CHAPTER_HISTORY>\n` : ""}  <INPUT_HISTORY>
    ${format_recent_history(history)}
  </INPUT_HISTORY>
  <TASK>
    ${ind(TEMPORAL_PROTOCOLS.CONTRACT, 4)}

    Analyze recent history specifically for TARGET ENTITY "${escape_xml(target_name)}" (${escape_xml(target_key)}). Record internal evaluation in "_thought_process".
    Extract state mutations and outward relationships ("${escape_xml(target_name)} → [Target]: [Dynamic]") strictly adhering to the contract.

    Output strict JSON matching this schema:
    ${TEMPORAL_PROTOCOLS.SCHEMA}
  </TASK>
</SYSTEM>
  `).trim();
}

/**
 * CHANGELOG
 * - 2026-08-28: Ground-up deconstruct & refactor: extracted format_recent_history helper, bound entity context tags directly to PROFILE_FIELDS, and streamlined Memory Forge compiler.
 */
