/**
 * src/intelligence/prompts/story-prompts.js
 * 🎭 STORYTELLING TURN PROMPTS
 *
 * Prompts for the core simulation turn loop:
 * - Director Quick Shot (render_director)
 * - AI Character Turn (render_character)
 * - Stage NPC Speaker Turn (render_npc_character)
 * - Ghostwriter Player Turn (render_ghostwriter)
 * - Fractal / Scene Narrator (build_narrator, prologue, epilogue)
 */

import { ind, escape_xml } from "@utils";
import { NARRATIVE_STYLES, PROTOCOL_LIBRARY, build_somatic_directives_block } from "@data";
import { clean_xml } from "../parser.js";
import { build_signals_xml } from "../dynamics.js";
import {
  render_system_head,
  render_field_value,
  format_dynamics_attrs,
  resolve_active_style_key,
  resolve_pov_protocol,
  strip_epistemic_tags,
  render_current_story_state_xml,
  build_pacing_directive,
  build_recency_anchor,
  render_protocols,
  render_builder,
} from "./shared.js";

/**
 * Character prompt compiler (Shot 2).
 * @param {any} params
 * @returns {{ system: string, task: string }}
 */
export function render_character({
  round,
  entities,
  input,
  compressed_snapshot,
  meta,
  render_accessors = null,
  ghostwrite = false,
  director_data,
  npc_entities = [],
  in_scene_ids = [],
}) {
  const accessors = render_accessors || render_builder.create_render_accessors(entities, input);
  const pov_protocol = resolve_pov_protocol(entities?.AI);
  const has_user_action = !!input?.trim();

  const raw_note = (director_data?.directors_note || director_data?.directive || "").trim();
  const director_note = raw_note
    ? `<DIRECTOR_NOTE>
      ${ind(escape_xml(raw_note), 6)}
      Treat this as an unseen stage direction: weave it into your behavior subtly and in character. Never mention the note, never break the scene, and never present an hidden agenda as known fact.
    </DIRECTOR_NOTE>
    `
    : "";

  const somatic_directives_xml = build_somatic_directives_block(
    director_data?.keywords || [],
    compressed_snapshot?.ai?.dynamics || entities?.AI?.dynamics || {},
  );

  const protocols = [
    "COGNITION.PHASES",
    "AGENCY.PRESENT_TENSE",
    "HYGIENE.PROSE",
    ...(has_user_action ? ["AGENCY.USER_BOUNDARIES", "AGENCY.YES_AND"] : []),
    "AGENCY.MOMENTUM",
    "HYGIENE.MARKDOWN",
    "AGENCY.INITIATIVE",
    "HYGIENE.CONCISENESS",
    "HYGIENE.BANNED_TROPES",
    "HYGIENE.PROSE_STRUCTURE",
    "ANTIGRAVITY.AUDIT",
    "AGENCY.FICTIONAL_LICENSE",
    meta?.is_opening_turn || (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT"))
      ? "AGENCY.FIRST_CONTACT"
      : "",
  ]
    .filter(Boolean)
    .join(", ");
  const stability_lock_content =
    meta?.structural_errors >= 3 ? PROTOCOL_LIBRARY.STABILITY.CRITICAL : meta?.structural_errors >= 1 ? PROTOCOL_LIBRARY.STABILITY.WARNING : "";

  const user_field = (text) => render_field_value(strip_epistemic_tags(text), entities?.USER, entities);

  const system = `${render_system_head(entities)}\n${clean_xml(`
  <ROLE name="${escape_xml(entities?.AI?.name || "AI")}">
    You are ${escape_xml(entities?.AI?.name || "AI")} in an active scene with ${escape_xml(entities?.USER?.name || "User")} inside ${escape_xml(entities?.FRACTAL?.name || "the setting")}.
    Your eternal identity, personality, and permanent appearance are declared above in the CAST block; the Fractal's metaphysical truths and environment are there as well.
  </ROLE>
  <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
    <PERSONALITY>${user_field(entities?.USER?.eternal?.non_physical)}</PERSONALITY>
    <PERMANENT_APPEARANCE>${user_field(entities?.USER?.eternal?.physical)}</PERMANENT_APPEARANCE>
  </USER_PERSONA>
  <PROTOCOLS>
    ${ind(render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim()}`;

  const task = clean_xml(`
<SNAPSHOT>
  <YOUR_IDENTITY name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
    <STATE_OF_MIND>${ind(render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities), 6)}</STATE_OF_MIND>
    <CURRENT_LOOK>${ind(render_field_value(entities?.AI?.present?.physical, entities?.AI, entities), 6)}</CURRENT_LOOK>
    <INTENT>${ind(accessors.future(entities?.AI, { vector_text: true }), 6)}</INTENT>
    <MEMORIES>${ind(accessors.past(entities?.AI, { vector_text: true }), 6)}</MEMORIES>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
    <STATE_OF_MIND>${ind(user_field(entities?.USER?.present?.non_physical), 6)}</STATE_OF_MIND>
    <CURRENT_LOOK>${ind(user_field(entities?.USER?.present?.physical), 6)}</CURRENT_LOOK>
    <BACKSTORY>${ind(strip_epistemic_tags(accessors.past(entities?.USER, { vector_text: true })), 6)}</BACKSTORY>
  </USER_PERSONA>
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
  ${render_current_story_state_xml(entities, npc_entities, in_scene_ids, entities?.AI)}
</SNAPSHOT>
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
<TASK>
    ${director_note}
    ${somatic_directives_xml ? `${somatic_directives_xml}\n    ` : ""}
    <THINK_FORMAT>
    ${PROTOCOL_LIBRARY.COGNITION.THINK_CHARACTER}
    </THINK_FORMAT>
    ${stability_lock_content ? `<STABILITY_LOCK>${stability_lock_content}</STABILITY_LOCK>\n    ` : ""}
    <EPISTEMIC_PHYSICS>
      ${ind(PROTOCOL_LIBRARY.EPISTEMIC_PHYSICS.RULES, 6)}
    </EPISTEMIC_PHYSICS>
    ${build_signals_xml(compressed_snapshot?.ai?.dynamics, compressed_snapshot?.fractal?.dynamics, { style: NARRATIVE_STYLES[resolve_active_style_key()] })}
    <POV_DIRECTIVE>
      ${PROTOCOL_LIBRARY.POV[pov_protocol.split(".")[1] || "FIRST_PERSON"]}
    </POV_DIRECTIVE>
    ${
      ghostwrite
        ? "Follow the <GHOSTWRITE> directive below to complete your turn."
        : has_user_action
          ? "Execute your reaction against <USER_ACTION>."
          : "Continue the scene, reacting to the current situation."
    } Stay fully in character. Honor all active <PROTOCOLS>.
    ${build_pacing_directive(input)}
    ${build_recency_anchor(compressed_snapshot, input)}
  </TASK>
  `).trim();

  return { system, task };
}

/**
 * NPC persona prompt — dedicated speaker engine for `speaker: "npc:<id>"` turns.
 */
export function render_npc_character({
  round,
  entities = {},
  npc,
  input,
  compressed_snapshot,
  render_accessors = null,
  director_data,
  npc_entities = [],
  in_scene_ids = [],
}) {
  const accessors = render_accessors || render_builder.create_render_accessors({ ...entities, [npc?.id]: npc }, input);
  const npc_name = escape_xml(npc?.name || "NPC");
  const user_name = escape_xml(entities?.USER?.name || "User");
  const ai_name = escape_xml(entities?.AI?.name || "the protagonist");
  const fractal_name = escape_xml(entities?.FRACTAL?.name || "the environment");
  const has_user_action = !!input?.trim();

  const director_note = director_data?.directive?.trim()
    ? `<DIRECTOR_NOTE>
      ${ind(escape_xml(director_data.directive.trim()), 6)}
      Treat this as an unseen stage direction: weave it into your behavior subtly and in character. Never mention the note, never break the scene.
    </DIRECTOR_NOTE>
    `
    : "";
  const somatic_directives_xml = build_somatic_directives_block(director_data?.keywords || [], npc?.dynamics || {});

  const protocols = [
    "COGNITION.PHASES",
    "AGENCY.PRESENT_TENSE",
    "HYGIENE.PROSE",
    ...(has_user_action ? ["AGENCY.USER_BOUNDARIES", "AGENCY.YES_AND"] : []),
    "AGENCY.MOMENTUM",
    "HYGIENE.MARKDOWN",
    "AGENCY.INITIATIVE",
    "HYGIENE.CONCISENESS",
    "HYGIENE.BANNED_TROPES",
    "HYGIENE.PROSE_STRUCTURE",
    "ANTIGRAVITY.AUDIT",
    "AGENCY.FICTIONAL_LICENSE",
  ]
    .filter(Boolean)
    .join(", ");

  const system = `${render_system_head(entities)}\n${clean_xml(`
  <ROLE name="${npc_name}">
    You are ${npc_name}, a supporting character in an active scene with ${user_name} and ${ai_name} inside ${fractal_name}.
    Your own identity is declared below; the protagonist, user, and fractal baselines are declared above in the CAST block.
  </ROLE>
  <YOUR_IDENTITY name="${npc_name}">
    <PERSONALITY>${render_field_value(npc?.eternal?.non_physical, npc, entities)}</PERSONALITY>
    <PERMANENT_APPEARANCE>${render_field_value(npc?.eternal?.physical, npc, entities)}</PERMANENT_APPEARANCE>
  </YOUR_IDENTITY>
  <USER_PERSONA name="${user_name}">
    <PERSONALITY>${render_field_value(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</PERSONALITY>
    <PERMANENT_APPEARANCE>${render_field_value(entities?.USER?.eternal?.physical, entities?.USER, entities)}</PERMANENT_APPEARANCE>
  </USER_PERSONA>
  <PROTOCOLS>
    ${ind(render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim()}`;

  const task = clean_xml(`
<SNAPSHOT>
  <YOUR_IDENTITY name="${npc_name}"${format_dynamics_attrs(npc?.dynamics)}>
    <STATE_OF_MIND>${ind(render_field_value(npc?.present?.non_physical, npc, entities), 6)}</STATE_OF_MIND>
    <CURRENT_LOOK>${ind(render_field_value(npc?.present?.physical, npc, entities), 6)}</CURRENT_LOOK>
    <INTENT>${ind(accessors?.future(npc, { vector_text: true }), 6)}</INTENT>
    <MEMORIES>${ind(accessors?.past(npc, { vector_text: true, in_scene: true }), 6)}</MEMORIES>
  </YOUR_IDENTITY>
  <AI_CHARACTER name="${ai_name}">
    <STATE_OF_MIND>${render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities)}</STATE_OF_MIND>
  </AI_CHARACTER>
  <USER_PERSONA name="${user_name}">
    <STATE_OF_MIND>${render_field_value(entities?.USER?.present?.non_physical, entities?.USER, entities)}</STATE_OF_MIND>
    <CURRENT_LOOK>${render_field_value(entities?.USER?.present?.physical, entities?.USER, entities)}</CURRENT_LOOK>
  </USER_PERSONA>
  ${render_current_story_state_xml(entities, npc_entities, in_scene_ids, npc)}
</SNAPSHOT>
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
<TASK>
    ${director_note}
    ${somatic_directives_xml ? `${somatic_directives_xml}\n    ` : ""}
    <THINK_FORMAT>
    ${PROTOCOL_LIBRARY.COGNITION.THINK_CHARACTER}
    </THINK_FORMAT>
    <EPISTEMIC_PHYSICS>
      ${ind(PROTOCOL_LIBRARY.EPISTEMIC_PHYSICS.RULES, 6)}
    </EPISTEMIC_PHYSICS>
    ${build_signals_xml(npc?.dynamics, compressed_snapshot?.fractal?.dynamics, { style: NARRATIVE_STYLES[resolve_active_style_key()] })}
    <POV_DIRECTIVE>
      ${PROTOCOL_LIBRARY.POV.THIRD_PERSON}
    </POV_DIRECTIVE>
    Respond strictly as ${npc_name} — a supporting character. Own only your own voice, actions, and perspective: never speak for <USER_PERSONA> or the AI character, and never resolve the overarching story quest on your own. Write third-person limited, present tense, and end on a natural beat.
    ${build_pacing_directive(input)}
</TASK>
  `).trim();

  return { system, task };
}

/**
 * Ghostwriter prompt compiler — player drafting and enhancement assistant.
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
  const rendered = render_character({
    round: null,
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

  const draft_directive = input?.trim()
    ? `Enhance, expand, and polish the following draft written by ${escape_xml(user_name)} into vivid, atmospheric action/dialogue:\n    ${escape_xml(input.trim())}`
    : `Draft a compelling, in-character next action or vocal response for ${escape_xml(user_name)} in response to ${escape_xml(ai_name)}.`;

  rendered.task += clean_xml(`
<GHOSTWRITE>
    ${draft_directive}
    Write strictly from ${escape_xml(user_name)}'s perspective and voice: only their physical actions, dialogue, sensations, and internal states.
    Do not write dialogue, actions, or thoughts for ${escape_xml(ai_name)}. Also do not write their body language, expressions, or reactions — never narrate how the other character looks or feels in response to you.
    Output only the raw text — no preamble, no meta-commentary, no XML wrappers.
</GHOSTWRITE>
  `);

  return rendered;
}

/**
 * Fractal / Scene Narrator compiler for scene continuation, prologue, and epilogue.
 */
export function build_narrator(
  mode,
  {
    entities,
    render_accessors,
    compressed_snapshot,
    round = null,
    input = null,
    director_data = null,
    npc_entities = [],
    in_scene_ids = [],
    conclusion_status = "CONCLUDED",
  },
) {
  const task_text =
    mode === "prologue"
      ? `${PROTOCOL_LIBRARY.SCENE.PROLOGUE}\n    Input: ${escape_xml(input?.trim() || "The scene begins.")}`
      : mode === "scene"
        ? `${PROTOCOL_LIBRARY.SCENE.CONTINUATION}\n    Input: ${escape_xml(input?.trim() || "The scene continues.")}`
        : conclusion_status === "COLLAPSED"
          ? PROTOCOL_LIBRARY.SCENE.COLLAPSE
          : PROTOCOL_LIBRARY.SCENE.EPILOGUE;
  const fractal_name = entities?.FRACTAL?.name || "Environment";
  const somatic_directives_xml = mode === "scene" ? build_somatic_directives_block(director_data?.keywords || []) : "";

  const system = `${render_system_head(entities)}\n${clean_xml(`
  <ROLE name="${escape_xml(fractal_name)}" mode="${mode.toUpperCase()}">
    You are ${escape_xml(fractal_name)}, the Fractal itself, narrating the scene. Your eternal truths and environment are declared above in the CAST block.
  </ROLE>
  <YOUR_IDENTITY name="${escape_xml(fractal_name)}"${format_dynamics_attrs(compressed_snapshot?.fractal?.dynamics)}>
    <CURRENT_STATE>${render_field_value(entities?.FRACTAL?.present?.non_physical, entities?.FRACTAL, entities)}</CURRENT_STATE>
    <ACTIVE_ATMOSPHERE>${render_field_value(entities?.FRACTAL?.present?.physical, entities?.FRACTAL, entities)}</ACTIVE_ATMOSPHERE>
    <AGENDA>${ind(render_accessors?.future(entities?.FRACTAL, { vector_text: true }), 6)}</AGENDA>
    <HISTORY>${ind(render_accessors?.past(entities?.FRACTAL, { vector_text: true }), 6)}</HISTORY>
  </YOUR_IDENTITY>
  <ACTIVE_CHARACTERS>
    <AI_CHARACTER name="${escape_xml(entities?.AI?.name || "AI")}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
      <STATE_OF_MIND>${render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities)}</STATE_OF_MIND>
      <CURRENT_LOOK>${render_field_value(entities?.AI?.present?.physical, entities?.AI, entities)}</CURRENT_LOOK>
      <INTENT>${ind(render_accessors?.future(entities?.AI, { vector_text: true }), 8)}</INTENT>
      <MEMORIES>${ind(render_accessors?.past(entities?.AI, { vector_text: true }), 8)}</MEMORIES>
    </AI_CHARACTER>
    <USER_PERSONA name="${escape_xml(entities?.USER?.name || "User")}">
      <PERSONALITY>${render_field_value(entities?.USER?.eternal?.non_physical, entities?.USER, entities)}</PERSONALITY>
      <STATE_OF_MIND>${render_field_value(entities?.USER?.present?.non_physical, entities?.USER, entities)}</STATE_OF_MIND>
      <PERMANENT_APPEARANCE>${render_field_value(entities?.USER?.eternal?.physical, entities?.USER, entities)}</PERMANENT_APPEARANCE>
      <CURRENT_LOOK>${render_field_value(entities?.USER?.present?.physical, entities?.USER, entities)}</CURRENT_LOOK>
      <AGENDA>${ind(render_accessors?.future(entities?.USER, { vector_text: true }), 8)}</AGENDA>
      <BACKSTORY>${ind(render_accessors?.past(entities?.USER, { vector_text: true }), 8)}</BACKSTORY>
    </USER_PERSONA>
  </ACTIVE_CHARACTERS>
  <PROTOCOLS>
    ${ind(render_protocols("COGNITION.ANCHOR, COGNITION.PHASES, AGENCY.PRESENT_TENSE, HYGIENE.PROSE, AGENCY.MOMENTUM, HYGIENE.MARKDOWN, HYGIENE.BANNED_TROPES, HYGIENE.PROSE_STRUCTURE, AGENCY.FICTIONAL_LICENSE"), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim()}`;

  const task = clean_xml(`
${round != null ? `<ROUND>${escape_xml(String(round))}</ROUND>\n` : ""}${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>\n` : ""}
<TASK>
    <THINK_FORMAT>
    ${PROTOCOL_LIBRARY.COGNITION.THINK_NARRATOR}
    </THINK_FORMAT>
    ${task_text}
    ${build_signals_xml({}, compressed_snapshot?.fractal?.dynamics)}
    ${somatic_directives_xml ? `${somatic_directives_xml}\n    ` : ""}
    ${render_current_story_state_xml(entities, npc_entities, in_scene_ids)}
    <POV_DIRECTIVE>${PROTOCOL_LIBRARY.POV.NARRATOR}</POV_DIRECTIVE>
  </TASK>
  `).trim();

  return { system, task };
}
