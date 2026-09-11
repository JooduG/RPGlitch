/**
 * src/intelligence/prompts/narrator-prompt.js
 * 🎬 SHOT 2 (STORY PROSE) PROMPTS — the Fractal's narrator beats
 *
 * The narrator compiler: the event-level voice of the FRACTAL itself. It reuses
 * the Shot-2 constitution + the shared <CORE_PROTOCOLS> block from shared.js plus
 * the shared entity-sheet compiler, but swaps the turn block —
 * no DELIVERY_POSTURE, a narrator THINK_FORMAT, and a scene-template directive
 * (CONTINUATION / PROLOGUE / EPILOGUE / COLLAPSE) as the action directive.
 * Every narrator-specific body (role line, the four scene directives, the
 * prologue input fallback and the narrator THINK_FORMAT) lives in
 * NARRATOR_PROTOCOLS below.
 *
 * One fused <SYSTEM round="N" mode="narrator"> layout:
 *   1. <AXIOMATIC_CONSTITUTION> — LAWs L1-L5, directly inside <SYSTEM>
 *   2. <CORE_PROTOCOLS>  — NARRATOR POV, NARRATIVE_STYLE + PROSE_DISCIPLINE
 *   3. <STORY_ENTITIES>  — AI / USER / FRACTAL / NPC sheets (omniscient: the
 *                          USER's dispositions + agenda and the fractal axes are
 *                          included)
 *   4. <CONVERSATION_HISTORY> — engine-injected inside <SYSTEM> (transport)
 *   5. <TASK>            — the scene-template directive, CURRENTS
 *                          (SENSORY_EXPERIENCE + SUBTEXT), INPUT (omitted for a
 *                          prologue) and the narrator THINK_FORMAT
 *
 * The transport closes </SYSTEM> after the task; the renderer returns the open
 * <SYSTEM> prefix (system), the <TASK> block (task) and the closing tag
 * (system_close) so history + task sit INSIDE <SYSTEM>.
 */

import { escape_xml, prompt_escape, clean_xml, has_alternations } from "@utils";
import { get_narrative_style, resolve_active_style_key, extract_style_dna } from "@data";
import { build_somatic_signals_xml } from "./physics-prompt.js";
import { render_builder } from "./builder.js";
import {
  render_axiomatic_constitution,
  render_core_protocols,
  render_entity_sheets,
  render_task_currents,
  render_task_input,
  get_prompt_mode,
  resolve_stability_lock,
  indent_all as _indent,
} from "./shared.js";

// ── 1. Narrator Protocols ─────────────────────────────────────────────────────

/**
 * Every narrator-specific protocol body: the omniscient Fractal role line, the
 * four scene-template directives (CONTINUATION / PROLOGUE / EPILOGUE / COLLAPSE),
 * the prologue opening-input fallback and the narrator THINK_FORMAT. The
 * constitution LAWs and the <CORE_PROTOCOLS> scaffold come from PROTOCOL_LIBRARY
 * in shared.js; the scene-template dispatch itself lives in render_narrator_prose.
 */
const NARRATOR_PROTOCOLS = {
  ROLE_LINE: (speaker_name) =>
    `You are ${speaker_name}, the Fractal itself, narrating the story. Embody this role with uncompromised fidelity under the laws and directives below.`,

  SCENES: {
    PROLOGUE: `You see everything. Open the scene. Use thinking to establish: What does this Fractal demand? What brought <AI_CHARACTER> and <USER_PERSONA> here? Unless context explicitly states otherwise, treat as strangers.
Narrative Sequence:
1. Present the Fractal atmosphere and current state.
2. Place <USER_PERSONA> inside, connecting them via their profile thread.
3. Place <AI_CHARACTER> inside and establish their current action.
4. Trigger the encounter. End the prologue immediately before interaction begins.
No dialogue.`,
    EPILOGUE: `You see everything. Close the scene. Use thinking to evaluate unresolved threads and active <INTENT>/<AGENDA> vectors (fulfilled, fractured, or transformed). Write the epilogue depicting environmental aftermath and physical changes without forcing player physical surrender. End on lingering sensation, not summary. No dialogue.`,
    COLLAPSE: `You see everything. Close the scene on irrevocable tragedy. Use thinking to weigh what was permanently broken, lost, or severed. Write the epilogue focusing on environmental aftermath, physical changes, and lingering environmental scars without forcing player physical surrender. Do not force heroic silver linings or unearned closure. End on enduring sensory silence. No dialogue.`,
    CONTINUATION: `You are the Fractal itself, narrating the scene. Narrate the present moment through the setting's own atmosphere, sensory textures, ambient physics, and environmental shifts. Use thinking to evaluate the active atmosphere and any shift in the Fractal's state, then write the scene's reaction to recent events as vivid sensory prose. Never move <AI_CHARACTER> or <USER_PERSONA> against their will, never speak their dialogue or thoughts, and never resolve their choices for them. End the turn on one dominant hook — a decisive statement, a single action, a hovered beat, or a deliberate silence. No structural bracket labels.`,
  },

  DEFAULTS: {
    SCENE_BEGINS: "The scene begins.",
  },

  THINK_FORMAT:
    "Begin response with <THINK>. ALL internal calculations, scene/atmosphere shifts, and markdown headers MUST remain strictly INSIDE this block. Conduct thinking in the conversation language. Close with </THINK> response before narrative prose.",
};

// ── 2. Narrator Task Layout ───────────────────────────────────────────────────

/** <TASK> block for a narrator beat (no DELIVERY_POSTURE; narrator THINK_FORMAT). */
function render_narrator_task({
  config,
  input,
  input_origin = null,
  is_prologue = false,
  style,
  somatic_inner,
  action_directive = "",
  stability_lock = "",
}) {
  const dna = extract_style_dna(style);
  const input_tag = config.input?.tag || "INPUT";
  const parts = [];

  if (String(stability_lock || "").trim()) parts.push(`    <STABILITY_LOCK>${prompt_escape(stability_lock)}</STABILITY_LOCK>`);
  if (String(action_directive || "").trim()) parts.push(_indent(action_directive, 4));

  const currents = render_task_currents(dna, somatic_inner);
  if (currents) parts.push(currents);

  const input_block = render_task_input({ input_tag, input: is_prologue ? "" : input, input_origin });
  if (input_block) parts.push(input_block);

  parts.push(`    <THINK_FORMAT>\n${_indent(NARRATOR_PROTOCOLS.THINK_FORMAT, 6)}\n    </THINK_FORMAT>`);

  return `<TASK>\n${parts.join("\n\n")}\n</TASK>`;
}

// ── 3. Narrator Prose Compiler ────────────────────────────────────────────────

/**
 * Narrator Prose compiler — the FRACTAL's omniscient, event-level voice. The
 * beat is selected via `scene_template` (CONTINUATION / PROLOGUE / EPILOGUE /
 * COLLAPSE; EPILOGUE is the default).
 *
 * Returns the open <SYSTEM> prefix without its closing tag; the transport
 * injects <CONVERSATION_HISTORY> and the <TASK> block before appending
 * `system_close` (</SYSTEM>), so history + task live inside <SYSTEM>.
 *
 * @param {Object} params
 * @param {number|string|null} [params.round]
 * @param {any} params.entities
 * @param {any} [params.speaker] - Narrator entity (defaults to entities.FRACTAL)
 * @param {string} [params.input]
 * @param {any} [params.compressed_snapshot]
 * @param {any} [params.meta]
 * @param {any} [params.render_accessors]
 * @param {any} [params.director_data]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @param {'CONTINUATION' | 'PROLOGUE' | 'EPILOGUE' | 'COLLAPSE' | null} [params.scene_template=null]
 * @returns {{ system: string, task: string, system_close: string }}
 */
export function render_narrator_prose({
  round = null,
  entities = {},
  speaker = null,
  input = "",
  compressed_snapshot = {},
  meta = {},
  render_accessors = null,
  director_data = null,
  npc_entities = [],
  in_scene_ids = [],
  scene_template = null,
}) {
  const active_speaker = speaker || entities?.FRACTAL;
  const config = get_prompt_mode("narrator");
  const resolved_scene_template = scene_template || config.scene_template || null;
  const is_prologue = resolved_scene_template === "PROLOGUE";

  const accessors = render_accessors || render_builder.create_render_accessors(entities, input);

  const speaker_name = prompt_escape(active_speaker?.name || "The Fractal");

  const style = get_narrative_style(resolve_active_style_key());

  const fractal_dynamics = compressed_snapshot?.fractal?.dynamics || entities?.FRACTAL?.dynamics || {};

  const somatic_signals_xml =
    resolved_scene_template === "CONTINUATION"
      ? build_somatic_signals_xml({}, fractal_dynamics, {
          keywords: director_data?.keywords || [],
          style,
        })
      : "";
  const somatic_inner = String(somatic_signals_xml || "")
    .replace(/^\s*<SUBTEXT>\s*/, "")
    .replace(/\s*<\/SUBTEXT>\s*$/, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const constitution = render_axiomatic_constitution({ ghostwrite: false });

  const entities_block = render_entity_sheets({
    entities,
    npc_entities,
    in_scene_ids,
    active_speaker,
    accessors,
    config,
    is_npc: false,
    speaker_dynamics: fractal_dynamics,
    fractal_dynamics,
  });

  const core = render_core_protocols({
    is_narrator: true,
    style,
    is_first_contact: false,
    has_alternation: has_alternations(entities_block),
  });

  const role_line = NARRATOR_PROTOCOLS.ROLE_LINE(speaker_name);

  const system = clean_xml(
    `\n<SYSTEM round="${escape_xml(String(round ?? 0))}" mode="${escape_xml(config.system_mode)}">\n${role_line}\n${constitution}\n\n${core}\n\n${entities_block}\n`,
  ).trim();

  const action_directive = is_prologue
    ? `${NARRATOR_PROTOCOLS.SCENES.PROLOGUE}\n    Input: ${prompt_escape(input?.trim() || NARRATOR_PROTOCOLS.DEFAULTS.SCENE_BEGINS)}`
    : resolved_scene_template === "CONTINUATION"
      ? NARRATOR_PROTOCOLS.SCENES.CONTINUATION
      : resolved_scene_template === "COLLAPSE"
        ? NARRATOR_PROTOCOLS.SCENES.COLLAPSE
        : NARRATOR_PROTOCOLS.SCENES.EPILOGUE;

  const input_origin_entity = entities?.USER;
  const input_origin = input_origin_entity?.id || input_origin_entity?.name || "USER";

  const task = render_narrator_task({
    config,
    input,
    input_origin,
    is_prologue,
    style,
    somatic_inner,
    action_directive,
    stability_lock: resolve_stability_lock(meta),
  });

  return { system, task, system_close: "</SYSTEM>" };
}

/**
 * CHANGELOG
 * - 2026-09-10: Registry consolidation. The local SCENE_TEMPLATES map, the NARRATOR_THINK_FORMAT
 *   constant and the inline Fractal role line folded into one NARRATOR_PROTOCOLS registry
 *   (ROLE_LINE / SCENES / DEFAULTS.SCENE_BEGINS / THINK_FORMAT). render_narrator_prose reads the
 *   role line and the scene-template dispatch from it; render_narrator_task reads THINK_FORMAT.
 * - 2026-09-10: Redundancy sweep. The <CURRENTS>/<INPUT> assembly now comes from the shared
 *   render_task_currents / render_task_input helpers; dropped the dead `pov_protocol` local
 *   (render_core_protocols derives the narrator POV from `is_narrator` alone).
 * - 2026-09-10: render_axiomatic_constitution now comes from shared.js (the constitution is a
 *   cross-mode Shot-2 block, not dynamics). Adopted the narrator THINK_FORMAT body as a local
 *   constant from PROTOCOL_LIBRARY.COGNITION (this file was its only consumer), so shared.js
 *   no longer exports it and PROTOCOL_LIBRARY is no longer imported here.
 * - 2026-09-10: Now imports render_axiomatic_constitution from physics-prompt.js and
 *   render_core_protocols from shared.js — this file no longer depends on interaction-prompt.js.
 * - 2026-09-10: Extracted from story-prompt.js. Holds the narrator beat compiler
 *   (render_narrator_prose) and the SCENE_TEMPLATES it dispatches on. Reuses the
 *   constitution / core-protocol blocks exported by interaction-prompt.js, the
 *   shared entity-sheet compiler + layout helpers + stability lock from shared.js,
 *   and build_somatic_signals_xml from physics-prompt.js.
 */
