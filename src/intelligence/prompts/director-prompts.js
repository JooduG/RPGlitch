/**
 * src/intelligence/prompts/director-prompts.js
 * 📐 SHOT 1 (DIRECTOR) PROMPTS — Quick Shot Prompt Compiler & Schema
 *
 * Dedicated prompt generator for Shot 1 (Director):
 * - DIRECTOR_PROTOCOLS.SCHEMA (canonical schema definition)
 * - DIRECTOR_PROTOCOLS (director-specific operational laws)
 * - render_director (Director system & task prompt compiler)
 * - render_terse_director_task (Fast-path recovery task on retry)
 */

import { get_style_keywords, resolve_active_style_key } from "@data";
import { ind, escape_xml, clean_xml, strip_cognition_blocks } from "@utils";
import { build_available_keywords_xml, format_dynamics_attrs } from "./physics-prompts.js";
import { render_builder } from "./builder.js";
import { render_system_head, render_field_value, render_director_cast_xml, render_protocols } from "./shared.js";

/**
 * Detects a non-verbal, environmental user turn — no quoted dialogue, with
 * spatial/locational focus — and returns a hint nudging the Director to route
 * the beat to the fractal narrator.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function render_environmental_hint(input) {
  if (!input?.trim()) return "";
  if (/["'“”‘’]/.test(input)) return "";
  const spatial_verbs =
    /\b(step|walk|enter|approach|study|examine|press|watch|observe|descend|ascend|peer|reach|kneel|stand|wait|listen|smell|scan|sweep|climb|move|circle|bend|follow|open|close|stare|gaze|rest|push|pull|turn|edge|halt|trail|settle|pause|linger)\b/i;
  const spatial_nouns =
    /\b(door|gate|wall|room|hall|cave|forest|vault|stair|passage|corridor|window|floor|ceiling|rock|stone|water|river|bridge|tower|street|alley|field|sky|wind|rain|shadow|light|threshold|lock|mechanism|gear|wheel|conduit|tunnel|arch|column|altar|seal|cylinder|crevice|spillway|belly|deeps|mouth|chamber|alcove|ledge|court|yard|keep)\b/i;
  if (!spatial_verbs.test(input) && !spatial_nouns.test(input)) return "";
  return '<USER_ACTION_NOTE>This turn is a non-verbal, environmental action. Strongly consider setting "speaker" to "fractal" so the scene/setting itself narrates the moment — unless the AI character should react directly.</USER_ACTION_NOTE>';
}

// ── 1. Canonical Quick Shot Director Schema & Protocols ───────────────────────

export const DIRECTOR_PROTOCOLS = {
  SCHEMA: `{
  "_thought_process": "<ONE short sentence: tactical intent & state delta>",
  "next_action": "'AI_CHARACTER' (AI speaks) | 'FRACTAL' (Fractal narrates) | 'npc:<id>' (in-scene NPC speaks) | 'GENESIS' (mint brand-new NPC) | 'EPILOGUE_CONCLUDED' (quest won) | 'EPILOGUE_COLLAPSED' (quest lost)",
  "keywords": "1-3 keywords from <AVAILABLE_KEYWORDS> (e.g. ['vulnerability', 'cinematic_shot']) or []",
  "directors_note": "1-3 lines of unseen acting/staging directives for the speaker",
  "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0 },
  "fractal_dynamics_deltas": { "velocity": 0, "entropy": 0 },
  "in_scene_change": { "enter": ["npc:<id>"], "exit": ["npc:<id>"] },
  "genesis": { "name": "<Character Name>", "description": "<1-2 sentence core persona>", "signature_color": "<Optional signature color>", "speaking_style": "casual" }
}`,

  CONTINUITY_AND_CAUSALITY: `SECRET AGENDAS: <INTENT>/<AGENDA> vectors encode private ambitions. Weave entity vectors indirectly into atmosphere/obstacles. Never present another entity's hidden agenda as known fact to the AI character.
PHYSICAL CAUSALITY: Enforce strict physical causality and environmental integrity. If <USER_ACTION> attempts an impossible physical feat (e.g. walking through locked solid barriers without established magic, or materializing unearned items from thin air), do NOT passively allow the violation. Flag it in "directors_note" as a physical obstacle or contradiction for the character to confront in-character.
PROP PROVENANCE: Everyday items (lighter, knife, rope, coins, flask, keys) are presumed present — accept them without question. Never accept items carrying major plot significance or contradicting reality (quest artifacts located elsewhere): treat them as bluffs/counterfeits in "directors_note".
SENSORY ENGAGEMENT: When <USER_ACTION> explicitly touches or observes physical details, ensure "directors_note" engages with that physical reality rather than substituting a distraction.`,

  PACING_AND_MOMENTUM: `PACING LAW: Treat the active Fractal's <AGENDA> as a long-term scenario horizon. Do NOT rush to resolve standing objectives in early turns. Cue subtle developments in "directors_note" that build tension gradually.
PASSIVE USER TURN LAW: When <USER_ACTION> contains no action verbs or questions (e.g. passive waiting or silence), use "directors_note" to introduce an unexpected environmental complication or in-character choice. Never let the scene stall into dead-air.`,

  SPEAKER_ROUTING: `Choose the active speaker to match the turn's energy:
- "AI_CHARACTER": (Default) AI reacts to user.
- "FRACTAL": User action is non-verbal and environmental (exploring atmosphere, architecture, weather, objects without dialogue) or to break up long streaks of AI speech.
- "npc:<id>": An active in-scene NPC takes the floor.
- "GENESIS": A new character is introduced into the world.`,

  ENTITY_CONVERGENCE: `1. Always inspect <ROSTER> before introducing any secondary character.
2. If an existing cast member matches the role or location (medical, black market, security), you MUST use that existing entity rather than inventing a duplicate.
3. Only introduce a brand-new nameless character if no existing cast member is remotely applicable.`,

  TERMINATION: `STORY RESOLUTION & TERMINAL COLLAPSE LAW:
- Quest Victory: When the overarching narrative conflict is decisively won or concluded happily, emit next_action: "EPILOGUE_CONCLUDED".
- Tragic Collapse: When irreversible catastrophe, total systemic failure, or protagonist death occurs (fatal wound, terminal entropy >= 85, destruction of setting), emit next_action: "EPILOGUE_COLLAPSED".
- Output Constraint: Output strictly valid JSON. Under 400 characters. No markdown code fences.`,
};

// ── 2. Director Prompt Compiler (Shot 1) ──────────────────────────────────────

/**
 * Director prompt compiler (Shot 1).
 * @param {Object} params
 * @param {number|string} params.round
 * @param {any} params.entities
 * @param {string} [params.input]
 * @param {any} [params.render_accessors]
 * @param {any} [params.compressed_snapshot]
 * @param {any[]} [params.raw_messages]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @returns {{ system: string, task: string }}
 */
export function render_director({
  round,
  entities,
  input = "",
  render_accessors = null,
  compressed_snapshot,
  raw_messages = [],
  npc_entities = [],
  in_scene_ids = [],
}) {
  const accessors = render_accessors || render_builder.create_render_accessors(entities, input, raw_messages);
  const shared_protocols = render_protocols("AGENCY.FICTIONAL_LICENSE, HYGIENE.STATE_EMISSION, COGNITION.EPISTEMIC_PHYSICS");
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
  ${render_director_cast_xml({ entities, npc_entities, in_scene_ids })}
</SYSTEM>
  `).trim()}`;

  const last_ai = (raw_messages || []).filter((m) => m.role === "model").slice(-1)[0];
  const last_ai_text = last_ai ? strip_cognition_blocks(last_ai.content || last_ai.text || "").trim() : "";

  const task = clean_xml(`
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
${last_ai_text ? `<AI_CHARACTER_LAST_TURN>${ind(last_ai_text, 2)}</AI_CHARACTER_LAST_TURN>` : ""}
<TASK>
    Evaluate state mutations caused by ${input?.trim() ? "<USER_ACTION>" : "the current situation"}.
    Decide "next_action": "AI_CHARACTER" (AI speaks), "FRACTAL" (Fractal scene-narrator speaks), "npc:<id>" (in-scene NPC speaks), "GENESIS" (mint a new NPC), "EPILOGUE_CONCLUDED" (quest victory), or "EPILOGUE_COLLAPSED" (fatal defeat, irreversible ruin, terminal entropy >= 85). Default "AI_CHARACTER".${Number(round) <= 1 ? ' IMPORTANT: Round 1 directly follows the Fractal prologue, so next_action MUST be "AI_CHARACTER".' : ""}
    Select 1-3 "keywords" from <AVAILABLE_KEYWORDS> (or [] when neutral).
    Provide 1-3 lines of "directors_note" as unseen acting/staging guidance for the speaker.
    Output physics shifts in "dynamics_deltas" (e.g. {"intensity": 10, "openness": -5}) and "fractal_dynamics_deltas".
    Track the Stage Spotlight: when an NPC enters or leaves the room, move it with "in_scene_change".
    ${render_environmental_hint(input)}
    Record your reasoning inside "_thought_process" and return a single valid JSON object following this exact schema:
    ${DIRECTOR_PROTOCOLS.SCHEMA}
    Obey all active <PROTOCOLS>. Keep output under 400 characters and return strictly JSON.
</TASK>
  `).trim();

  return { system, task };
}

// ── 3. Terse Director Recovery Task ───────────────────────────────────────────

/**
 * Terse replacement for the Director task — used on retry after truncated JSON.
 * @returns {string}
 */
export function render_terse_director_task() {
  return `
<TASK>
  Return a single, COMPLETE, VALID JSON object under 400 characters matching this schema:
  ${DIRECTOR_PROTOCOLS.SCHEMA}
</TASK>
  `.trim();
}

/**
 * CHANGELOG
 * - 2026-08-28: Removed duplicate raw XML strings in favor of render_protocols for convergence and epistemic rules.
 */
