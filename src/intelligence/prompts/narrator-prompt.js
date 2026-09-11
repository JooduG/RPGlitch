/**
 * src/intelligence/prompts/narrator-prompt.js
 * 🎬 SHOT 2 (STORY PROSE) PROMPTS — the Fractal's narrator beats
 *
 * The narrator compiler: the event-level voice of the FRACTAL itself. It reuses
 * the Shot-2 constitution / core-protocol blocks from interaction-prompt.js and
 * the shared entity-sheet compiler from shared.js, but swaps the turn block —
 * no DELIVERY_POSTURE, a narrator THINK_FORMAT, and a scene-template directive
 * (CONTINUATION / PROLOGUE / EPILOGUE / COLLAPSE) as the action directive.
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
import { render_axiomatic_constitution, render_core_protocols } from "./interaction-prompt.js";
import {
  PROTOCOL_LIBRARY,
  render_entity_sheets,
  get_prompt_mode,
  resolve_pov_protocol,
  resolve_stability_lock,
  wrap_tag,
  indent_all as _indent,
  inline_or_block as _inline_or_block,
} from "./shared.js";

// ── 1. Scene Templates ────────────────────────────────────────────────────────

const SCENE_TEMPLATES = {
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

  const currents = [];
  if (dna.sensory_order) currents.push(`      <SENSORY_EXPERIENCE>${prompt_escape(dna.sensory_order)}</SENSORY_EXPERIENCE>`);
  if (String(somatic_inner || "").trim()) currents.push(wrap_tag("SUBTEXT", somatic_inner, 6));
  if (currents.length) parts.push(`    <CURRENTS>\n${currents.join("\n")}\n    </CURRENTS>`);

  if (input_tag && String(input || "").trim() && !is_prologue) {
    const origin = String(input_origin || "USER");
    parts.push(`    <${input_tag} origin="${escape_xml(origin)}">${_inline_or_block(prompt_escape(input.trim()), 6)}</${input_tag}>`);
  }

  parts.push(`    <THINK_FORMAT>\n${_indent(PROTOCOL_LIBRARY.COGNITION.THINK_NARRATOR, 6)}\n    </THINK_FORMAT>`);

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
  const pov_protocol = resolve_pov_protocol(active_speaker);

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
    pov_protocol,
    style,
    is_first_contact: false,
    has_alternation: has_alternations(entities_block),
  });

  const role_line = `You are ${speaker_name}, the Fractal itself, narrating the story. Embody this role with uncompromised fidelity under the laws and directives below.`;

  const system = clean_xml(
    `\n<SYSTEM round="${escape_xml(String(round ?? 0))}" mode="${escape_xml(config.system_mode)}">\n${role_line}\n${constitution}\n\n${core}\n\n${entities_block}\n`,
  ).trim();

  const action_directive = is_prologue
    ? `${SCENE_TEMPLATES.PROLOGUE}\n    Input: ${prompt_escape(input?.trim() || "The scene begins.")}`
    : resolved_scene_template === "CONTINUATION"
      ? SCENE_TEMPLATES.CONTINUATION
      : resolved_scene_template === "COLLAPSE"
        ? SCENE_TEMPLATES.COLLAPSE
        : SCENE_TEMPLATES.EPILOGUE;

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
 * - 2026-09-10: Extracted from story-prompt.js. Holds the narrator beat compiler
 *   (render_narrator_prose) and the SCENE_TEMPLATES it dispatches on. Reuses the
 *   constitution / core-protocol blocks exported by interaction-prompt.js, the
 *   shared entity-sheet compiler + layout helpers + stability lock from shared.js,
 *   and build_somatic_signals_xml from physics-prompt.js.
 */
