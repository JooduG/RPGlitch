/**
 * src/intelligence/prompts/temporal-prompts.js
 * ⏳ TEMPORAL PROMPTS — Memory Forge & Back Shot Schema
 *
 * Dedicated prompt generator for the Temporal Engine (Back Shot Forge):
 * compiles single-entity memory extraction prompts and JSON schemas. (BACK_SHOT_JSON_SCHEMA)
 * - Chapter History XML (render_chapter_history_xml)
 * - Entity Memory Context (render_entity_memory_context)
 * - Back Shot Forge Compiler (render_memory / build_memory_prompt)
 */

import { ind, escape_xml, physical_to_xml } from "@utils";
import { TEMPORAL_CONTRACT } from "@data";
import { clean_xml } from "../parser.js";
import { render_protocols } from "./shared.js";

export const BACK_SHOT_JSON_SCHEMA = `{
  "_thought_process": "<one short sentence analyzing recent events for target entity>",
  "target": "'AI_CHARACTER' | 'USER_PERSONA' | 'FRACTAL' | 'NPC_<id>'",
  "eternal": { "physical": "Permanent baseline appearance change or empty string", "non_physical": "Permanent personality shift or empty string" },
  "present": { "physical": "Clean updated current conditions (or empty string if unchanged)", "non_physical": "1-3 sentences of evocative present-tense state of mind matching the entity's register" },
  "future": "2-5 sentences of active future tense standing agenda rewritten from recent events",
  "past": [ { "content": "Durable fact emerged worth keeping (empty list if none)", "type": "past", "emotional_weight": 5 } ],
  "relationships": ["Source → Target: dynamic description"]
}`;

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
  const is_user = key === "USER_PERSONA";
  const T = {
    personality: is_fractal ? "METAPHYSICAL_TRUTHS" : "PERSONALITY",
    state_of_mind: is_fractal ? "CURRENT_STATE" : "STATE_OF_MIND",
    appearance: is_fractal ? "ENVIRONMENT" : "PERMANENT_APPEARANCE",
    current_look: is_fractal ? "ACTIVE_ATMOSPHERE" : "CURRENT_LOOK",
    future: is_fractal || is_user ? "AGENDA" : "INTENT",
  };
  return clean_xml(`
  <${key} name="${name}">
    <NAME>${name}</NAME>
    <${T.personality}>${escape_xml(entity?.eternal?.non_physical || "")}</${T.personality}>
    <${T.state_of_mind}>${escape_xml(entity?.present?.non_physical || "")}</${T.state_of_mind}>
    <${T.appearance}>
      ${ind(
        physical_to_xml(entity?.eternal?.physical, "PHYSICAL")
          .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </${T.appearance}>
    <${T.current_look}>
      ${ind(
        physical_to_xml(entity?.present?.physical, "PHYSICAL")
          .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
          .trim(),
        6,
      )}
    </${T.current_look}>
    <${T.future}>${escape_xml(String(entity?.future || "").trim())}</${T.future}>
  </${key}>
  `).trim();
}

/**
 * Back Shot Forge prompt compiler.
 * @param {any} params
 * @returns {string}
 */
export function render_memory({ target_entity, target_key = "AI_CHARACTER", other_entities = {}, history = [] }) {
  const target_name = target_entity?.name || target_key;
  const target_xml = render_entity_memory_context(target_key, target_entity);

  const other_blocks = Object.entries(other_entities)
    .filter(([k, e]) => e && k !== target_key)
    .map(([k, e]) => {
      const summary = e.present?.non_physical || e.eternal?.non_physical || "Active in scene";
      return `  <OTHER_ENTITY name="${escape_xml(e.name || k)}" role="${escape_xml(k)}">\n    <SUMMARY>${escape_xml(summary)}</SUMMARY>\n  </OTHER_ENTITY>`;
    });

  const scene_cast_xml = other_blocks.length ? `  <SCENE_CAST>\n${other_blocks.join("\n")}\n  </SCENE_CAST>\n` : "";
  const chapter_xml = target_entity ? render_chapter_history_xml(target_entity) : "";

  return clean_xml(`
<SYSTEM role="BACK_SHOT_FORGE" target="${escape_xml(target_key)}" name="${escape_xml(target_name)}">
  <PROTOCOLS>
    ${ind(render_protocols("HYGIENE.DATA, HYGIENE.AFFIRMATIVE, AGENCY.PRESENT_TENSE, PRESENT.EMISSION"), 4)}
  </PROTOCOLS>
  <TARGET_ENTITY_CONTEXT>
${target_xml}
  </TARGET_ENTITY_CONTEXT>
${scene_cast_xml}${chapter_xml ? `  <CHAPTER_HISTORY>\n${ind(chapter_xml, 4)}\n  </CHAPTER_HISTORY>\n` : ""}  <INPUT_HISTORY>
    ${(() => {
      const rows = Array.isArray(history) ? history.slice(-8) : [];
      const compact = rows.map((m) => ({
        role: m?.role || "",
        character_name: m?.character_name || "",
        text: String(m?.text ?? m?.content ?? "").slice(0, 400),
      }));
      return JSON.stringify(compact, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    })()}
  </INPUT_HISTORY>
  <TASK>
    ${ind(TEMPORAL_CONTRACT, 4)}

    Analyze recent history specifically for TARGET ENTITY "${escape_xml(target_name)}" (${escape_xml(target_key)}). Record internal evaluation in "_thought_process".
    Return a single JSON object with updates for this entity:
      - "target": "${escape_xml(target_key)}"
      - "eternal": Record permanent identity, psychological, or physical changes to baseline form (or empty string).
      - "present": Rewrite clean, updated current look (physical) and state of mind (non_physical). RETAIN physical attire/clothing.
      - "future": Rewrite standing agenda as 2-5 sentences (active future tense). Evict completed milestones; refresh active focus.
      - "past": Durable settled facts emerged worth keeping as memories (or empty list []). No transient moods.
      - "relationships": Outward relationship edges originating from ${escape_xml(target_name)} in format "[Source] → [Target]: [Dynamic]" (e.g. "${escape_xml(target_name)} → Other: dynamic").

    Output strict JSON matching this schema:
    ${BACK_SHOT_JSON_SCHEMA}
  </TASK>
</SYSTEM>
  `).trim();
}
