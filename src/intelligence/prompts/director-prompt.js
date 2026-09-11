/**
 * src/intelligence/prompts/director-prompt.js
 * 📐 SHOT 1 (DIRECTOR) PROMPTS — Quick Shot Prompt Compiler & Schema
 *
 * Dedicated prompt generator for Shot 1 (Director):
 * - DIRECTOR_PROTOCOLS.SCHEMA (canonical schema definition)
 * - DIRECTOR_PROTOCOLS (director-specific operational laws)
 * - render_director (Director system & task prompt compiler)
 * - render_terse_director_task (Fast-path recovery task on retry)
 */

import { get_style_keywords, resolve_active_style_key, render_narrative_style_xml } from "@data";
import { ind, escape_xml, clean_xml, strip_cognition_blocks } from "@utils";
import { build_available_keywords_xml, render_dynamics_block } from "./physics-prompt.js";
import { render_builder } from "./builder.js";
import { render_protocols } from "./shared.js";
import { render_entity_sheets, get_prompt_mode } from "./interaction-prompt.js";

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

  SELECTABLE_OPTIONS: `Entity fields may contain alternation syntax like {Option A|Option B}. These are SELECTABLE CHOICES. When you emit state mutations (state_append / vector_append / present / eternal), resolve each such field to exactly ONE option that best fits the narrative. Never echo braces or pipes into any emitted value, and never blend options.`,
});

// ── 2. Scene Spotlight & Cast Summary ─────────────────────────────────────────

const _cast_summary = (npc) => {
  const desc = String(npc?.description || npc?.eternal?.non_physical || npc?.present?.non_physical || "")
    .replace(/\s+/g, " ")
    .trim();
  return desc.length > 130 ? `${desc.slice(0, 130).trim()}…` : desc;
};

/**
 * Renders the Stage Spotlight XML block for the Director prompt: active in-scene
 * participants, candidate secondaries (off-screen), speaker routing rules, and
 * convergence laws. Per-entity relationships live in the <STORY_ENTITIES> sheets
 * as <DISPOSITION> elements (see interaction-prompt.js), not here.
 * @param {Object} [params]
 * @param {any} [params.entities]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @returns {string}
 */
export function render_scene_spotlight_xml({ entities = {}, npc_entities = [], in_scene_ids = [] } = {}) {
  const active_trio_ids = new Set([entities?.AI?.id, entities?.USER?.id, entities?.FRACTAL?.id].filter(Boolean).map(String));
  const in_scene_set = new Set((in_scene_ids || []).filter(Boolean).map(String));

  // Build active participant list
  const active_participants = [];
  if (entities?.AI?.name) active_participants.push(`- ${escape_xml(entities.AI.name)}: Primary Companion (In-Scene)`);
  if (entities?.USER?.name) active_participants.push(`- ${escape_xml(entities.USER.name)}: Protagonist (In-Scene)`);

  const candidate_secondaries = [];

  for (const n of npc_entities || []) {
    if (!n || active_trio_ids.has(String(n.id))) continue;
    const is_in_scene = in_scene_set.has(String(n.id));
    const summary = _cast_summary(n);
    const summary_suffix = summary ? `: ${escape_xml(summary)}` : "";
    if (is_in_scene) {
      active_participants.push(`- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}) [In-Scene]${summary_suffix}`);
    } else {
      candidate_secondaries.push(`- ${escape_xml(n.name)} (id: ${escape_xml(String(n.id))}) [Off-Screen (Stasis)]${summary_suffix}`);
    }
  }

  const candidate_section = candidate_secondaries.length > 0 ? `\n\nCANDIDATE SECONDARY CHARACTERS:\n${candidate_secondaries.join("\n")}` : "";

  return `<SCENE_SPOTLIGHT>
SPEAKER ROUTING RULES:
- "AI_CHARACTER": (Default) AI companion reacts to the protagonist.
- "FRACTAL": User action is non-verbal and environmental (exploring atmosphere, architecture, weather, objects without dialogue) or to break up long streaks of AI speech.
- "npc:<id>": An active in-scene secondary character takes the floor.
- "GENESIS": A new character is introduced into the world. Only mint if no existing candidate applies.

CONVERGENCE & CAST LAW:
Always inspect candidate secondary characters below before minting a duplicate. If an existing cast member matches the required role or location (medical, security, merchant), you MUST use that existing entity rather than inventing a duplicate.

ACTIVE IN-SCENE PARTICIPANTS:
${active_participants.join("\n")}${candidate_section}
</SCENE_SPOTLIGHT>`;
}

// ── 3. Director Prompt Compiler (Shot 1) ──────────────────────────────────────

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

  const config = get_prompt_mode("director");
  const entity_sheets = render_entity_sheets({
    entities,
    npc_entities,
    in_scene_ids,
    accessors,
    config,
    is_npc: false,
    speaker_dynamics: compressed_snapshot?.ai?.dynamics,
    fractal_dynamics: compressed_snapshot?.fractal?.dynamics,
  });

  const system = clean_xml(`
<SYSTEM mode="director">
  <ROLE name="DIRECTOR">You are the Director — the unseen intelligence orchestrating the mechanical state of the simulation.</ROLE>
  ${ind(render_dynamics_block(), 2)}
  ${render_narrative_style_xml()}
${entity_sheets}

  <KEYWORD_DIRECTIVES>
  - Function: Select 1 to 5 keywords below to steer the next speaker's emotional micro-expressions, physical tells, and scene tone.
  - Neutral state: Emit strictly "[]" if no keywords apply.
  - Whitelist rule: Strictly select from the dynamic list below. Never alter keywords or generate unlisted terms.
  <AVAILABLE_KEYWORDS>${build_available_keywords_xml(active_style_keywords)}</AVAILABLE_KEYWORDS>
  </KEYWORD_DIRECTIVES>

  <PROTOCOLS>
    ${ind(full_protocols, 4)}
  </PROTOCOLS>

  ${render_scene_spotlight_xml({ entities, npc_entities, in_scene_ids })}
</SYSTEM>
  `).trim();

  const last_ai_message = (active_messages || []).filter((message) => message.role === "model").at(-1);
  const last_ai_text = last_ai_message ? strip_cognition_blocks(last_ai_message.content || last_ai_message.text || "").trim() : "";

  const task = clean_xml(`
<ROUND>${escape_xml(String(round))}</ROUND>
${input?.trim() ? `<USER_ACTION>${ind(input, 2)}</USER_ACTION>` : ""}
${last_ai_text ? `<AI_CHARACTER_LAST_TURN>${ind(last_ai_text, 2)}</AI_CHARACTER_LAST_TURN>` : ""}
<TASK>
    Evaluate state mutations caused by ${input?.trim() ? "<USER_ACTION>" : "the current situation"}.${Number(round) <= 1 ? ' Round 1 follows the Fractal prologue, so next_action MUST be "AI_CHARACTER".' : ""} "USER_PERSONA" is never a valid next_action — it is a memory-caretaker target only; the Director never speaks for the player.
    ${render_environmental_hint(input)}
    Return a single, COMPLETE, VALID JSON object under 400 characters matching this schema:
    ${DIRECTOR_PROTOCOLS.SCHEMA}
</TASK>
  `).trim();

  return { system, task };
}

// ── 4. Terse Director Recovery Task ───────────────────────────────────────────

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
 * - 2026-09-10: `get_prompt_mode` now comes from interaction-prompt.js (the mode
 *   registry owner) instead of story-prompt.js, removing the Shot-1 → Shot-2 import.
 * - 2026-09-10: Moved render_scene_spotlight_xml + its _cast_summary helper here
 *   from shared.js — the Director is their only consumer.
 * - 2026-09-10: Entity-sheet unification. The director now compiles its <CAST> via the
 *   shared render_entity_sheets (interaction-prompt.js) wrapped in <STORY_ENTITIES>, driven
 *   by the `director` mode's `sheets` config. <ROLE name="DIRECTOR"> moved directly under
 *   <SYSTEM>; per-entity flat dynamics attrs were promoted to <DYNAMIC_AXES> inside the
 *   AI_CHARACTER/FRACTAL sheets (the single <DYNAMICS> legend kept for calibration); the
 *   spotlight's relational mesh is gone (per-entity <DISPOSITIONS> replace it). The legacy
 *   render_recoupled_cast_body / render_system_head / render_director_cast_xml path is deleted.
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
 * - 2026-09-04: Added SELECTABLE_OPTIONS protocol for {A|B} state mutations; clarified "USER_PERSONA" is never a valid next_action (memory-caretaker target only).
 */
