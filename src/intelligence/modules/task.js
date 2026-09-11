/**
 * src/intelligence/modules/task.js
 * ============================================================================
 * 🎯 TASK MODULE — Turn Block, Delivery Posture, Currents & Think Format
 * ============================================================================
 *
 * Compiles the <TASK> turn block across story modes:
 * - Pacing classification and length directives
 * - Dynamic Delivery Posture (<DELIVERY_POSTURE>)
 * - Sensory currents and somatic subtext (<CURRENTS>)
 * - Formatted user/narrative input (<INPUT origin="...">)
 * - Cognitive thinking format (<THINK_FORMAT>)
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation.
 * - Single source of truth for turn-level pacing and delivery calibration.
 * ============================================================================
 */

import { escape_xml, prompt_escape, inline_or_block, wrap_tag, MACRO_DIRECTIVES } from "@utils";
import { extract_style_dna } from "@data";

// ── 0. Output Formats & Templates ─────────────────────────────────────────────

export const OUTPUT_FORMATS = Object.freeze({
  PROSE: `OUTPUT RULES:
- Emit ONLY the field content, as plain prose. No preamble, no commentary.
- Do NOT wrap it in JSON, code fences (e.g. \`\`\`json), XML tags (e.g. <ETERNAL>, <NON_PHYSICAL>), markdown-bold labels (e.g. **PRESENT.NON_PHYSICAL**), backticks, or headers.
- No keys, no labels, no scaffolding — just the text itself.`,
  BRACKETS: `OUTPUT RULES:
- Emit ONLY bracketed [KEY: value] directives, one bracket per line (e.g. [SHIRT: leather jacket], [HELD: lantern]).
- Common keys: SHIRT, PANTS, SHOES, HELD, INJURY, DISGUISE, POSE, INVENTORY.
- Do NOT wrap it in JSON, code fences (e.g. \`\`\`json), XML tags, markdown-bold labels, or headers.
- Return clean brackets only.`,
  ARRAY_APPEND: `OUTPUT RULES:
- Return a JSON array of objects: [{"content": string, "emotional_weight": integer (1-10)}].
- Generate 3-5 NEW distinct memories. Never duplicate a memory already listed in <ENTITY_CONTEXT>.
- Do NOT wrap it in code fences (e.g. \`\`\`json), XML tags, or markdown.
- Return valid JSON only.`,
  ARRAY_SINGLE: `OUTPUT RULES:
- Rewrite exactly this ONE memory. Return either a JSON array containing a single object [{"content": string, "emotional_weight": integer (1-10)}] or a plain text string.
- Never return multiple entries.
- Do NOT wrap it in code fences (e.g. \`\`\`json), XML tags, or markdown.`,
  JSON_OBJECT: `OUTPUT RULES:
- Emit ONLY the requested JSON object, starting with { and ending with }. No preamble, no commentary.
- Do NOT wrap it in code fences (e.g. \`\`\`json), XML tags, or markdown.
- Return valid JSON only.`,
});

// ── 1. Task Protocols & Pacing Presets ────────────────────────────────────────

export const TASK_PROTOCOLS = Object.freeze({
  PACING: Object.freeze({
    NO_PROMPT: `<PACING mode="NO_PROMPT">Advance the situation with one brief and deliberate beat.</PACING>`,
    EXPANSIVE: `<PACING mode="EXPANSIVE">You may expand to match the message's breadth, but still close on one decisive hook.</PACING>`,
    PASSIVE_SILENCE: `<PACING mode="PASSIVE_SILENCE">Do not stall — escalate with a direct probe (a pointed question, a challenge, or an unexpected development) in one or two taut sentences.</PACING>`,
    TERSE: `<PACING mode="TERSE">Match it — a brief, weighted reply of one to three sharp beats (short sentences, a single decisive action or line). Do not pad.</PACING>`,
    MODERATE: `<PACING mode="MODERATE">A reply of a few sentences — long enough for substance, short enough to keep the scene moving.</PACING>`,
  }),

  RECENCY: Object.freeze({
    RHYTHM: (rhythm_line) =>
      `Hold your temperament; resist passive compliance. Match the user's conversational scale—build situational friction deliberately rather than rushing to resolution.${rhythm_line}`,
    DRIVE_ACTIVE: "Drive the beat forward on your own initiative and end on a live, unresolved hook that demands response.",
    DRIVE_PASSIVE: "Push the situation forward on your own terms and end on a live, unresolved hook that demands response.",
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
    "Begin response with <THINK>. ALL internal calculations, scene/atmosphere shifts, and markdown headers MUST remain strictly INSIDE this block. Conduct thinking in the conversation language. Close with </THINK> response before narrative prose.",
});

// ── 2. Output Schemas ─────────────────────────────────────────────────────────

export const DIRECTOR_SCHEMA = `{
  "_thought_process": "<ONE short sentence: tactical intent & state delta>",
  "next_action": "'AI_CHARACTER' (AI speaks) | 'FRACTAL' (Fractal narrates) | 'npc:<id>' (in-scene NPC speaks) | { "genesis": { "name": "<Name>", "description": "<description>" } } (mint brand-new NPC) | 'EPILOGUE_CONCLUDED' (quest won) | 'EPILOGUE_COLLAPSED' (quest lost)",
  "keywords": ["<1-5 keywords from <AVAILABLE_KEYWORDS> or []>"],
  "directors_note": "<1-5 lines of unseen acting/staging directives for the next speaker, or empty string>",
  "dynamics_deltas": { "chaos": 0, "intensity": 0, "openness": 0, "affinity": 0, "velocity": 0, "entropy": 0 },
  "visual_staging": "<optional: 1 line camera & lighting directive ONLY if triggering a scene image shift, else omit>",
  "spotlight": { "enter": ["npc:<id>"], "exit": ["npc:<id>"] }
}`;

export const PROFILE_SCHEMA = `{
  "name": "<Entity name string>",
  "description": "<HUMAN EYES ONLY: internal notes / OOC summary>",
  "signature_color": "<Choose from: Soft Rose, Crimson Red, Deep Indigo, Electric Cyan, Emerald Green, Forest Green, Adrenaline Pink, Lemon Yellow, Toxic Green, Scientific Teal, Space Blue, Pumpkin Amber, Proud Purple, Rusty Orange, Twilight Violet>",
  "appearance": "<Permanent biometric appearance for image generation: build, face, eyes, hair, height, scars>",
  "personality": "<Core timeless psychology: beliefs, drivers, cognitive patterns, vocal tone>",
  "current_look": "<Current physical look: clothing, posture, expression, immediate visible condition>",
  "state_of_mind": "<Current psychological state: immediate pressure, active focus, temporary behavioral driver>",
  "past": ["<3-5 distinct formative memory strings>"],
  "future": "<Single consolidated standing agenda string in active future tense>"
}

- Return a single JSON object starting with { and ending with }. No preamble, no markdown backticks, no external XML tags.
- Field values are CLEAN PROSE ONLY: never embed XML tags (e.g. <ETERNAL>, <NON_PHYSICAL>), markdown-bold labels (e.g. **PRESENT.NON_PHYSICAL**), or structural headers inside any value.`;

export const MEMORY_FORGE_SCHEMA = `{
  "_thought_process": "<one short sentence analyzing recent events for target entity>",
  "target": "'AI_CHARACTER' | 'USER_PERSONA' | 'FRACTAL' | 'NPC_<id>'",
  "eternal": { "physical": "Permanent baseline appearance change or empty string", "non_physical": "Permanent personality shift or empty string" },
  "present": { "physical": "Clean updated current conditions (or empty string if unchanged)", "non_physical": "1-3 sentences of evocative present-tense state of mind matching the entity's register" },
  "future": "2-5 sentences of active future tense standing agenda rewritten from recent events",
  "past": [ { "content": "Durable fact emerged worth keeping (empty list if none)", "type": "past", "emotional_weight": 5 } ],
  "relationships": ["Source → Target: dynamic description"]
}`;

// ── 3. Director Task Rules & Recovery ─────────────────────────────────────────

export const DIRECTOR_TASK_RULES = Object.freeze({
  KEYWORD_DIRECTIVES: `- Function: Select 1 to 5 keywords below to steer the next speaker's emotional micro-expressions, physical tells, and scene tone.
- Neutral state: Emit strictly "[]" if no keywords apply.
- Whitelist rule: Strictly select from the dynamic list below. Never alter keywords or generate unlisted terms.`,

  ENVIRONMENTAL_HINT:
    '<USER_ACTION_NOTE>This turn is a non-verbal, environmental action. Strongly consider setting "speaker" to "fractal" so the scene/setting itself narrates the moment — unless the AI character should react directly.</USER_ACTION_NOTE>',

  EVALUATE: (has_input) => `Evaluate state mutations caused by ${has_input ? "<USER_ACTION>" : "the current situation"}.`,
  ROUND_ONE: ' Round 1 follows the Fractal prologue, so next_action MUST be "AI_CHARACTER".',
  USER_PERSONA_LOCK: '"USER_PERSONA" is never a valid next_action — it is a memory-caretaker target only; the Director never speaks for the player.',
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
 * Terse replacement for the Director task — used on retry after truncated JSON.
 * @returns {string}
 */
export function render_terse_director_task() {
  return `
<TASK>
  ${DIRECTOR_TASK_RULES.JSON_RETURN(DIRECTOR_SCHEMA, "  ")}
</TASK>
  `.trim();
}

// ── 4. Narrative Scene Directives ─────────────────────────────────────────────

export const SCENE_DIRECTIVES = Object.freeze({
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
});

// ── 5. Ghostwriting Directives ────────────────────────────────────────────────

export const GHOSTWRITE_DIRECTIVES = Object.freeze({
  META: "Match the tone of the scene. Output ONLY in-character prose/dialogue suitable for the player's turn. No meta preamble, no out-of-character commentary.",
  DRAFT: (user_name, ai_name) => `Draft a compelling, in-character next action or vocal response for ${user_name} in response to ${ai_name}.`,
  ENHANCE: (user_name, draft) =>
    `Enhance, expand, and polish the following draft written by ${user_name} into vivid, atmospheric action/dialogue:\n    ${draft}`,
});

// ── 6. Character & Turn Action Directives ─────────────────────────────────────

export const CHARACTER_DIRECTIVES = Object.freeze({
  NPC_BOUNDARY: (name) =>
    `Respond strictly as ${name} — a supporting character. Own only your own voice, actions, and perspective: never speak for <USER_PERSONA> or the AI character, and never resolve the overarching story quest on your own. Write third-person limited, present tense, and end on a natural beat.`,
  INITIATIVE:
    "Take active initiative to open or advance the scene. Drive events forward through decisions and reactions without waiting for permission.",
  ADVANCE: "Advance the scene in response to <INPUT />.",
});

// ── 6. Profile Structuring Directives ─────────────────────────────────────────

export const SORTING_DIRECTIVES = Object.freeze({
  REDISTRIBUTE: `REDISTRIBUTE: The source profile may have content in the wrong field. Move each fact to its correct field — e.g. a temporary state written under 'personality' belongs under 'state_of_mind'; a mood written under 'appearance' belongs under 'current_look'. Sort and relocate; do not merely regenerate in place. Never move content into or out of 'description' (internal OOC notes). Preserve the facts; only their location and phrasing may change. Strip any XML tags, markdown-bold field labels, or structural headers from values — they contain only clean prose.`,
  INGESTION: `SOURCE OF TRUTH & INGESTION RULES:
- Source text details are absolute truth. Map them faithfully into corresponding schema fields.
- For absent details (e.g. attire, unstated motivations, physical attributes): synthesize vivid, lore-consistent defaults.
- NEVER emit null, undefined, or empty string values.`,
});

// ── 7. Temporal Continuum Layer Contract & Bundles ───────────────────────────

export const TEMPORAL_CONTRACT = `TEMPORAL LAYER CONTRACT — ETERNAL / PRESENT / FUTURE / PAST
- ETERNAL: Permanent baseline identity, personality traits, and physical form. Permanent narrative transformations update it; transient states belong in PRESENT. Explicit user edits always override.
- PRESENT: Immediate volatile state. "physical" holds active attire, held props, injuries, and disguise via bracketed pseudo-JSON state tags (e.g. [SHIRT: sweater], [HELD: lantern], [INJURY: sprained ankle], [INVENTORY: item1, item2]); "non_physical" holds immediate mindset and emotional state. True only in this moment.
- FUTURE: Single consolidated standing agenda — impending intent, immediate objective, or unresolved tension driving the character forward. Written in active future tense.
- PAST: Settled historical anchors and durable facts. Append new consequential events only; never record transient moods.
- MACROS: Use placeholder macros for entity references — '{{me}}' (self), '{{you}}' (the other primary party), '{{char}}' (AI character), '{{user}}' (user persona), '{{fractal}}' (setting). Never hardcode names.`;

export const TEMPORAL_PROTOCOLS = Object.freeze({
  CONTRACT: TEMPORAL_CONTRACT,
  SCHEMA: MEMORY_FORGE_SCHEMA,
});

export const PROFILE_PROTOCOLS = Object.freeze({
  SCHEMA: PROFILE_SCHEMA,
  MACROS: MACRO_DIRECTIVES,
  SORTING: SORTING_DIRECTIVES,
  OUTPUT_FORMATS: OUTPUT_FORMATS,
});

// ── 7. Helper Formatters & Indentation ────────────────────────────────────────

function _indent(text, spaces) {
  if (!text) return "";
  const pad = " ".repeat(spaces);
  return String(text)
    .trim()
    .split("\n")
    .map((line) => `${pad}${line}`)
    .join("\n");
}

// ── 3. Pacing & Delivery Posture ──────────────────────────────────────────────

/**
 * Pacing calibration: classifies user message and returns length/energy directive.
 * @param {string|null} input
 * @returns {string}
 */
export function build_pacing_directive(input) {
  const pacing = TASK_PROTOCOLS.PACING;
  const text = String(input || "").trim();
  if (!text) return pacing.NO_PROMPT;

  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (chars >= 300 || words >= 60) return pacing.EXPANSIVE;

  const has_action =
    /\b(?:draw|grab|gripp?|take|push|pull|run|walk|strike|slam|open|step|slip|raise|turn|leap|dash|kneel|reach|press|set|lower|climb|swing|draws|grabs|steps|raises|turns|opens|says|whispers|shouts|nods|shakes|stands|sits|takes|pulls|pushes)\b/i.test(
      text,
    );
  const is_question = /\?\s*$/.test(text);
  const is_silence = !has_action && !is_question && words <= 12;
  if (chars <= 40 || words <= 8) return is_silence ? pacing.PASSIVE_SILENCE : pacing.TERSE;
  return pacing.MODERATE;
}

/**
 * Delivery Posture — short behavioral lock injected at the bottom of the Shot-2 <TASK>.
 * @param {any} snapshot - { dynamics?, style? }
 * @param {string} [input] - current user action / scene beat
 * @returns {string}
 */
export function build_recency_anchor(snapshot, input) {
  const dna = extract_style_dna(snapshot?.style || null);
  const { RHYTHM, DRIVE_ACTIVE, DRIVE_PASSIVE } = TASK_PROTOCOLS.RECENCY;
  const pacing = build_pacing_directive(input);
  const rhythm_line = dna.sentence_rhythm ? ` RHYTHM: ${dna.sentence_rhythm}.` : "";
  const drive = String(input || "").trim() ? DRIVE_ACTIVE : DRIVE_PASSIVE;
  const rhythm = RHYTHM(rhythm_line);
  return `<DELIVERY_POSTURE>\n    ${pacing}\n    <RHYTHM>${prompt_escape(rhythm)}</RHYTHM>\n    <DRIVE>${prompt_escape(drive)}</DRIVE>\n</DELIVERY_POSTURE>`;
}

// ── 4. Currents & Input Renderers ─────────────────────────────────────────────

/**
 * Renders the <CURRENTS> block (sensory experience + subtext).
 * @param {any} dna - resolved NarrativeStyle DNA
 * @param {string} somatic_inner
 * @returns {string}
 */
export function render_task_currents(dna, somatic_inner) {
  const currents = [];
  if (dna?.sensory_order) currents.push(`      <SENSORY_EXPERIENCE>${prompt_escape(dna.sensory_order)}</SENSORY_EXPERIENCE>`);
  if (String(somatic_inner || "").trim()) currents.push(wrap_tag("SUBTEXT", somatic_inner, 6));
  return currents.length ? `    <CURRENTS>\n${currents.join("\n")}\n    </CURRENTS>` : "";
}

/**
 * Renders the turn block's `<INPUT origin="...">` tag.
 * @param {{ input_tag?: string, input?: string, input_origin?: string|null }} params
 * @returns {string}
 */
export function render_task_input({ input_tag = "INPUT", input = "", input_origin = null }) {
  if (!input_tag || !String(input || "").trim()) return "";
  const origin = String(input_origin || "USER");
  return `    <${input_tag} origin="${escape_xml(origin)}">${inline_or_block(prompt_escape(String(input).trim()), 6)}</${input_tag}>`;
}

// ── 5. Master <TASK> Compiler ─────────────────────────────────────────────────

/**
 * Master turn block compiler (<TASK>).
 *
 * @param {Object} params
 * @param {any} params.config - prompt-mode config record
 * @param {string} [params.input]
 * @param {string|null} [params.input_origin]
 * @param {any} [params.style]
 * @param {string} [params.somatic_inner]
 * @param {any} [params.snapshot]
 * @param {string} [params.action_directive]
 * @param {string} [params.stability_lock]
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
  const dna = extract_style_dna(style);
  const input_tag = config?.input?.tag || "INPUT";
  const parts = [];

  if (String(stability_lock || "").trim()) parts.push(`    <STABILITY_LOCK>${prompt_escape(stability_lock)}</STABILITY_LOCK>`);
  if (String(action_directive || "").trim()) parts.push(_indent(action_directive, 4));

  const currents = render_task_currents(dna, somatic_inner);
  if (currents) parts.push(currents);

  const input_block = render_task_input({ input_tag, input, input_origin });
  if (input_block) parts.push(input_block);

  parts.push(_indent(build_recency_anchor(snapshot, input), 4));

  const think_type = config?.think_format || "character";
  if (think_type === "character") {
    const grounding = dna.emotional_grounding || TASK_PROTOCOLS.DEFAULTS.EMOTIONAL_GROUNDING;
    parts.push(`    <THINK_FORMAT>\n${_indent(TASK_PROTOCOLS.THINK_FORMAT(grounding, input_tag), 6)}\n    </THINK_FORMAT>`);
  } else if (think_type === "narrator") {
    parts.push(`    <THINK_FORMAT>\n${_indent(TASK_PROTOCOLS.THINK_NARRATOR, 6)}\n    </THINK_FORMAT>`);
  }

  return `<TASK>\n${parts.join("\n\n")}\n</TASK>`;
}

/**
 * Compiles the Director turn block with <ROUND>, <USER_ACTION>, <AI_CHARACTER_LAST_TURN>, and <TASK>.
 * @param {Object} params
 * @param {number|string} params.round
 * @param {string} [params.input]
 * @param {string} [params.last_ai_text]
 * @param {string} [params.schema]
 * @returns {string}
 */
export function render_director_task({ round, input = "", last_ai_text = "", schema = DIRECTOR_SCHEMA }) {
  const has_input = !!input?.trim();
  const evaluation =
    DIRECTOR_TASK_RULES.EVALUATE(has_input) + (Number(round) <= 1 ? DIRECTOR_TASK_RULES.ROUND_ONE : "") + ` ${DIRECTOR_TASK_RULES.USER_PERSONA_LOCK}`;

  const parts = [
    `<ROUND>${escape_xml(String(round))}</ROUND>`,
    has_input ? `<USER_ACTION>${_indent(input, 2)}</USER_ACTION>` : "",
    last_ai_text ? `<AI_CHARACTER_LAST_TURN>${_indent(last_ai_text, 2)}</AI_CHARACTER_LAST_TURN>` : "",
    "<TASK>",
    `    ${evaluation}`,
    `    ${render_environmental_hint(input)}`,
    `    ${DIRECTOR_TASK_RULES.JSON_RETURN(schema)}`,
    "</TASK>",
  ].filter(Boolean);

  return parts.join("\n");
}

/**
 * Compiles the Memory Forge <TASK> block.
 * @param {Object} params
 * @param {string} params.target_name
 * @param {string} params.target_key
 * @param {string} params.temporal_contract
 * @param {string} [params.schema]
 * @returns {string}
 */
export function render_memory_forge_task({ target_name, target_key, temporal_contract, schema = MEMORY_FORGE_SCHEMA }) {
  return `  <TASK>\n    ${_indent(temporal_contract || "", 4)}\n\n    Analyze recent history specifically for TARGET ENTITY "${escape_xml(target_name)}" (${escape_xml(target_key)}). Record internal evaluation in "_thought_process".\n    Extract state mutations and outward relationships ("${escape_xml(target_name)} → [Target]: [Dynamic]") strictly adhering to the contract.\n\n    Output strict JSON matching this schema:\n    ${schema}\n  </TASK>`;
}

/**
 * Compiles the Profile Enhancement <INSTRUCTIONS> block.
 * @param {Object} params
 * @param {string} params.directive
 * @param {string} [params.format_instruction]
 * @param {string} [params.macro_instruction]
 * @param {string} [params.output_rules]
 * @returns {string}
 */
export function render_enhancement_instructions({ directive, format_instruction = "", macro_instruction = "", output_rules = "" }) {
  const items = [
    _indent(escape_xml(directive), 4),
    format_instruction ? _indent(format_instruction, 4) : "",
    macro_instruction ? _indent(macro_instruction, 4) : "",
    output_rules ? _indent(output_rules, 4) : "",
  ].filter(Boolean);

  return `  <INSTRUCTIONS>\n    ${items.join("\n\n    ")}\n  </INSTRUCTIONS>`;
}

/**
 * Compiles the Profile Sorting <INSTRUCTIONS> block.
 * @param {Object} params
 * @param {string} params.schema
 * @param {string} params.pov_instruction
 * @param {string} params.focus_directive
 * @param {string} [params.ingestion_str]
 * @param {string} [params.redistribute_str]
 * @param {string} [params.output_rules_str]
 * @returns {string}
 */
export function render_profile_sorting_instructions({
  schema = PROFILE_SCHEMA,
  pov_instruction,
  focus_directive,
  ingestion_str = "",
  redistribute_str = "",
  output_rules_str = "",
}) {
  return `  <INSTRUCTIONS>\n    ${_indent(escape_xml(schema), 4)}\n\n    ${_indent(escape_xml(pov_instruction), 4)}\n\n    ${_indent(focus_directive, 4)}${ingestion_str}${redistribute_str}${output_rules_str}\n  </INSTRUCTIONS>`;
}

/**
 * CHANGELOG
 * - 2026-09-11: Complete module purification: relocated OUTPUT_FORMATS, TEMPORAL_CONTRACT, TEMPORAL_PROTOCOLS, and PROFILE_PROTOCOLS to task.js; imported layout helpers from @utils; task.js now has zero sibling imports.
 * - 2026-09-11: Relocated CHARACTER_DIRECTIVES (NPC_BOUNDARY, INITIATIVE, ADVANCE) to task.js to unify all turn action directives under <TASK>.
 * - 2026-09-11: Added render_director_task, render_memory_forge_task, render_enhancement_instructions, and render_profile_sorting_instructions.
 * - 2026-09-11: Added DIRECTOR_SCHEMA, PROFILE_SCHEMA, MEMORY_FORGE_SCHEMA, DIRECTOR_TASK_RULES, render_terse_director_task, SCENE_DIRECTIVES, GHOSTWRITE_DIRECTIVES, and SORTING_DIRECTIVES.
 * - 2026-09-11: Initial creation of modular task.js extracting turn block formatting, pacing, and think formats.
 */
