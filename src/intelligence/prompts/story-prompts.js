/**
 * src/intelligence/prompts/story-prompts.js
 * 🎭 STORYTELLING TURN PROMPTS
 *
 * Prompts for the core simulation turn loop:
 * - AI Character Turn (render_character)
 * - Stage NPC Speaker Turn (render_npc_character)
 * - Ghostwriter Player Turn (render_ghostwriter)
 * - Fractal / Scene Narrator (build_narrator, prologue, epilogue)
 */

import { ind, escape_xml, clean_xml } from "@utils";
import { NARRATIVE_STYLES } from "@data";
import { build_somatic_directives_block, format_dynamics_attrs } from "./physics-prompts.js";
import { build_signals_xml } from "../physics.js";
import { render_builder } from "./builder.js";
import {
  render_system_head,
  render_field_value,
  resolve_active_style_key,
  strip_epistemic_tags,
  render_current_story_state_xml,
  render_protocols,
  PROTOCOL_LIBRARY,
} from "./shared.js";

/**
 * Resolves the active POV protocol key for an entity profile.
 * @param {any} entity
 * @returns {"POV.FIRST_PERSON" | "POV.THIRD_PERSON"}
 */
export function resolve_pov_protocol(entity) {
  const pov = entity?.pov || (entity?.type === "fractal" ? "3rd_person" : "1st_person");
  return pov === "3rd_person" ? "POV.THIRD_PERSON" : "POV.FIRST_PERSON";
}

const SCENE_TEMPLATES = {
  PROLOGUE: `You see everything. Open the scene. Use <think> to establish: What does this Fractal demand? What brought <AI_CHARACTER> and <USER_PERSONA> here? Unless context explicitly states otherwise, treat as strangers.
Narrative Sequence:
1. Present the Fractal atmosphere and current state.
2. Place <USER_PERSONA> inside, connecting them via their profile thread.
3. Place <AI_CHARACTER> inside and establish their current action.
4. Trigger the encounter. End the prologue immediately before interaction begins.
No dialogue.`,
  EPILOGUE: `You see everything. Close the scene. Use <think> to evaluate unresolved threads and active <INTENT>/<AGENDA> vectors (fulfilled, fractured, or transformed). Write the epilogue resolving these ends. Show concrete aftermath and physical changes. End on lingering sensation, not summary. No dialogue.`,
  COLLAPSE: `You see everything. Close the scene on irrevocable tragedy. Use thinking to weigh what was permanently broken, lost, or severed. Write the epilogue focusing on physical aftermath, lingering environmental scars, and the departure or fall of those involved. Do not force heroic silver linings or unearned closure. End on enduring sensory silence. No dialogue.`,
  CONTINUATION: `You are the Fractal itself, narrating the scene. Narrate the present moment through the setting's own atmosphere, sensory textures, ambient physics, and environmental shifts. Use <think> to evaluate the active atmosphere and any shift in the Fractal's state, then write the scene's reaction to recent events as vivid sensory prose. Never move <AI_CHARACTER> or <USER_PERSONA> against their will, never speak their dialogue or thoughts, and never resolve their choices for them. End the turn on one dominant hook — a decisive statement, a single action, a hovered beat, or a deliberate silence. No structural bracket labels.`,
};

const POV_DIRECTIVES = {
  FIRST_PERSON:
    "CRITICAL POV MANDATE: Write strictly in first-person ('I', 'me', 'my'). Describe actions and sensations through your own eyes. NEVER use third-person or your character name.",
  THIRD_PERSON:
    "CRITICAL POV MANDATE: Write strictly in third-person limited ('he', 'she', 'they', or entity name). NEVER use first-person pronouns for narrative prose.",
  NARRATOR:
    "CRITICAL MANDATE: You are the <FRACTAL> (scene/setting narrator). Write strictly in third-person omniscient narrator POV. NEVER write in first-person.",
};

export const STABILITY_DIRECTIVES = {
  WARNING: "WARNING: Structural drift detected. Maintain disciplined XML closures and clean markdown boundaries.",
  CRITICAL: "CRITICAL: Structural collapse. Re-anchor immediately. Every XML tag must close cleanly.",
};

/**
 * Input-rhythm calibration: classifies user message and returns length/energy directive.
 * @param {string|null} input
 * @returns {string}
 */
export function build_pacing_directive(input) {
  const text = String(input || "").trim();
  if (!text) return "INPUT RHYTHM: no prompt — advance the situation with one brief, deliberate beat.";

  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (chars >= 300 || words >= 60) {
    return "INPUT RHYTHM: expansive. You may expand to match the message's breadth, but still close on one decisive hook.";
  }

  const has_action =
    /\b(?:draw|grab|gripp?|take|push|pull|run|walk|strike|slam|open|step|slip|raise|turn|leap|dash|kneel|reach|press|set|lower|climb|swing|draws|grabs|steps|raises|turns|opens|says|whispers|shouts|nods|shakes|stands|sits|takes|pulls|pushes)\b/i.test(
      text,
    );
  const is_question = /\?\s*$/.test(text);
  const is_silence = !has_action && !is_question && words <= 12;
  if (chars <= 40 || words <= 8) {
    if (is_silence) {
      return "INPUT RHYTHM: passive silence. Do not stall — escalate with a direct probe (a pointed question, a challenge, or an unexpected development) in one or two taut sentences.";
    }
    return "INPUT RHYTHM: terse. Match it — a brief, weighted reply of one to three sharp beats (short sentences, a single decisive action or line). Do not pad.";
  }
  return "INPUT RHYTHM: moderate. A reply of a few sentences — long enough for substance, short enough to keep the scene moving.";
}

/**
 * Recency Anchor — a short behavioral lock re-injected at the BOTTOM of the
 * prompt, the region the attention window most strongly weights at generation time.
 * It re-asserts the three invariants that decay fastest in a long window:
 * temperament (not softness), the epistemic horizon (only what this scene showed),
 * and pacing (don't rush). Kept tiny (~1-2 sentences) so it stays "pinned".
 * @param {any} snapshot - compressed world snapshot (for the emotional stance)
 * @param {string} [input] - current user action / scene beat
 * @returns {string}
 */
export function build_recency_anchor(snapshot, input) {
  const stance = snapshot?.ai?.dynamics
    ? Object.entries(snapshot.ai.dynamics)
        .filter(([, v]) => typeof v === "number")
        .filter(([k]) => k === "affinity" || k === "intensity")
        .map(([k, v]) => `${k}=${Math.round(v)}`)
        .join(", ")
    : "";
  const scene_hook = String(input || "").trim() ? "Act on what this exact beat shows you." : "Push the situation forward on your own terms.";
  const body = `Hold your temperament; do not soften into pleasantness. Know only what this scene has shown you. Do not rush the tension.${stance ? ` (${escape_xml(stance)})` : ""} ${scene_hook}`;
  return `<RECENCY_ANCHOR>\n    ${body}\n  </RECENCY_ANCHOR>`;
}

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

  const is_first_contact =
    meta?.is_opening_turn || (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT"));

  const protocols = [
    "AGENCY.PRESENT_TENSE",
    "HYGIENE.PROSE_DISCIPLINE",
    ...(has_user_action ? ["AGENCY.USER_BOUNDARIES", "AGENCY.YES_AND"] : []),
    "AGENCY.MOMENTUM",
    "AGENCY.INITIATIVE",
    "HYGIENE.ANTI_TROPES",
    "AGENCY.DRIFT_AUDIT",
    "AGENCY.FICTIONAL_LICENSE",
  ]
    .filter(Boolean)
    .join(", ");
  const stability_lock_content =
    meta?.structural_errors >= 3 ? STABILITY_DIRECTIVES.CRITICAL : meta?.structural_errors >= 1 ? STABILITY_DIRECTIVES.WARNING : "";

  const user_field = (text) => render_field_value(strip_epistemic_tags(text), entities?.USER, entities);

  const rendered_protocols = render_protocols(protocols);
  const full_protocols = is_first_contact
    ? `${rendered_protocols}\n<FIRST_CONTACT>Unless context explicitly establishes a prior relationship, treat this as a first encounter. You do not know the user's name, history, or intent.</FIRST_CONTACT>`
    : rendered_protocols;

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
    ${ind(full_protocols, 4)}
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
      ${ind(PROTOCOL_LIBRARY.COGNITION.EPISTEMIC_PHYSICS, 6)}
    </EPISTEMIC_PHYSICS>
    ${build_signals_xml(compressed_snapshot?.ai?.dynamics, compressed_snapshot?.fractal?.dynamics, { style: NARRATIVE_STYLES[resolve_active_style_key()] })}
    <POV_DIRECTIVE>
      ${POV_DIRECTIVES[pov_protocol.split(".")[1] || "FIRST_PERSON"]}
    </POV_DIRECTIVE>
    ${
      ghostwrite
        ? "Follow the <GHOSTWRITE> directive below to complete your turn."
        : has_user_action
          ? `Respond to <USER_ACTION> in character.
    ${build_pacing_directive(input)}`
          : "Take initiative to open or advance the scene organically."
    }
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
  _meta,
  render_accessors = null,
  director_data,
  npc_entities = [],
  in_scene_ids = [],
}) {
  const accessors = render_accessors || render_builder.create_render_accessors(entities, input);
  const npc_name = escape_xml(npc?.name || "NPC");
  const user_name = escape_xml(entities?.USER?.name || "User");
  const ai_name = escape_xml(entities?.AI?.name || "Protagonist");
  const fractal_name = escape_xml(entities?.FRACTAL?.name || "the setting");
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
    "AGENCY.PRESENT_TENSE",
    "HYGIENE.PROSE_DISCIPLINE",
    ...(has_user_action ? ["AGENCY.USER_BOUNDARIES", "AGENCY.YES_AND"] : []),
    "AGENCY.MOMENTUM",
    "AGENCY.INITIATIVE",
    "HYGIENE.ANTI_TROPES",
    "AGENCY.DRIFT_AUDIT",
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
    <INTENT>${ind(accessors.future(npc, { vector_text: true }), 6)}</INTENT>
    <MEMORIES>${ind(accessors.past(npc, { vector_text: true }), 6)}</MEMORIES>
  </YOUR_IDENTITY>
  <PROTAGONIST name="${ai_name}"${format_dynamics_attrs(compressed_snapshot?.ai?.dynamics)}>
    <STATE_OF_MIND>${render_field_value(entities?.AI?.present?.non_physical, entities?.AI, entities)}</STATE_OF_MIND>
    <CURRENT_LOOK>${render_field_value(entities?.AI?.present?.physical, entities?.AI, entities)}</CURRENT_LOOK>
    <INTENT>${ind(accessors.future(entities?.AI, { vector_text: true }), 6)}</INTENT>
    <MEMORIES>${ind(accessors.past(entities?.AI, { vector_text: true }), 6)}</MEMORIES>
  </PROTAGONIST>
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
      ${ind(PROTOCOL_LIBRARY.COGNITION.EPISTEMIC_PHYSICS, 6)}
    </EPISTEMIC_PHYSICS>
    ${build_signals_xml(npc?.dynamics, compressed_snapshot?.fractal?.dynamics, { style: NARRATIVE_STYLES[resolve_active_style_key()] })}
    <POV_DIRECTIVE>
      ${POV_DIRECTIVES.THIRD_PERSON}
    </POV_DIRECTIVE>
    Respond strictly as ${npc_name} — a supporting character. Own only your own voice, actions, and perspective: never speak for <USER_PERSONA> or the AI character, and never resolve the overarching story quest on your own. Write third-person limited, present tense, and end on a natural beat.
    ${build_pacing_directive(input)}
    ${build_recency_anchor({ ai: { dynamics: npc?.dynamics } }, input)}
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
      Match the tone of the scene. Output ONLY in-character prose/dialogue suitable for the player's turn. No meta preamble, no out-of-character commentary.
    </GHOSTWRITE>
  `);

  return rendered;
}

/**
 * Fractal / Scene Narrator compiler for scene continuation, prologue, and epilogue.
 */
export function build_narrator(
  mode = "scene",
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
      ? `${SCENE_TEMPLATES.PROLOGUE}\n    Input: ${escape_xml(input?.trim() || "The scene begins.")}`
      : mode === "scene"
        ? `${SCENE_TEMPLATES.CONTINUATION}\n    Input: ${escape_xml(input?.trim() || "The scene continues.")}`
        : conclusion_status === "COLLAPSED"
          ? SCENE_TEMPLATES.COLLAPSE
          : SCENE_TEMPLATES.EPILOGUE;
  const fractal_name = entities?.FRACTAL?.name || "The Fractal";
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
    <ANCHOR>Resolve all state inferences strictly from the <YOUR_IDENTITY> block above. Never invent state that is not listed there.</ANCHOR>
    ${ind(render_protocols("AGENCY.PRESENT_TENSE, HYGIENE.PROSE_DISCIPLINE, AGENCY.MOMENTUM, HYGIENE.ANTI_TROPES, AGENCY.FICTIONAL_LICENSE"), 4)}
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
    <POV_DIRECTIVE>${POV_DIRECTIVES.NARRATOR}</POV_DIRECTIVE>
  </TASK>
  `).trim();

  return { system, task };
}

/**
 * CHANGELOG
 * - 2026-08-28: Updated imports to consume render_builder from builder.js and dynamics formatters from physics-prompts.js.
 */
