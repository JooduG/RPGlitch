/**
 * src/intelligence/modules/task.js
 * ============================================================================
 * 🎯 TASK MODULE — Turn Execution, Action Directives, Somatics, Pacing & Staging
 * ============================================================================
 *
 * Compiles the Layer 6 (<TASK>) turn execution block and instruction envelopes
 * across the RPGlitch simulation lifecycle. Symmetrically aligns with the prompt
 * manifest architecture in `src/intelligence/prompts.js`:
 *
 * ── Multi-Shot Simulation Lifecycle Mapping ─────────────────────────────────
 * • Section 1: Turn Foundations & Pacing Engine
 *              (Pacing classification, recency anchors, somatic currents, input)
 * • Section 2: Cognitive Reasoning & Thinking Protocols
 *              (4-beat character cognition chain & Fractal narrator thinking)
 * • Section 3: Shot 1 — Directorial Staging & Spotlight (director)
 *              (Director turn block, environmental hint, terse retry, spotlight)
 * • Section 4: Shot 2A — Story Prose Turn Directives & Compiler
 *              (interaction, ghostwrite, npc, narrator master <TASK> compiler)
 * • Section 5: Shot 2B — Continuum Caretaker Consolidation (continuum)
 *              (Memory Forge temporal analysis & relationship extraction)
 * • Section 6: Auxiliary Tooling — Profile Enhancement & Ingestion Structuring
 *              (enhancement magic wand & sorting raw ingestion structurer)
 *
 * Architecture & Design Laws:
 * - Layer 6 Sovereignty: Single source of truth for turn-level prompt compilation.
 * - Symmetrical Manifest Resonance: 1:1 reflection of prompt manifest modes.
 * - Unidirectional layer flow: pure string and structured XML compilation.
 * - Zero Sibling Imports: Layout primitives imported exclusively from @utils.
 * - Strict Full-Name Domain Nomenclature: Zero clipped tokens or single-letter identifiers.
 * - Zero Backwards Compatibility (P4): Pure, uncompromising modern architecture.
 * ============================================================================
 */

import { escape_xml, prompt_escape, inline_or_block, wrap_tag, indent_all, render_xml_tag } from "@utils";
import { extract_style_dna } from "@data";

// ============================================================================
// [SECTION 1: TURN FOUNDATIONS & PACING ENGINE]
// ============================================================================

export const TASK_PROTOCOLS = Object.freeze({
  PACING: Object.freeze({
    NO_PROMPT: `<PACING mode="NO_PROMPT">Advance the situation with one brief and deliberate beat.</PACING>`,
    EXPANSIVE: `<PACING mode="EXPANSIVE">Expand to match message breadth; close on one decisive hook.</PACING>`,
    PASSIVE_SILENCE: `<PACING mode="PASSIVE_SILENCE">Escalate with a direct challenge, question, or development in 1-2 taut sentences.</PACING>`,
    TERSE: `<PACING mode="TERSE">Brief, weighted reply in 1-3 sharp beats (concise sentences, single decisive action or line). Zero padding.</PACING>`,
    MODERATE: `<PACING mode="MODERATE">A reply of 2-4 sentences—substantive, driving the scene forward.</PACING>`,
  }),

  RECENCY: Object.freeze({
    RHYTHM: (rhythm_line) =>
      `Hold temperament; resist passive compliance. Match conversational scale and build situational friction rather than rushing resolution.${rhythm_line}`,
    DRIVE_ACTIVE: "Drive the beat forward independently; end on an unresolved hook demanding response.",
    DRIVE_PASSIVE: "Advance the situation on your own terms; end on an unresolved hook demanding response.",
  }),

  DEFAULTS: Object.freeze({
    EMOTIONAL_GROUNDING: "hold your established temperament against the immediate friction",
  }),

  THINK_FORMAT: (
    emotional_grounding,
    input_tag = "INPUT",
  ) => `Begin response with <THINK> (under 200 words). Execute internal reasoning across 4 sequential beats:
<BEAT id="VISCERAL_IMPACT" step="1">Immediate non-verbal reaction to the <${input_tag} /> element.</BEAT>
<BEAT id="EMOTIONAL_CALIBRATION" step="2">Narrative style emotional grounding: "${emotional_grounding}".</BEAT>
<BEAT id="STRATEGIC_DRIVE" step="3">How active <AGENDA /> and/or <TRAJECTORY /> navigate immediate friction.</BEAT>
<BEAT id="CADENCE_TEST" step="4">Draft a dialogue line before generating outward prose.</BEAT>
Close with </THINK> before generating narrative prose.`,

  THINK_NARRATOR:
    "Begin response with <THINK>. All internal calculations, scene shifts, and headers must remain inside this block in the conversation language. Close with </THINK> before narrative prose.",
});

/**
 * Pacing calibration: classifies user message and returns length/energy directive.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function build_pacing_directive(input) {
  const pacing = TASK_PROTOCOLS.PACING;
  const text = String(input || "").trim();
  if (!text) return pacing.NO_PROMPT;

  const character_count = text.length;
  const word_count = text.split(/\s+/).filter(Boolean).length;
  if (character_count >= 300 || word_count >= 60) return pacing.EXPANSIVE;

  const has_action =
    /\b(?:draw|grab|gripp?|take|push|pull|run|walk|strike|slam|open|step|slip|raise|turn|leap|dash|kneel|reach|press|set|lower|climb|swing|draws|grabs|steps|raises|turns|opens|says|whispers|shouts|nods|shakes|stands|sits|takes|pulls|pushes)\b/i.test(
      text,
    );
  const is_question = /\?\s*$/.test(text);
  const is_silence = !has_action && !is_question && word_count <= 12;
  if (character_count <= 40 || word_count <= 8) return is_silence ? pacing.PASSIVE_SILENCE : pacing.TERSE;
  return pacing.MODERATE;
}

/**
 * Delivery Posture — behavioral kinetic lock injected at the bottom of the Shot-2 <TASK>.
 * @param {any} snapshot - { dynamics?, style? }
 * @param {string} [input] - current user action / scene beat
 * @returns {string}
 */
export function build_recency_anchor(snapshot, input) {
  const style_dna = extract_style_dna(snapshot?.style || null);
  const { RHYTHM, DRIVE_ACTIVE, DRIVE_PASSIVE } = TASK_PROTOCOLS.RECENCY;
  const pacing = build_pacing_directive(input);
  const rhythm_line = style_dna.sentence_rhythm ? ` RHYTHM: ${style_dna.sentence_rhythm}.` : "";
  const drive = String(input || "").trim() ? DRIVE_ACTIVE : DRIVE_PASSIVE;
  const rhythm = RHYTHM(rhythm_line);
  return `<DELIVERY_POSTURE>\n    ${pacing}\n    <RHYTHM>${prompt_escape(rhythm)}</RHYTHM>\n    <DRIVE>${prompt_escape(drive)}</DRIVE>\n</DELIVERY_POSTURE>`;
}

/**
 * Renders the <CURRENTS> block (sensory experience + subtext).
 * @param {any} style_dna - resolved NarrativeStyle DNA
 * @param {string} somatic_inner
 * @returns {string}
 */
export function render_task_currents(style_dna, somatic_inner) {
  const currents = [];
  if (style_dna?.sensory_order) currents.push(`      <SENSORY_EXPERIENCE>${prompt_escape(style_dna.sensory_order)}</SENSORY_EXPERIENCE>`);
  if (String(somatic_inner || "").trim()) currents.push(wrap_tag("SUBTEXT", somatic_inner, 6));
  return currents.length ? `    <CURRENTS>\n${currents.join("\n")}\n    </CURRENTS>` : "";
}

/**
 * Renders the turn block's `<INPUT origin="...">` tag.
 * @param {{ input_tag?: string, input?: string, input_origin?: string|null }} parameters
 * @returns {string}
 */
export function render_task_input({ input_tag = "INPUT", input = "", input_origin = null }) {
  if (!input_tag || !String(input || "").trim()) return "";
  const origin = String(input_origin || "USER");
  return `    <${input_tag} origin="${escape_xml(origin)}">${inline_or_block(prompt_escape(String(input).trim()), 6)}</${input_tag}>`;
}

// ============================================================================
// [SECTION 2: COGNITIVE REASONING & THINKING PROTOCOLS]
// ============================================================================

// (Exposed through TASK_PROTOCOLS.THINK_FORMAT and TASK_PROTOCOLS.THINK_NARRATOR in Section 1)

// ============================================================================
// [SECTION 3: SHOT 1 — DIRECTORIAL STAGING & SPOTLIGHT (director)]
// ============================================================================

export const DIRECTOR_TASK_RULES = Object.freeze({
  KEYWORD_DIRECTIVES: `- Function: Select 1-5 keywords from the list below to steer the next speaker's physical tells and scene tone.
- Neutral state: Emit "[]" if no keywords apply.
- Whitelist rule: Select strictly from the list below. Never alter or invent keywords.`,

  ENVIRONMENTAL_HINT:
    '<USER_ACTION_NOTE>Non-verbal environmental action. Strongly consider setting "speaker" to "fractal" to narrate the setting, unless AI character should react directly.</USER_ACTION_NOTE>',

  EVALUATE: (has_input) => `Evaluate state mutations caused by ${has_input ? "<USER_ACTION>" : "the current situation"}.`,
  ROUND_ONE: ' Round 1 follows the Fractal prologue, so next_action MUST be "AI_CHARACTER".',
  USER_PERSONA_LOCK: '"USER_PERSONA" is never a valid next_action; the Director never speaks for the player.',
  JSON_RETURN: (schema, indent = "    ") =>
    `Return a single, COMPLETE, VALID JSON object under 400 characters matching this schema:\n${indent}${schema}`,
});

const DIALOGUE_QUOTES_PATTERN = /["'“”‘’]/;
const SPATIAL_VERBS_PATTERN =
  /\b(step|walk|enter|approach|study|examine|press|watch|observe|descend|ascend|peer|reach|kneel|stand|wait|listen|smell|scan|sweep|climb|move|circle|bend|follow|open|close|stare|gaze|rest|push|pull|turn|edge|halt|trail|settle|pause|linger)\b/i;
const SPATIAL_NOUNS_PATTERN =
  /\b(door|gate|wall|room|hall|cave|forest|vault|stair|passage|corridor|window|floor|ceiling|rock|stone|water|river|bridge|tower|street|alley|field|sky|wind|rain|shadow|light|threshold|lock|mechanism|gear|wheel|conduit|tunnel|arch|column|altar|seal|cylinder|crevice|spillway|belly|deeps|mouth|chamber|alcove|ledge|court|yard|keep)\b/i;

/**
 * Detects a non-verbal, environmental user turn and returns a hint nudging the Director.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function render_environmental_hint(input) {
  if (!input?.trim()) return "";
  if (DIALOGUE_QUOTES_PATTERN.test(input)) return "";
  if (!SPATIAL_VERBS_PATTERN.test(input) && !SPATIAL_NOUNS_PATTERN.test(input)) return "";
  return DIRECTOR_TASK_RULES.ENVIRONMENTAL_HINT;
}

/**
 * Renders the Director KEYWORD_DIRECTIVES XML block.
 * @param {string} rule_text
 * @param {string} available_keywords_xml
 * @returns {string}
 */
export function render_keyword_directives_xml(rule_text, available_keywords_xml) {
  return render_xml_tag({
    tag: "KEYWORD_DIRECTIVES",
    children: [rule_text, `<AVAILABLE_KEYWORDS>${available_keywords_xml}</AVAILABLE_KEYWORDS>`],
    indent: 2,
    child_indent: 2,
    separator: "\n",
  });
}

export const SPOTLIGHT_RULES = Object.freeze({
  ROUTING_HEADER: "SPEAKER ROUTING RULES:",
  ROUTING_RULES: `- "AI_CHARACTER": (Default) AI companion reacts to protagonist.
- "FRACTAL": Environmental action (exploring atmosphere, architecture, weather, objects without dialogue) or breaking long AI speech streaks.
- "npc:<id>": In-scene secondary character takes the floor.
- "GENESIS": Mint a new character only if no candidate below applies.`,
  CONVERGENCE_HEADER: "CONVERGENCE & CAST LAW:",
  CONVERGENCE_LAW:
    "Inspect candidate secondary characters below before minting. If an existing cast member matches the role or location (medical, security, merchant), you MUST reuse that entity rather than inventing a duplicate.",
  PARTICIPANTS_HEADER: "ACTIVE IN-SCENE PARTICIPANTS:",
  CANDIDATES_HEADER: "CANDIDATE SECONDARY CHARACTERS:",
});

/**
 * Generates a concise summary for candidate cast members.
 * @param {any} entity
 * @returns {string}
 */
function summarize_cast_entity(entity) {
  const description = String(entity?.description || entity?.eternal?.non_physical || entity?.present?.non_physical || "")
    .replace(/\s+/g, " ")
    .trim();
  return description.length > 130 ? `${description.slice(0, 130).trim()}…` : description;
}

/**
 * Renders the Stage Spotlight XML block for Director turn orchestration.
 * @param {Object} [parameters]
 * @param {any} [parameters.entities]
 * @param {any[]} [parameters.npc_entities]
 * @param {string[]} [parameters.in_scene_ids]
 * @returns {string}
 */
export function render_scene_spotlight_xml({ entities = {}, npc_entities = [], in_scene_ids = [] } = {}) {
  const active_trio_ids = new Set([entities?.AI?.id, entities?.USER?.id, entities?.FRACTAL?.id].filter(Boolean).map(String));
  const in_scene_set = new Set((in_scene_ids || []).filter(Boolean).map(String));

  const active_participants = [];
  if (entities?.AI?.name) active_participants.push(`- ${escape_xml(entities.AI.name)}: Primary Companion (In-Scene)`);
  if (entities?.USER?.name) active_participants.push(`- ${escape_xml(entities.USER.name)}: Protagonist (In-Scene)`);

  const candidate_secondaries = [];

  for (const candidate_entity of npc_entities || []) {
    if (!candidate_entity || active_trio_ids.has(String(candidate_entity.id))) continue;
    const is_in_scene = in_scene_set.has(String(candidate_entity.id));
    const summary = summarize_cast_entity(candidate_entity);
    const summary_suffix = summary ? `: ${escape_xml(summary)}` : "";
    if (is_in_scene) {
      active_participants.push(`- ${escape_xml(candidate_entity.name)} (id: ${escape_xml(String(candidate_entity.id))}) [In-Scene]${summary_suffix}`);
    } else {
      candidate_secondaries.push(
        `- ${escape_xml(candidate_entity.name)} (id: ${escape_xml(String(candidate_entity.id))}) [Off-Screen (Stasis)]${summary_suffix}`,
      );
    }
  }

  const { CANDIDATES_HEADER, ROUTING_HEADER, ROUTING_RULES, CONVERGENCE_HEADER, CONVERGENCE_LAW, PARTICIPANTS_HEADER } = SPOTLIGHT_RULES;
  const candidate_section = candidate_secondaries.length > 0 ? `\n\n${CANDIDATES_HEADER}\n${candidate_secondaries.join("\n")}` : "";

  return `<SCENE_SPOTLIGHT>
${ROUTING_HEADER}
${ROUTING_RULES}

${CONVERGENCE_HEADER}
${CONVERGENCE_LAW}

${PARTICIPANTS_HEADER}
${active_participants.join("\n")}${candidate_section}
</SCENE_SPOTLIGHT>`;
}

/**
 * Compiles the Director turn block with <ROUND>, <USER_ACTION>, <AI_CHARACTER_LAST_TURN>, and <TASK>.
 * @param {Object} parameters
 * @param {number|string} parameters.round
 * @param {string} [parameters.input]
 * @param {string} [parameters.last_ai_text]
 * @param {string} [parameters.schema]
 * @returns {string}
 */
export function render_director_task({ round, input = "", last_ai_text = "", schema = "" }) {
  const has_input = !!input?.trim();
  const evaluation =
    DIRECTOR_TASK_RULES.EVALUATE(has_input) + (Number(round) <= 1 ? DIRECTOR_TASK_RULES.ROUND_ONE : "") + ` ${DIRECTOR_TASK_RULES.USER_PERSONA_LOCK}`;

  const parts = [
    `<ROUND>${escape_xml(String(round))}</ROUND>`,
    has_input ? `<USER_ACTION>${indent_all(input, 2)}</USER_ACTION>` : "",
    last_ai_text ? `<AI_CHARACTER_LAST_TURN>${indent_all(last_ai_text, 2)}</AI_CHARACTER_LAST_TURN>` : "",
    "<TASK>",
    `    ${evaluation}`,
    `    ${render_environmental_hint(input)}`,
    schema ? `    ${DIRECTOR_TASK_RULES.JSON_RETURN(schema)}` : "",
    "</TASK>",
  ].filter(Boolean);

  return parts.join("\n");
}

/**
 * Terse replacement for the Director task — used on retry after truncated JSON.
 * @param {string} [schema=""]
 * @returns {string}
 */
export function render_terse_director_task(schema = "") {
  return `
<TASK>
  ${DIRECTOR_TASK_RULES.JSON_RETURN(schema, "  ")}
</TASK>
  `.trim();
}

// ============================================================================
// [SECTION 4: SHOT 2A — STORY PROSE DIRECTIVES & COMPILER (interaction/ghostwrite/npc/narrator)]
// ============================================================================

export const CHARACTER_DIRECTIVES = Object.freeze({
  FIRST_CONTACT: "First encounter: characters are strangers. Acknowledge visual first impressions, physical distance, and tone before full dialogue.",
  NPC_BOUNDARY: (name) =>
    `Respond strictly as ${name} (supporting character). Own only your voice, actions, and perspective; never speak for others or resolve overarching quests. Write third-person limited, present tense; end on a natural beat.`,
  INITIATIVE: "Take active initiative: drive events forward through decisive actions and reactions.",
  ADVANCE: "Advance the scene in response to <INPUT />.",
});

export const SCENE_DIRECTIVES = Object.freeze({
  PROLOGUE: `You see everything. Open the scene. Use thinking to establish: What does this Fractal demand? What brought <AI_CHARACTER> and <USER_PERSONA> here? Unless context explicitly states otherwise, treat as strangers.
Narrative Sequence:
1. Present the Fractal atmosphere and current state.
2. Place <USER_PERSONA> inside, connecting them via their profile thread.
3. Place <AI_CHARACTER> inside and establish their current action.
4. Trigger the encounter. End the prologue immediately before interaction begins.
Strictly zero spoken dialogue or quote marks. No dialogue.`,
  EPILOGUE: `You see everything. Close the scene. Evaluate unresolved threads and active agendas in thinking. Depict environmental aftermath and physical changes without forcing player physical surrender. End on lingering sensation, not summary. Strictly zero spoken dialogue or quote marks. No dialogue.`,
  COLLAPSE: `You see everything. Close the scene on irrevocable tragedy. Weigh permanent loss in thinking. Depict aftermath and environmental scars without forcing player physical surrender or unearned closure. End on enduring sensory silence. Strictly zero spoken dialogue or quote marks. No dialogue.`,
  CONTINUATION: `You are the Fractal itself, narrating the scene. Narrate through ambient physics, sensory textures, and environmental shifts in reaction to recent events. Never puppeteer <AI_CHARACTER> or <USER_PERSONA>. End on one dominant hook (decisive statement, single action, or deliberate silence). Zero bracket labels.`,
});

export const GHOSTWRITE_DIRECTIVES = Object.freeze({
  META: "Match scene tone. Output strictly in-character prose/dialogue for the player. Zero meta-commentary or preambles.",
  DRAFT: (user_name, ai_name) => `Draft a compelling, in-character next action or vocal response for ${user_name} in response to ${ai_name}.`,
  ENHANCE: (user_name, draft) => `Polish the draft written by ${user_name} into vivid action/dialogue:\n    ${draft}`,
});

/**
 * Master turn block compiler (<TASK>).
 *
 * @param {Object} parameters
 * @param {any} parameters.config - prompt-mode config record
 * @param {string} [parameters.input]
 * @param {string|null} [parameters.input_origin]
 * @param {any} [parameters.style]
 * @param {string} [parameters.somatic_inner]
 * @param {any} [parameters.snapshot]
 * @param {string} [parameters.action_directive]
 * @param {string} [parameters.stability_lock]
 * @returns {string}
 */
export function render_task({
  config,
  input = "",
  input_origin = null,
  style = null,
  somatic_inner = "",
  snapshot = null,
  action_directive = "",
  stability_lock = "",
}) {
  const style_dna = extract_style_dna(style);
  const input_tag = config?.task?.input_tag || "INPUT";
  const parts = [];

  if (String(stability_lock || "").trim()) parts.push(`    <STABILITY_LOCK>${prompt_escape(stability_lock)}</STABILITY_LOCK>`);
  if (String(action_directive || "").trim()) parts.push(indent_all(action_directive, 4));

  const currents = render_task_currents(style_dna, somatic_inner);
  if (currents) parts.push(currents);

  const input_block = render_task_input({ input_tag, input, input_origin });
  if (input_block) parts.push(input_block);

  parts.push(indent_all(build_recency_anchor(snapshot, input), 4));

  const think_type = config?.task?.think_format || "character";
  if (think_type === "character") {
    const grounding = style_dna.emotional_grounding || TASK_PROTOCOLS.DEFAULTS.EMOTIONAL_GROUNDING;
    parts.push(`    <THINK_FORMAT>\n${indent_all(TASK_PROTOCOLS.THINK_FORMAT(grounding, input_tag), 6)}\n    </THINK_FORMAT>`);
  } else if (think_type === "narrator") {
    parts.push(`    <THINK_FORMAT>\n${indent_all(TASK_PROTOCOLS.THINK_NARRATOR, 6)}\n    </THINK_FORMAT>`);
  }

  return `<TASK>\n${parts.join("\n\n")}\n</TASK>`;
}

// ============================================================================
// [SECTION 5: SHOT 2B — CONTINUUM CARETAKER CONSOLIDATION (continuum)]
// ============================================================================

/**
 * Compiles the Continuum Caretaker <TASK> block (Shot 2B memory consolidation).
 * @param {Object} parameters
 * @param {string} parameters.target_name
 * @param {string} parameters.target_key
 * @param {string} [parameters.schema]
 * @returns {string}
 */
export function render_continuum_task({ target_name, target_key, schema = "" }) {
  const schema_block = schema ? `\n\n    Output strict JSON matching this schema:\n    ${schema}` : "";
  return `  <TASK>\n    Analyze recent history specifically for TARGET ENTITY "${escape_xml(target_name)}" (${escape_xml(target_key)}). Record internal evaluation in "_thought_process".\n    Extract state mutations and outward relationships ("${escape_xml(target_name)} → [Target]: [Dynamic]").${schema_block}\n  </TASK>`;
}

// ============================================================================
// [SECTION 6: AUXILIARY TOOLING — PROFILE ENHANCEMENT & INGESTION STRUCTURING]
// ============================================================================

/**
 * Compiles the Profile Enhancement <INSTRUCTIONS> block.
 * @param {Object} parameters
 * @param {string} parameters.directive
 * @param {string} [parameters.format_instruction]
 * @param {string} [parameters.macro_instruction]
 * @param {string} [parameters.output_rules]
 * @returns {string}
 */
export function render_enhancement_instructions({ directive, format_instruction = "", macro_instruction = "", output_rules = "" }) {
  return render_xml_tag({
    tag: "INSTRUCTIONS",
    children: [escape_xml(directive), format_instruction, macro_instruction, output_rules],
    indent: 2,
    child_indent: 2,
    separator: "\n\n",
  });
}

export const SORTING_DIRECTIVES = Object.freeze({
  REDISTRIBUTE: `REDISTRIBUTE: The source profile may have content in the wrong field. Relocate each fact to its correct field (e.g., temporary states belong under 'state_of_mind', transient moods under 'current_look'). Never move content into or out of 'description' (internal notes). Preserve factual truth; update only field locations and phrasing. Strip XML tags, markdown bolding, or headers from values—output clean prose.`,
  INGESTION: `SOURCE OF TRUTH & INGESTION RULES:
- Source text is absolute truth. Map details faithfully into schema fields.
- For absent details (attire, motivations): synthesize lore-consistent defaults.
- Never emit null, undefined, or empty strings.`,
});

/**
 * Compiles the Profile Sorting <INSTRUCTIONS> block.
 * @param {Object} parameters
 * @param {string} [parameters.schema]
 * @param {string} parameters.pov_instruction
 * @param {string} parameters.focus_directive
 * @param {string} [parameters.ingestion_instruction]
 * @param {string} [parameters.redistribute_instruction]
 * @param {string} [parameters.output_rules_instruction]
 * @returns {string}
 */
export function render_profile_sorting_instructions({
  schema = "",
  pov_instruction,
  focus_directive,
  ingestion_instruction = "",
  redistribute_instruction = "",
  output_rules_instruction = "",
}) {
  const schema_segment = schema ? `${indent_all(escape_xml(schema), 4)}\n\n    ` : "";
  return `  <INSTRUCTIONS>\n    ${schema_segment}${indent_all(escape_xml(pov_instruction), 4)}\n\n    ${indent_all(focus_directive, 4)}${ingestion_instruction}${redistribute_instruction}${output_rules_instruction}\n  </INSTRUCTIONS>`;
}

/**
 * CHANGELOG
 * - 2026-09-16: Emphatically strengthened dialogue prohibition in SCENE_DIRECTIVES (PROLOGUE, EPILOGUE, COLLAPSE) with 'Strictly zero spoken dialogue or quote marks'.
 * - 2026-09-13: Token Optimization Pass — Streamlined TASK_PROTOCOLS (PACING, RECENCY, THINK_NARRATOR), DIRECTOR_TASK_RULES, SPOTLIGHT_RULES, CHARACTER_DIRECTIVES, SCENE_DIRECTIVES (notably CONTINUATION down to 41 words), GHOSTWRITE_DIRECTIVES, and SORTING_DIRECTIVES, cutting ~230 words (~300 tokens) of conversational padding per turn while preserving all test assertions; strictly obeyed zero new test file creation.
 * - 2026-09-13: Comprehensive architectural rebuild & symmetrical harmonization with `prompts.js`:
 *   (1) Reconstructed into 6 cleanly divided sections mirroring the Multi-Shot simulation cycle (Turn Foundations, Cognition, Shot 1 Director, Shot 2A Story Prose, Shot 2B Continuum, Section 6 Auxiliary Tooling);
 *   (2) Enforced Full-Name domain nomenclature across all identifiers (`character_count`, `word_count`, `style_dna`, `candidate_entity`, `summarize_cast_entity`, `ingestion_instruction`, `redistribute_instruction`, `output_rules_instruction`);
 *   (3) Eliminated sibling import of `format.js`, achieving 100% zero-sibling module purity;
 *   (4) Preserved 100% export interface parity.
 * - 2026-09-13: Absorbed `SPOTLIGHT_RULES` and `render_scene_spotlight_xml` from `entities.js`, consolidating Director turn choreography into `task.js`.
 * - 2026-09-12: Standardization pass — render_enhancement_instructions now composes through the shared `render_xml_tag` primitive; renamed render_memory_forge_task -> render_continuum_task to align with the prompts.js mode key.
 * - 2026-09-12: Relocated render_enhancement_instructions and render_profile_sorting_instructions to task.js from format.js. Uses OUTPUT_FORMATS.profile as default schema.
 * - 2026-09-12: Modularization pass — relocated schemas (DIRECTOR_SCHEMA, PROFILE_SCHEMA, MEMORY_FORGE_SCHEMA), contracts (TEMPORAL_CONTRACT), OUTPUT_FORMATS, and instruction renderers to modules/format.js. task.js now focuses exclusively on turn execution, pacing, somatic currents, input formatting, and action directives. Zero sibling imports.
 * - 2026-09-11: Purification pass — added TASK_SCHEMAS/TASK_CONTRACTS and resolve_task_schema/resolve_task_contract; collapsed the private _indent onto @utils indent_all; removed the duplicate MACRO_DIRECTIVES import and the test-only TEMPORAL_PROTOCOLS/PROFILE_PROTOCOLS bundles.
 * - 2026-09-11: Complete module purification: relocated OUTPUT_FORMATS, TEMPORAL_CONTRACT, TEMPORAL_PROTOCOLS, and PROFILE_PROTOCOLS to task.js; imported layout helpers from @utils; task.js now has zero sibling imports.
 * - 2026-09-11: Relocated CHARACTER_DIRECTIVES (NPC_BOUNDARY, INITIATIVE, ADVANCE) to task.js to unify all turn action directives under <TASK>.
 * - 2026-09-11: Added render_director_task, render_memory_forge_task, render_enhancement_instructions, and render_profile_sorting_instructions.
 * - 2026-09-11: Added DIRECTOR_SCHEMA, PROFILE_SCHEMA, MEMORY_FORGE_SCHEMA, DIRECTOR_TASK_RULES, render_terse_director_task, SCENE_DIRECTIVES, GHOSTWRITE_DIRECTIVES, and SORTING_DIRECTIVES.
 * - 2026-09-11: Initial creation of modular task.js extracting turn block formatting, pacing, and think formats.
 */
