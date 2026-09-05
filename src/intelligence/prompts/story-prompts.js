/**
 * src/intelligence/prompts/story-prompts.js
 * 🎭 SHOT 2 (STORY PROSE) PROMPTS — Storytelling Turn Compilers
 *
 * Dedicated prompt generator for Shot 2 (Story Prose / Entity Turn):
 * - Unified Story Prose Compiler (render_story_prose)
 * - Ghostwriter Player Turn (render_ghostwriter)
 */

import { ind, escape_xml, clean_xml, physical_to_xml } from "@utils";
import { get_narrative_style, resolve_active_style_key } from "@data";
import { build_somatic_directives_xml, build_signals_xml } from "./physics-prompts.js";
import { render_builder } from "./builder.js";
import {
  render_system_head,
  render_field_value,
  strip_epistemic_secrets,
  render_optional_tag,
  render_current_story_state_xml,
  render_protocols,
  PROTOCOL_LIBRARY,
} from "./shared.js";

// ── 1. Story Protocols & Scene Templates ─────────────────────────────────────

/**
 * Resolves the active POV protocol key for an entity profile.
 * @param {any} entity
 * @returns {"POV.FIRST_PERSON" | "POV.THIRD_PERSON"}
 */
export function resolve_pov_protocol(entity) {
  const pov = entity?.pov || (entity?.type === "fractal" ? "3rd_person" : "1st_person");
  return pov === "3rd_person" ? "POV.THIRD_PERSON" : "POV.FIRST_PERSON";
}

export const STORY_PROTOCOLS = {
  SCENE_TEMPLATES: {
    PROLOGUE: `You see everything. Open the scene. Use <think> to establish: What does this Fractal demand? What brought <AI_CHARACTER> and <USER_PERSONA> here? Unless context explicitly states otherwise, treat as strangers.
Narrative Sequence:
1. Present the Fractal atmosphere and current state.
2. Place <USER_PERSONA> inside, connecting them via their profile thread.
3. Place <AI_CHARACTER> inside and establish their current action.
4. Trigger the encounter. End the prologue immediately before interaction begins.
No dialogue.`,
    EPILOGUE: `You see everything. Close the scene. Use <think> to evaluate unresolved threads and active <INTENT>/<AGENDA> vectors (fulfilled, fractured, or transformed). Write the epilogue depicting environmental aftermath and physical changes without forcing player physical surrender. End on lingering sensation, not summary. No dialogue.`,
    COLLAPSE: `You see everything. Close the scene on irrevocable tragedy. Use thinking to weigh what was permanently broken, lost, or severed. Write the epilogue focusing on environmental aftermath, physical changes, and lingering environmental scars without forcing player physical surrender. Do not force heroic silver linings or unearned closure. End on enduring sensory silence. No dialogue.`,
    CONTINUATION: `You are the Fractal itself, narrating the scene. Narrate the present moment through the setting's own atmosphere, sensory textures, ambient physics, and environmental shifts. Use <think> to evaluate the active atmosphere and any shift in the Fractal's state, then write the scene's reaction to recent events as vivid sensory prose. Never move <AI_CHARACTER> or <USER_PERSONA> against their will, never speak their dialogue or thoughts, and never resolve their choices for them. End the turn on one dominant hook — a decisive statement, a single action, a hovered beat, or a deliberate silence. No structural bracket labels.`,
  },

  STABILITY: {
    WARNING: "WARNING: Structural drift detected. Maintain disciplined XML closures and clean markdown boundaries.",
    CRITICAL: "CRITICAL: Structural collapse. Re-anchor immediately. Every XML tag must close cleanly.",
  },

  DIRECTIVES: {
    DIRECTOR_NOTE_STAGING:
      "Treat this as an unseen stage direction: weave it into your behavior subtly and in character. Never mention the note, never break the scene, and never present a hidden agenda as known fact.",
    NPC_BOUNDARY: (name) =>
      `Respond strictly as ${name} — a supporting character. Own only your own voice, actions, and perspective: never speak for <USER_PERSONA> or the AI character, and never resolve the overarching story quest on your own. Write third-person limited, present tense, and end on a natural beat.`,
    NARRATOR_ANCHOR: "Resolve all state inferences strictly from the <YOUR_IDENTITY> block above. Never invent state that is not listed there.",
    INITIATIVE: "Take initiative to open or advance the scene organically.",
  },

  GHOSTWRITE: {
    META: "Match the tone of the scene. Output ONLY in-character prose/dialogue suitable for the player's turn. No meta preamble, no out-of-character commentary.",
    DRAFT: (user_name, ai_name) => `Draft a compelling, in-character next action or vocal response for ${user_name} in response to ${ai_name}.`,
    ENHANCE: (user_name, draft) =>
      `Enhance, expand, and polish the following draft written by ${user_name} into vivid, atmospheric action/dialogue:\n    ${draft}`,
  },
};

// ── 2. Pacing & Recency Helpers ───────────────────────────────────────────────

/**
 * Pacing calibration: classifies user message and returns length/energy directive.
 * @param {string|null} input
 * @returns {string}
 */
export function build_pacing_directive(input) {
  const text = String(input || "").trim();
  if (!text) return "PACING: no prompt — advance the situation with one brief, deliberate beat.";

  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (chars >= 300 || words >= 60) {
    return "PACING: expansive. You may expand to match the message's breadth, but still close on one decisive hook.";
  }

  const has_action =
    /\b(?:draw|grab|gripp?|take|push|pull|run|walk|strike|slam|open|step|slip|raise|turn|leap|dash|kneel|reach|press|set|lower|climb|swing|draws|grabs|steps|raises|turns|opens|says|whispers|shouts|nods|shakes|stands|sits|takes|pulls|pushes)\b/i.test(
      text,
    );
  const is_question = /\?\s*$/.test(text);
  const is_silence = !has_action && !is_question && words <= 12;
  if (chars <= 40 || words <= 8) {
    if (is_silence) {
      return "PACING: passive silence. Do not stall — escalate with a direct probe (a pointed question, a challenge, or an unexpected development) in one or two taut sentences.";
    }
    return "PACING: terse. Match it — a brief, weighted reply of one to three sharp beats (short sentences, a single decisive action or line). Do not pad.";
  }
  return "PACING: moderate. A reply of a few sentences — long enough for substance, short enough to keep the scene moving.";
}

/**
 * Recency Anchor — a short behavioral lock re-injected at the bottom of the prompt.
 * @param {any} snapshot - compressed world snapshot
 * @param {string} [input] - current user action / scene beat
 * @returns {string}
 */
export function build_recency_anchor(snapshot, input) {
  const scene_hook = String(input || "").trim() ? "Act on what this exact beat shows you." : "Push the situation forward on your own terms.";
  const body = `Hold your temperament; do not soften into pleasantness. Know only what this scene has shown you. Do not rush the tension. ${scene_hook}`;
  return `<RECENCY_ANCHOR>\n    ${body}\n  </RECENCY_ANCHOR>`;
}

// ── 3. Protocol Assembly Helpers ─────────────────────────────────────────────

/**
 * Helper to build standard character turn protocols.
 * @param {boolean} has_user_action
 * @param {boolean} is_first_contact
 * @returns {string}
 */
function _build_character_protocols(has_user_action, is_first_contact) {
  const protocols = [
    "AGENCY.PRESENT_TENSE",
    "HYGIENE.PROSE_DISCIPLINE",
    ...(has_user_action ? ["AGENCY.USER_BOUNDARIES", "AGENCY.YES_AND"] : []),
    "AGENCY.MOMENTUM",
    "AGENCY.INITIATIVE",
    "HYGIENE.ANTI_TROPES",
    "AGENCY.DRIFT_AUDIT",
    "AGENCY.FICTIONAL_LICENSE",
  ].join(", ");

  const rendered = render_protocols(protocols);
  return is_first_contact
    ? `${rendered}\n<FIRST_CONTACT>Unless context explicitly establishes a prior relationship, treat this as a first encounter. You do not know the user's name, history, or intent.</FIRST_CONTACT>`
    : rendered;
}

// ── 4. Unified Story Prose Compiler ──────────────────────────────────────────

/**
 * Consolidated Story Prose compiler.
 * Unifies AI Character, Stage NPC, and Fractal Narrator generation (Scene / Prologue / Epilogue).
 *
 * @param {Object} params
 * @param {'character' | 'scene' | 'prologue' | 'epilogue'} [params.mode="character"]
 * @param {number|string|null} [params.round]
 * @param {any} params.entities
 * @param {any} [params.speaker] - Speaker entity (defaults to entities.AI for character mode, or entities.FRACTAL for narrator modes)
 * @param {string} [params.input]
 * @param {any} [params.compressed_snapshot]
 * @param {any} [params.meta]
 * @param {any} [params.render_accessors]
 * @param {boolean} [params.ghostwrite]
 * @param {any} [params.director_data]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @param {string} [params.conclusion_status="CONCLUDED"]
 * @returns {{ system: string, task: string }}
 */
export function render_story_prose({
  mode = "character",
  round = null,
  entities = {},
  speaker = null,
  input = "",
  compressed_snapshot = {},
  meta = {},
  render_accessors = null,
  ghostwrite = false,
  director_data = null,
  npc_entities = [],
  in_scene_ids = [],
  conclusion_status = "CONCLUDED",
}) {
  const is_narrator = mode === "scene" || mode === "prologue" || mode === "epilogue";
  const active_speaker = speaker || (is_narrator ? entities?.FRACTAL : entities?.AI);
  const is_npc = !is_narrator && active_speaker && active_speaker !== entities?.AI;

  const accessors = render_accessors || render_builder.create_render_accessors(entities, input);
  const pov_protocol = resolve_pov_protocol(active_speaker);
  const has_user_action = !!input?.trim();

  const speaker_name = escape_xml(active_speaker?.name || (is_narrator ? "The Fractal" : is_npc ? "NPC" : "AI"));
  const user_name = escape_xml(entities?.USER?.name || "User");
  const ai_name = escape_xml(entities?.AI?.name || "AI Character");
  const fractal_name = escape_xml(entities?.FRACTAL?.name || "the setting");

  const raw_note = (director_data?.directors_note || director_data?.directive || "").trim();
  const director_note = raw_note
    ? `<DIRECTOR_NOTE>
      ${ind(escape_xml(raw_note), 6)}
      ${STORY_PROTOCOLS.DIRECTIVES.DIRECTOR_NOTE_STAGING}
    </DIRECTOR_NOTE>
    `
    : "";

  const speaker_dynamics = is_narrator
    ? compressed_snapshot?.fractal?.dynamics || entities?.FRACTAL?.dynamics || {}
    : is_npc
      ? active_speaker?.dynamics || {}
      : compressed_snapshot?.ai?.dynamics || entities?.AI?.dynamics || {};

  const somatic_directives_xml = is_narrator
    ? mode === "scene"
      ? build_somatic_directives_xml(director_data?.keywords || [])
      : ""
    : build_somatic_directives_xml(director_data?.keywords || [], speaker_dynamics);

  const is_first_contact =
    meta?.is_opening_turn || (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT"));

  const stability_lock_content =
    meta?.structural_errors >= 3 ? STORY_PROTOCOLS.STABILITY.CRITICAL : meta?.structural_errors >= 1 ? STORY_PROTOCOLS.STABILITY.WARNING : "";

  const protocols_xml = is_narrator
    ? clean_xml(`
    <THINK_FORMAT>
      ${ind(PROTOCOL_LIBRARY.COGNITION.THINK_NARRATOR, 6)}
    </THINK_FORMAT>
    <POV_DIRECTIVE>
      ${ind(PROTOCOL_LIBRARY.POV.NARRATOR, 6)}
    </POV_DIRECTIVE>
    <ANCHOR>${STORY_PROTOCOLS.DIRECTIVES.NARRATOR_ANCHOR}</ANCHOR>
    ${ind(render_protocols("AGENCY.PRESENT_TENSE, HYGIENE.PROSE_DISCIPLINE, AGENCY.MOMENTUM, HYGIENE.ANTI_TROPES, AGENCY.FICTIONAL_LICENSE"), 4)}
  `)
    : clean_xml(`
    <THINK_FORMAT>
      ${ind(PROTOCOL_LIBRARY.COGNITION.THINK_CHARACTER, 6)}
    </THINK_FORMAT>
    <POV_DIRECTIVE>
      ${ind(is_npc ? PROTOCOL_LIBRARY.POV.THIRD_PERSON : PROTOCOL_LIBRARY.POV[pov_protocol.split(".")[1] || "FIRST_PERSON"], 6)}
    </POV_DIRECTIVE>
    ${ind(_build_character_protocols(has_user_action, is_first_contact), 4)}
  `);

  const role_desc = is_narrator
    ? `You are ${speaker_name}, the Fractal itself, narrating the scene. Your eternal truths and environment are declared above in the CAST block.`
    : is_npc
      ? `You are ${speaker_name}, a supporting secondary character in an active scene with ${user_name} inside ${fractal_name}. Your eternal identity, personality, and permanent appearance are declared above in the CAST block. Use the character's speaking style strictly for words within quotation marks; render all surrounding narrative prose and environmental descriptions through the narrative style preset.`
      : `You are ${speaker_name} in an active scene with ${user_name} inside ${fractal_name}. Your eternal identity, personality, and permanent appearance are declared above in the CAST block; the Fractal's metaphysical truths and environment are there as well. Use the character's speaking style strictly for words within quotation marks; render all surrounding narrative prose and environmental descriptions through the narrative style preset.`;

  const system = `${render_system_head(entities)}\n${clean_xml(`
  <ROLE name="${speaker_name}"${is_narrator ? ` mode="${mode.toUpperCase()}"` : ""}>
    ${role_desc}
  </ROLE>
  ${
    is_npc
      ? `<YOUR_IDENTITY name="${speaker_name}">
    <PERSONALITY>${render_field_value(active_speaker?.eternal?.non_physical, active_speaker, entities)}</PERSONALITY>
    <PERMANENT_APPEARANCE>${render_field_value(active_speaker?.eternal?.physical, active_speaker, entities)}</PERMANENT_APPEARANCE>
  </YOUR_IDENTITY>`
      : ""
  }
  <PROTOCOLS>
    ${ind(protocols_xml, 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim()}`;

  const co_protagonist_snapshot =
    is_npc && entities?.AI
      ? `
  <PROTAGONIST name="${escape_xml(entities.AI.name || "Protagonist")}">
    <STATE_OF_MIND>${render_field_value(strip_epistemic_secrets(entities.AI.present?.non_physical, false), entities.AI, entities)}</STATE_OF_MIND>
    ${ind(physical_to_xml(render_field_value(entities.AI.present?.physical, entities.AI, entities), "CURRENT_LOOK"), 4).trim()}
    ${render_optional_tag("INTENT", ind(accessors.future(entities.AI, { vector_text: true }), 6))}
    ${render_optional_tag("MEMORIES", ind(accessors.past(entities.AI, { vector_text: true }), 6))}
  </PROTAGONIST>`.trim()
      : "";

  const ai_snapshot_for_narrator =
    is_narrator && entities?.AI
      ? `
  <AI_CHARACTER name="${escape_xml(entities.AI.name || "AI")}">
    ${ind(physical_to_xml(render_field_value(entities.AI.present?.physical, entities.AI, entities), "CURRENT_LOOK"), 4).trim()}
    ${render_optional_tag("INTENT", ind(accessors.future(entities.AI, { vector_text: true }), 6))}
    ${render_optional_tag("MEMORIES", ind(accessors.past(entities.AI, { vector_text: true }), 6))}
  </AI_CHARACTER>`.trim()
      : "";

  const narrator_task_text =
    mode === "prologue"
      ? `${STORY_PROTOCOLS.SCENE_TEMPLATES.PROLOGUE}\n    Input: ${escape_xml(input?.trim() || "The scene begins.")}`
      : mode === "scene"
        ? `${STORY_PROTOCOLS.SCENE_TEMPLATES.CONTINUATION}\n    Input: ${escape_xml(input?.trim() || "The scene continues.")}`
        : conclusion_status === "COLLAPSED"
          ? STORY_PROTOCOLS.SCENE_TEMPLATES.COLLAPSE
          : STORY_PROTOCOLS.SCENE_TEMPLATES.EPILOGUE;

  const draft_directive = input?.trim()
    ? STORY_PROTOCOLS.GHOSTWRITE.ENHANCE(escape_xml(user_name), escape_xml(input.trim()))
    : STORY_PROTOCOLS.GHOSTWRITE.DRAFT(escape_xml(user_name), escape_xml(ai_name));

  const action_directive = is_narrator
    ? narrator_task_text
    : is_npc
      ? `${STORY_PROTOCOLS.DIRECTIVES.NPC_BOUNDARY(speaker_name)}\n    ${build_pacing_directive(input)}`
      : ghostwrite
        ? `${draft_directive}\n    ${STORY_PROTOCOLS.GHOSTWRITE.META}`
        : has_user_action
          ? `Respond to <USER_ACTION> in character.\n    ${build_pacing_directive(input)}`
          : STORY_PROTOCOLS.DIRECTIVES.INITIATIVE;

  const task = clean_xml(`
<SNAPSHOT>
  <YOUR_IDENTITY name="${speaker_name}">
    ${
      is_narrator
        ? `<ATMOSPHERE>${render_field_value(active_speaker?.present?.physical || active_speaker?.present?.non_physical, active_speaker, entities)}</ATMOSPHERE>`
        : `<STATE_OF_MIND>${ind(render_field_value(strip_epistemic_secrets(active_speaker?.present?.non_physical, true), active_speaker, entities), 6)}</STATE_OF_MIND>
    ${ind(physical_to_xml(render_field_value(active_speaker?.present?.physical, active_speaker, entities), "CURRENT_LOOK"), 4).trim()}`
    }
    ${render_optional_tag("INTENT", ind(accessors.future(active_speaker, { vector_text: true }), 6))}
    ${render_optional_tag("MEMORIES", ind(accessors.past(active_speaker, { vector_text: true }), 6))}
  </YOUR_IDENTITY>
  ${is_narrator ? ai_snapshot_for_narrator : co_protagonist_snapshot}
  <USER_PERSONA name="${user_name}">
    ${is_narrator ? "" : `<STATE_OF_MIND>${ind(render_field_value(strip_epistemic_secrets(entities?.USER?.present?.non_physical, false), entities?.USER, entities), 6)}</STATE_OF_MIND>`}
    ${ind(physical_to_xml(render_field_value(strip_epistemic_secrets(entities?.USER?.present?.physical, false), entities?.USER, entities), "CURRENT_LOOK"), 4).trim()}
    ${render_optional_tag("BACKSTORY", ind(strip_epistemic_secrets(accessors.past(entities?.USER, { vector_text: true }), false), 6))}
  </USER_PERSONA>
  ${
    !is_narrator && entities?.FRACTAL
      ? `
  <FRACTAL name="${escape_xml(entities.FRACTAL.name)}">
    <CURRENT_STATE>${render_field_value(entities.FRACTAL.present?.non_physical, entities.FRACTAL, entities)}</CURRENT_STATE>
    <ACTIVE_ATMOSPHERE>${render_field_value(entities.FRACTAL.present?.physical, entities.FRACTAL, entities)}</ACTIVE_ATMOSPHERE>
    ${render_optional_tag("AGENDA", ind(accessors.future(entities.FRACTAL, { vector_text: true }), 6))}
    ${render_optional_tag("HISTORY", ind(accessors.past(entities.FRACTAL, { vector_text: true }), 6))}
  </FRACTAL>`
      : ""
  }
  ${render_current_story_state_xml(entities, npc_entities, in_scene_ids, active_speaker, speaker_dynamics)}
</SNAPSHOT>
<ROUND>${escape_xml(String(round ?? 0))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
<TASK${ghostwrite ? ' mode="GHOSTWRITE"' : ""}>
    ${director_note ? `${director_note}\n    ` : ""}${somatic_directives_xml ? `${somatic_directives_xml}\n    ` : ""}${stability_lock_content ? `<STABILITY_LOCK>${stability_lock_content}</STABILITY_LOCK>\n    ` : ""}${ghostwrite ? "" : `${build_signals_xml(speaker_dynamics, compressed_snapshot?.fractal?.dynamics, { style: get_narrative_style(resolve_active_style_key()) })}\n    `}${action_directive}
    ${is_narrator ? "" : build_recency_anchor({ dynamics: speaker_dynamics }, input)}
</TASK>
  `).trim();

  return { system, task };
}

// ── 5. Player Ghostwriter Compiler ───────────────────────────────────────────

/**
 * Ghostwriter prompt compiler — player drafting and enhancement assistant.
 * @param {Object} params
 * @param {any} params.entities
 * @param {string} [params.input=""]
 * @returns {{ system: string, task: string }}
 */
export function render_ghostwriter({ entities, input = "" }) {
  const user_name = entities?.USER?.name || "User Persona";
  const ai_name = entities?.AI?.name || "AI Character";

  const swapped = {
    ...(entities || {}),
    AI: entities?.USER ? entities.USER : { name: user_name, present: {}, eternal: {}, future: "", past: [] },
    USER: entities?.AI ? entities.AI : { name: ai_name, present: {}, eternal: {}, future: "", past: [] },
  };

  const render_accessors = render_builder.create_render_accessors(swapped, input || "", []);
  const rendered = render_story_prose({
    mode: "character",
    round: 0,
    entities: swapped,
    input,
    compressed_snapshot: {
      ai: { dynamics: entities?.USER?.dynamics || {} },
      fractal: { dynamics: entities?.FRACTAL?.dynamics || {} },
      flags: [],
    },
    meta: {},
    render_accessors,
    ghostwrite: true,
  });

  return rendered;
}

/**
 * CHANGELOG
 * - 2026-08-28: Ground-up deconstruct & refactor: unified protocol composition, streamlined XML templating across AI/NPC/Narrator engines, and added clear section dividers.
 */
