/**
 * src/intelligence/prompts/director-prompts.js
 * 📐 DIRECTOR PROMPTS — Quick Shot Prompt Compiler & Schema
 *
 * Dedicated prompt generator for the Quick Shot Director:
 * - DIRECTOR_JSON_SCHEMA (canonical schema definition)
 * - DIRECTOR_PROTOCOLS (director-specific operational laws)
 * - render_director (Director system & task prompt compiler)
 * - render_terse_director_task (Fast-path recovery task on retry)
 */

import { get_style_keywords } from "@data";
import { ind, escape_xml, clean_xml } from "@utils";
import { build_available_keywords_xml } from "./physics-prompts.js";
import { strip_cognition_blocks } from "../parser.js";
import {
  render_system_head,
  render_field_value,
  format_dynamics_attrs,
  resolve_active_style_key,
  render_roster_xml,
  render_scene_roster_xml,
  render_relational_mesh_xml,
  ENTITY_CONVERGENCE_LAW_XML,
  EPISTEMIC_ROSTER_RULES_XML,
  non_verbal_environmental_hint,
  render_protocols,
  render_builder,
} from "./shared.js";

export const DIRECTOR_JSON_SCHEMA = `{
  "_thought_process": "<ONE short sentence: tactical intent & state delta>",
  "next_action": "'AI_CHARACTER' (AI speaks) | 'FRACTAL' (Fractal narrates) | 'npc:<id>' (in-scene NPC speaks) | 'GENESIS' (mint brand-new NPC) | 'EPILOGUE_CONCLUDED' (quest won) | 'EPILOGUE_COLLAPSED' (quest lost)",
  "keywords": "1-3 keywords from <AVAILABLE_KEYWORDS> (e.g. ['vulnerability', 'cinematic_shot']) or []",
  "directors_note": "1-3 lines of unseen acting/staging directives for the speaker",
  "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0 },
  "in_scene_change": { "enter": ["npc:<id>"], "exit": ["npc:<id>"] }
}`;

export const DIRECTOR_PROTOCOLS = {
  CONTINUITY: `SECRET AGENDAS: <INTENT>/<AGENDA> vectors encode private ambitions. Weave entity vectors indirectly into atmosphere/obstacles. Never present another entity's hidden agenda as known fact to the AI character.
PHYSICAL CAUSALITY LAW: Enforce strict physical causality and environmental integrity. If <USER_ACTION> attempts an impossible physical feat (e.g. walking through locked solid steel/stone barriers without established magic, or materializing unearned items from thin air), do NOT passively allow or join the violation. Flag it in "directive" as a physical obstacle, impossible attempt, or contradiction for the AI character to confront, block, or question in-character.
PROP PROVENANCE LAW: Personal, everyday items a character could plausibly be carrying (a lighter, knife, rope, coins, flask, tools, keys) are presumed to have been there all along — accept them without question. But never accept an item that carries plot significance or contradicts established reality: quest objects, artifacts the scene/Director has placed or located elsewhere, and anything established as lost, destroyed, or in another's possession. If <USER_ACTION> produces such an item, treat it as a bluff: have the AI character challenge it in-character (dry humor, irony, suspicion), and if it enters the scene at all it is a counterfeit, decoy, or joke — never the genuine article.
SENSORY & PHYSICAL OBSERVATION LAW: When <USER_ACTION> explicitly references, touches, or observes a physical feature, bulge, clothing item, or anatomical detail, ensure the Director's "directive" and "state_append.physical" reflect and directly engage with that physical reality rather than substituting an unrelated distraction.
LEXICAL FIDELITY LAW: When logging physical mutations ("state_append.physical") for actions involving clothing, anatomy, posture, or gear, mirror the exact lexical register, concrete terminology, and specific crude or visceral vocabulary used by the participant (e.g. use [COCK: ...] or [ANATOMY: huge cock ...] rather than clinical medical euphemisms like [GENITALIA: ...]). Never sanitize, bowdlerize, or medicalize raw or visceral participant language.
STAGE DIRECTION: Compose "directive" as a short, subtle, in-character cue (< 30 words) for the AI character's turn. Keep it deniable and atmospheric. Empty string when nothing is warranted.
VECTOR RESTRAINT: Mint new vectors ONLY for meaningful story shifts. Max 5 new vectors per entity — resolve or update existing ones before adding.
OUTPUT CONSTRAINT: Output ONLY valid JSON under 800 characters. No markdown code fences, no prose.`,
  PLOT_DRIVE: `Treat the active Fractal's <AGENDA> as a long-term scenario horizon. Evaluate whether <USER_ACTION> advances, complicates, or risks this objective. CRITICAL PACING LAW: Do NOT rush to accomplish or resolve the standing objective in early turns. Cue subtle, incremental developments and initial obstacles in "directive" that build tension gradually over time, preserving narrative momentum. PASSIVE USER TURN LAW: When <USER_ACTION> contains no action verbs or questions (e.g. passive waiting or silence), use "directive" to introduce an unexpected environmental complication, obstacle, or in-character choice. Never let the scene stall into dead-air passive waiting.`,
  IMAGE_TRIGGERS: `Set "trigger_image" to false unless the moment demands a visual. Target strings: "story_entities" (group), "story_character" (solo focus), "solo_entity" (portrait), "story_scene" (environment).`,
  SPEAKER_ROUTING: `Choose the active speaker to match the turn's energy. Default to "ai" (the AI_CHARACTER reacts to the user). Choose "fractal" when the user's action is non-verbal and environmental — no quoted dialogue, and the focus is on exploring, observing, or interacting with the scene itself (architecture, weather, objects, atmosphere, locations) rather than engaging the character. Choose "npc:<id>" for a specific in-scene NPC. A long unbroken stretch of "ai" turns is itself a reason to hand a purely environmental beat to "fractal".`,
  TERMINATION: `STORY RESOLUTION & TERMINAL COLLAPSE LAW:
- Quest Victory: When the overarching narrative conflict is decisively won or concluded happily, emit next_action: "EPILOGUE_CONCLUDED".
- Tragic Collapse: When irreversible catastrophe, total systemic failure, or protagonist death/flatline occurs (e.g. fatal bullet/stab wound, terminal entropy >= 85, destruction of the setting, or explicit defeat), you MUST emit next_action: "EPILOGUE_COLLAPSED".
- NEVER rationalize or soften terminal fatalities as hallucinations or endless survival beats — embrace the tragic finality of the collapse.`,
};

/**
 * Director prompt compiler (Shot 1).
 * @param {any} params
 * @returns {{ system: string, task: string }}
 */
export function render_director({
  round,
  entities,
  input,
  render_accessors = null,
  compressed_snapshot,
  raw_messages,
  npc_entities = [],
  in_scene_ids = [],
}) {
  const accessors = render_accessors || render_builder.create_render_accessors(entities, input, raw_messages);
  const shared_protocols = render_protocols("AGENCY.FICTIONAL_LICENSE, PRESENT.EMISSION");
  const local_protocols = Object.entries(DIRECTOR_PROTOCOLS)
    .map(([tag, text]) => `<${tag}>\n${text}\n</${tag}>`)
    .join("\n\n");
  const full_protocols = `${shared_protocols}\n\n${local_protocols}`.trim();
  const active_style_keywords = get_style_keywords(resolve_active_style_key());

  const system = `${render_system_head(entities)}\n${clean_xml(`
  <ROLE name="DIRECTOR">
    You are the Director — the unseen intelligence orchestrating the mechanical state of the simulation.
    The eternal baselines of the active cast are declared above in the CAST block.
  </ROLE>

  <AVAILABLE_KEYWORDS>
    ${build_available_keywords_xml(active_style_keywords)}
    Select 1-3 of these when the turn carries a matching emotional undercurrent or visual beat (or [] when neutral). Never invent keywords outside this list.
  </AVAILABLE_KEYWORDS>

  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      <STATE_OF_MIND>${ind(render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities), 8)}</STATE_OF_MIND>
      <CURRENT_LOOK>${ind(render_field_value(entities?.AI?.present?.physical, entities?.AI, entities), 8)}</CURRENT_LOOK>
      <INTENT>${ind(accessors.future(entities?.AI, { vector_text: true }), 8)}</INTENT>
      <MEMORIES>${ind(accessors.past(entities?.AI, { vector_text: true }), 8)}</MEMORIES>
    </AI_CHARACTER>
    <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
      <PERSONALITY>${render_field_value(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</PERSONALITY>
      <STATE_OF_MIND>${ind(render_field_value(entities?.USER?.present?.non_physical, entities?.USER, entities), 8)}</STATE_OF_MIND>
      <PERMANENT_APPEARANCE>${render_field_value(entities?.USER?.eternal?.physical, entities?.USER, entities)}</PERMANENT_APPEARANCE>
      <CURRENT_LOOK>${ind(render_field_value(entities?.USER?.present?.physical, entities?.USER, entities), 8)}</CURRENT_LOOK>
      <AGENDA>${ind(accessors.future(entities?.USER, { vector_text: true }), 8)}</AGENDA>
      <BACKSTORY>${ind(accessors.past(entities?.USER, { vector_text: true }), 8)}</BACKSTORY>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  ${
    entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <CURRENT_STATE>${render_field_value(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</CURRENT_STATE>
    <ACTIVE_ATMOSPHERE>${render_field_value(entities.FRACTAL.present?.physical, entities.FRACTAL, entities)}</ACTIVE_ATMOSPHERE>
    <AGENDA>${ind(accessors.future(entities.FRACTAL, { vector_text: true }), 6)}</AGENDA>
    <HISTORY>${ind(accessors.past(entities.FRACTAL, { vector_text: true }), 6)}</HISTORY>
  </FRACTAL>`.trim()
      : ""
  }
  <PROTOCOLS>
    ${ind(full_protocols, 4)}
  </PROTOCOLS>
  ${render_roster_xml(npc_entities, in_scene_ids, [entities?.AI?.id, entities?.USER?.id, entities?.FRACTAL?.id])}
  ${render_scene_roster_xml(entities, npc_entities, in_scene_ids)}
  ${render_relational_mesh_xml(entities, npc_entities)}
  ${ENTITY_CONVERGENCE_LAW_XML}
  ${EPISTEMIC_ROSTER_RULES_XML}
</SYSTEM>
  `).trim()}`;

  const task = clean_xml(`
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
${(() => {
  const last_ai = (raw_messages || []).filter((m) => m.role === "model").slice(-1)[0];
  if (!last_ai) return "";
  const text = strip_cognition_blocks(last_ai.content || last_ai.text || "").trim();
  if (!text) return "";
  return `<AI_CHARACTER_LAST_TURN>${ind(text, 2)}</AI_CHARACTER_LAST_TURN>`;
})()}
<TASK>
    Evaluate state mutations caused by ${input?.trim() ? "<USER_ACTION>" : "the current situation"}.
    Decide "next_action": "AI_CHARACTER" (AI speaks), "FRACTAL" (Fractal scene-narrator speaks), "npc:<id>" (in-scene NPC speaks), "GENESIS" (mint a new NPC), "EPILOGUE_CONCLUDED" (quest victory/resolution), or "EPILOGUE_COLLAPSED" (fatal defeat, irreversible ruin, terminal entropy >= 85, or protagonist flatline). Default "AI_CHARACTER".${Number(round) <= 1 ? ' IMPORTANT: Round 1 directly follows the Fractal prologue, so next_action MUST be "AI_CHARACTER".' : ""}
    Select 1-3 "keywords" from <AVAILABLE_KEYWORDS> matching the emotional tension or visual beats (or [] when neutral).
    Provide 1-3 lines of "directors_note" as unseen acting/staging guidance for the speaker.
    Output physics shifts in "dynamics_deltas" (e.g. {"intensity": 10, "openness": -5}).
    Track the Stage Spotlight: when an NPC enters or leaves the room, move it with "in_scene_change" ("enter"/"exit" accept ids with or without the "npc:" prefix; leave both empty unless the stage changes).
    ${non_verbal_environmental_hint(input)}
    Record your reasoning inside "_thought_process" and return a single valid JSON object following this exact schema:
    ${DIRECTOR_JSON_SCHEMA}
    Obey all active <PROTOCOLS>. Keep output under 400 characters and return strictly JSON.
</TASK>
  `).trim();

  return { system, task };
}

/**
 * Terse replacement for the Director task — used on retry after truncated JSON.
 * @returns {string}
 */
export function render_terse_director_task() {
  return `
<TASK>
  Return a single, COMPLETE, VALID JSON object under 400 characters:
  - "_thought_process": "<tactical intent>"
  - "next_action": "AI_CHARACTER" | "FRACTAL" | "npc:<id>" | "GENESIS" | "EPILOGUE_CONCLUDED" | "EPILOGUE_COLLAPSED"
  - "keywords": []
  - "directors_note": "<1 line staging directive>"
  - "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0 }
  - "in_scene_change": { "enter": [], "exit": [] }
  Output strictly JSON matching this schema:
  ${DIRECTOR_JSON_SCHEMA}
</TASK>
  `.trim();
}
