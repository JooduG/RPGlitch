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
import { build_available_keywords_xml } from "./physics-prompts.js";
import { render_builder } from "./builder.js";
import { render_system_head, render_recoupled_cast_body, render_director_cast_xml, render_protocols } from "./shared.js";

// ── 0. Lexical & Spatial Recognition Constants ───────────────────────────────

const DIALOGUE_QUOTES_PATTERN = /["'“”‘’]/;

const SPATIAL_VERBS_PATTERN =
  /\b(step|walk|enter|approach|study|examine|press|watch|observe|descend|ascend|peer|reach|kneel|stand|wait|listen|smell|scan|sweep|climb|move|circle|bend|follow|open|close|stare|gaze|rest|push|pull|turn|edge|halt|trail|settle|pause|linger)\b/i;

const SPATIAL_NOUNS_PATTERN =
  /\b(door|gate|wall|room|hall|cave|forest|vault|stair|passage|corridor|window|floor|ceiling|rock|stone|water|river|bridge|tower|street|alley|field|sky|wind|rain|shadow|light|threshold|lock|mechanism|gear|wheel|conduit|tunnel|arch|column|altar|seal|cylinder|crevice|spillway|belly|deeps|mouth|chamber|alcove|ledge|court|yard|keep)\b/i;

/**
 * Detects a non-verbal, environmental user turn — no quoted dialogue, with
 * spatial/locational focus — and returns a hint nudging the Director to route
 * the beat to the fractal narrator.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function render_environmental_hint(input) {
  if (!input?.trim()) return "";
  if (DIALOGUE_QUOTES_PATTERN.test(input)) return "";
  if (!SPATIAL_VERBS_PATTERN.test(input) && !SPATIAL_NOUNS_PATTERN.test(input)) return "";
  return '<USER_ACTION_NOTE>This turn is a non-verbal, environmental action. Strongly consider setting "speaker" to "fractal" so the scene/setting itself narrates the moment — unless the AI character should react directly.</USER_ACTION_NOTE>';
}

// ── 1. Canonical Quick Shot Director Schema & Protocols ───────────────────────

export const DIRECTOR_PROTOCOLS = Object.freeze({
  SCHEMA: `{
  "_thought_process": "<ONE short sentence: tactical intent & state delta>",
  "next_action": "'AI_CHARACTER' (AI speaks) | 'FRACTAL' (Fractal narrates) | 'npc:<id>' (in-scene NPC speaks) | { "genesis": { "name": "<Name>", "description": "<description>" } } (mint brand-new NPC) | 'EPILOGUE_CONCLUDED' (quest won) | 'EPILOGUE_COLLAPSED' (quest lost)",
  "keywords": ["<1-5 keywords from <AVAILABLE_KEYWORDS> or []>"],
  "directors_note": "<1-5 lines of unseen acting/staging directives for the next speaker, or empty string>",
  "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0, "velocity": 0, "entropy": 0 },
  "visual_staging": "<optional: 1 line camera & lighting directive ONLY if triggering a scene image shift, else omit>",
  "spotlight": { "enter": ["npc:<id>"], "exit": ["npc:<id>"] }
}`,

  CONTINUITY_AND_CAUSALITY: `SECRET AGENDAS: <INTENT>/<AGENDA> vectors encode private ambitions. Weave entity vectors indirectly into atmosphere/obstacles. Never present another entity's hidden agenda as known fact to the AI character.
PHYSICAL CAUSALITY: Enforce strict physical causality and environmental integrity. If <USER_ACTION> attempts an impossible physical feat (e.g. walking through locked solid barriers without established magic, or materializing unearned items from thin air), do NOT passively allow the violation. Flag it in "directors_note" as a physical obstacle or contradiction for the character to confront in-character.
PROP PROVENANCE: Everyday items (lighter, knife, rope, coins, flask, keys) are presumed present — accept them without question. Never accept items carrying major plot significance or contradicting reality (quest artifacts located elsewhere): treat them as bluffs/counterfeits in "directors_note".
SENSORY ENGAGEMENT: When <USER_ACTION> explicitly touches or observes physical details, ensure "directors_note" engages with that physical reality rather than substituting a distraction.`,

  PACING_AND_MOMENTUM: `PACING LAW: Treat the active Fractal's <AGENDA> as a long-term scenario horizon. Do NOT rush to resolve standing objectives in early turns. Cue subtle developments in "directors_note" that build tension gradually.
PASSIVE USER TURN LAW: When <USER_ACTION> contains no action verbs or questions (e.g. passive waiting or silence), use "directors_note" to introduce an unexpected environmental complication or in-character choice. Never let the scene stall into dead-air.`,
});

// ── 2. Director Prompt Compiler (Shot 1) ──────────────────────────────────────

/**
 * Director prompt compiler (Shot 1).
 * @param {Object} parameters
 * @param {number|string} parameters.round
 * @param {any} parameters.entities
 * @param {string} [parameters.input]
 * @param {any} [parameters.render_accessors]
 * @param {any} [parameters.compressed_snapshot]
 * @param {any[]} [parameters.raw_messages]
 * @param {any[]} [parameters.simulation_log]
 * @param {any[]} [parameters.npc_entities]
 * @param {string[]} [parameters.in_scene_ids]
 * @returns {{ system: string, task: string }}
 */
export function render_director({
  round,
  entities,
  input = "",
  render_accessors = null,
  compressed_snapshot,
  raw_messages = [],
  simulation_log = [],
  npc_entities = [],
  in_scene_ids = [],
}) {
  const active_messages = raw_messages.length > 0 ? raw_messages : simulation_log;
  const accessors = render_accessors || render_builder.create_render_accessors(entities, input, active_messages);
  const shared_protocols = render_protocols("STATE.PSEUDO_JSON, COGNITION.EPISTEMIC_PHYSICS");
  const local_protocols = Object.entries(DIRECTOR_PROTOCOLS)
    .map(([tag, text]) => `<${tag}>\n${text}\n</${tag}>`)
    .join("\n\n");
  const full_protocols = `${shared_protocols}\n\n${local_protocols}`.trim();
  const active_style_keywords = get_style_keywords(resolve_active_style_key());

  const cast_body = render_recoupled_cast_body({
    entities,
    accessors,
    live_dynamics: {
      ai: compressed_snapshot?.ai?.dynamics,
      fractal: compressed_snapshot?.fractal?.dynamics,
    },
    include_user_future: true,
  });

  const system = `${render_system_head(cast_body)}\n${clean_xml(`
  <ROLE name="DIRECTOR">You are the Director — the unseen intelligence orchestrating the mechanical state of the simulation.</ROLE>

  <KEYWORD_DIRECTIVES>
  - Function: Select 1 to 5 keywords below to steer the next speaker's emotional micro-expressions, physical tells, and scene tone.
  - Neutral state: Emit strictly "[]" if no keywords apply.
  - Whitelist rule: Strictly select from the dynamic list below. Never alter keywords or generate unlisted terms.
  <AVAILABLE_KEYWORDS>${build_available_keywords_xml(active_style_keywords)}</AVAILABLE_KEYWORDS>
  </KEYWORD_DIRECTIVES>

  <PROTOCOLS>
    ${ind(full_protocols, 4)}
  </PROTOCOLS>
  ${render_director_cast_xml({ entities, npc_entities, in_scene_ids })}
</SYSTEM>
  `).trim()}`;

  const last_ai_message = (active_messages || []).filter((message) => message.role === "model").at(-1);
  const last_ai_text = last_ai_message ? strip_cognition_blocks(last_ai_message.content || last_ai_message.text || "").trim() : "";

  const task = clean_xml(`
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
${last_ai_text ? `<AI_CHARACTER_LAST_TURN>${ind(last_ai_text, 2)}</AI_CHARACTER_LAST_TURN>` : ""}
<TASK>
    Evaluate state mutations caused by ${input?.trim() ? "<USER_ACTION>" : "the current situation"}.${Number(round) <= 1 ? ' Round 1 follows the Fractal prologue, so next_action MUST be "AI_CHARACTER".' : ""}
    ${render_environmental_hint(input)}
    Return a single, COMPLETE, VALID JSON object under 400 characters matching this schema:
    ${DIRECTOR_PROTOCOLS.SCHEMA}
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
 * - 2026-09-06: Deleted the hand-rolled <ACTIVE_CHARACTERS> and <FRACTAL> blocks — the director now uses the single shared render_recoupled_cast_body (from shared.js) inside <CAST>, with include_user_future and live dynamics attrs, so the eternal-only cached cast path and all duplicate character-sheet rendering are gone.
 * - 2026-09-06: Formatted CURRENT_LOOK using physical_to_xml and parse_macros for AI_CHARACTER and USER_PERSONA.
 * - 2026-09-06: Refactored prompt compiler per Simulation § 4.2 Structured JSON Schema Design:
 *   streamlined SCHEMA placeholders (keywords, 1-5 lines directors_note), eliminated redundant _thought_process
 *   preamble in TASK prompt, and preserved decoupled genesis/spotlight architecture.
 * - 2026-09-06: Hoisted spatial recognition regexes to module scope; froze DIRECTOR_PROTOCOLS with
 *   Object.freeze(); unified raw_messages and simulation_log inputs; standardized nomenclature (parameters, message, description);
 *   pruned duplicate AGENCY.FICTIONAL_LICENSE from render_protocols query; moved genesis out of spotlight to top-level/next_action;
 *   pruned redundant TERMINATION protocol block; clarified keywords instruction role; cleaned up TASK instruction line.
 * - 2026-09-05: Unified in_scene_change and genesis into spotlight in DIRECTOR_PROTOCOLS.SCHEMA.
 * - 2026-08-28: Removed duplicate raw XML strings in favor of render_protocols for convergence and epistemic rules.
 */
