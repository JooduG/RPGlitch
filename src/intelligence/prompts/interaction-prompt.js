/**
 * src/intelligence/prompts/interaction-prompt.js
 * 🎭 SHOT 2 (STORY PROSE) PROMPTS — the interaction turn & its variants
 *
 * The base Story Prose compiler. `interaction` (the AI character's turn) is the
 * canonical layout; `ghostwrite` (draft the player's turn) and `npc` (a stage
 * NPC speaks) are config-driven variations of it via prompt-modes.json. The
 * narrator beats live in narrator-prompt.js.
 *
 * One fused <SYSTEM round="N" mode="..."> layout:
 *   1. <AXIOMATIC_CONSTITUTION> — LAWs L1-L5, directly inside <SYSTEM>
 *      (L5_AGENCY omitted for ghostwrite)
 *   2. <CORE_PROTOCOLS>  — SIMULATION_FIDELITY, PERSPECTIVE (person + tense),
 *                          conditional ALTERNATION_OPTIONS, NARRATIVE_STYLE
 *                          (internal_ratio + description + SIGNUM),
 *                          PROSE_DISCIPLINE (FORMAT / ANTI_TROPES /
 *                          BANNED_CLICHES / NATURAL_DIALOGUE), conditional
 *                          FIRST_CONTACT
 *   3. <STORY_ENTITIES>  — AI_CHARACTER / USER_PERSONA / FRACTAL / <NPC> sheets
 *                          (compiled by shared.js render_entity_sheets),
 *                          PROXIMATE_NPCS roster
 *   4. <CONVERSATION_HISTORY> — engine-injected inside <SYSTEM> (transport)
 *   5. <TASK>            — the turn block: CURRENTS (SENSORY_EXPERIENCE +
 *                          SUBTEXT), INPUT, DELIVERY_POSTURE (PACING / RHYTHM /
 *                          DRIVE), THINK_FORMAT (<BEAT> tags)
 *
 * The transport closes </SYSTEM> after the task; the renderer returns the open
 * <SYSTEM> prefix (system), the <TASK> block (task) and the closing tag
 * (system_close) so history + task sit INSIDE <SYSTEM>.
 * ENTRIES carry only origin + round (no mode).
 */

import { escape_xml, prompt_escape, clean_xml, expand_entity_macros, has_alternations } from "@utils";
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
  resolve_pov_protocol,
  resolve_stability_lock,
  indent_all as _indent,
} from "./shared.js";

// ── 1. Interaction Protocols ──────────────────────────────────────────────────

/**
 * Every interaction-specific protocol body: role lines, action directives, the
 * ghostwrite directives, the pacing directives, the recency-anchor (delivery
 * posture) copy, the style fallbacks and the interaction THINK_FORMAT. The
 * constitution LAWs and the <CORE_PROTOCOLS> scaffold come from PROTOCOL_LIBRARY
 * in shared.js; the two selection compilers (build_pacing_directive /
 * build_recency_anchor) live below.
 */
const INTERACTION_PROTOCOLS = {
  DIRECTIVES: {
    NPC_BOUNDARY: (name) =>
      `Respond strictly as ${name} — a supporting character. Own only your own voice, actions, and perspective: never speak for <USER_PERSONA> or the AI character, and never resolve the overarching story quest on your own. Write third-person limited, present tense, and end on a natural beat.`,
    INITIATIVE:
      "Take active initiative to open or advance the scene. Drive events forward through decisions and reactions without waiting for permission.",
    ADVANCE: "Advance the scene in response to <INPUT />.",
  },

  GHOSTWRITE: {
    META: "Match the tone of the scene. Output ONLY in-character prose/dialogue suitable for the player's turn. No meta preamble, no out-of-character commentary.",
    DRAFT: (user_name, ai_name) => `Draft a compelling, in-character next action or vocal response for ${user_name} in response to ${ai_name}.`,
    ENHANCE: (user_name, draft) =>
      `Enhance, expand, and polish the following draft written by ${user_name} into vivid, atmospheric action/dialogue:\n    ${draft}`,
  },

  ROLE_LINES: {
    GHOSTWRITE: (ai_name, fractal_name) =>
      `You are the GHOSTWRITER for AI_CHARACTER ${ai_name}. Draft their next turn within the FRACTAL ${fractal_name}, writing in their voice and from their perspective.`,
    NPC: (speaker_name, user_name, fractal_name) =>
      `You are ${speaker_name}, a supporting secondary character in an active scene with ${user_name} inside ${fractal_name}. Embody this role with uncompromised fidelity under the laws and directives below.`,
    DEFAULT: (ai_name, fractal_name, user_name) =>
      `You are the AI_CHARACTER ${ai_name} within the FRACTAL ${fractal_name}, interacting with USER_PERSONA ${user_name}. Embody this role with uncompromised fidelity under the laws and directives below.`,
  },

  PACING: {
    NO_PROMPT: `<PACING mode="NO_PROMPT">Advance the situation with one brief and deliberate beat.</PACING>`,
    EXPANSIVE: `<PACING mode="EXPANSIVE">You may expand to match the message's breadth, but still close on one decisive hook.</PACING>`,
    PASSIVE_SILENCE: `<PACING mode="PASSIVE_SILENCE">Do not stall — escalate with a direct probe (a pointed question, a challenge, or an unexpected development) in one or two taut sentences.</PACING>`,
    TERSE: `<PACING mode="TERSE">Match it — a brief, weighted reply of one to three sharp beats (short sentences, a single decisive action or line). Do not pad.</PACING>`,
    MODERATE: `<PACING mode="MODERATE">A reply of a few sentences — long enough for substance, short enough to keep the scene moving.</PACING>`,
  },

  RECENCY: {
    RHYTHM: (rhythm_line) =>
      `Hold your temperament; resist passive compliance. Match the user's conversational scale—build situational friction deliberately rather than rushing to resolution.${rhythm_line}`,
    DRIVE_ACTIVE: "Drive the beat forward on your own initiative and end on a live, unresolved hook that demands response.",
    DRIVE_PASSIVE: "Push the situation forward on your own terms and end on a live, unresolved hook that demands response.",
  },

  DEFAULTS: {
    EMOTIONAL_GROUNDING: "hold your established temperament against the immediate friction",
  },

  THINK_FORMAT: (
    emotional_grounding,
    input_tag = "INPUT",
  ) => `Begin response with <THINK> (under 200 words). Execute internal reasoning across 4 sequential beats:
<BEAT id="VISCERAL_IMPACT" step="1">Immediate non-verbal reaction to the <${input_tag} /> element.</BEAT>
<BEAT id="EMOTIONAL_CALIBRATION" step="2">Narrative style emotional grounding: "${emotional_grounding}".</BEAT>
<BEAT id="STRATEGIC_DRIVE" step="3">How active <AGENDA /> and/or <TRAJECTORY /> navigate immediate friction.</BEAT>
<BEAT id="CADENCE_TEST" step="4">Draft a dialogue line before generating outward prose.</BEAT>
Close with </THINK> before generating narrative prose.`,
};

// ── 2. Pacing & Recency Compilers ─────────────────────────────────────────────

/**
 * Pacing calibration: classifies user message and returns length/energy directive.
 * @param {string|null} input
 * @returns {string}
 */
function build_pacing_directive(input) {
  const pacing = INTERACTION_PROTOCOLS.PACING;
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
 * Delivery Posture — a short behavioral lock re-injected at the bottom of the
 * Shot-2 task's <TASK>. `snapshot` may carry `.style` for the sentence-rhythm
 * calibration line.
 * @param {any} snapshot - { dynamics?, style? }
 * @param {string} [input] - current user action / scene beat
 * @returns {string}
 */
function build_recency_anchor(snapshot, input) {
  const dna = extract_style_dna(snapshot?.style || null);
  const { RHYTHM, DRIVE_ACTIVE, DRIVE_PASSIVE } = INTERACTION_PROTOCOLS.RECENCY;
  const pacing = build_pacing_directive(input);
  const rhythm_line = dna.sentence_rhythm ? ` RHYTHM: ${dna.sentence_rhythm}.` : "";
  const drive = String(input || "").trim() ? DRIVE_ACTIVE : DRIVE_PASSIVE;
  const rhythm = RHYTHM(rhythm_line);
  return `<DELIVERY_POSTURE>\n    ${pacing}\n    <RHYTHM>${prompt_escape(rhythm)}</RHYTHM>\n    <DRIVE>${prompt_escape(drive)}</DRIVE>\n</DELIVERY_POSTURE>`;
}

// ── 3. Turn-Block Compiler ───────────────────────────────────────────────────

/** <TASK> block (the turn block), driven by the resolved prompt-mode config. */
function render_task({ config, input, input_origin = null, style, somatic_inner, snapshot, action_directive = "", stability_lock = "" }) {
  const dna = extract_style_dna(style);
  const input_tag = config.input?.tag || "INPUT";
  const parts = [];

  if (String(stability_lock || "").trim()) parts.push(`    <STABILITY_LOCK>${prompt_escape(stability_lock)}</STABILITY_LOCK>`);
  if (String(action_directive || "").trim()) parts.push(_indent(action_directive, 4));

  const currents = render_task_currents(dna, somatic_inner);
  if (currents) parts.push(currents);

  const input_block = render_task_input({ input_tag, input, input_origin });
  if (input_block) parts.push(input_block);

  parts.push(_indent(build_recency_anchor(snapshot, input), 4));

  const grounding = dna.emotional_grounding || INTERACTION_PROTOCOLS.DEFAULTS.EMOTIONAL_GROUNDING;
  parts.push(`    <THINK_FORMAT>\n${_indent(INTERACTION_PROTOCOLS.THINK_FORMAT(grounding, input_tag), 6)}\n    </THINK_FORMAT>`);

  return `<TASK>\n${parts.join("\n\n")}\n</TASK>`;
}

// ── 4. Story Prose Compiler (interaction & variants) ─────────────────────────

/**
 * Maps the interaction variants (ghostwrite flag + NPC detection) onto a
 * prompt-modes registry key. Narrator beats resolve their own mode in
 * narrator-prompt.js.
 * @param {{ ghostwrite?: boolean, is_npc?: boolean }} params
 * @returns {any}
 */
export function resolve_prompt_mode({ ghostwrite = false, is_npc = false } = {}) {
  if (ghostwrite) return get_prompt_mode("ghostwrite");
  return get_prompt_mode(is_npc ? "npc" : "interaction");
}

/**
 * Story Prose compiler — the interaction turn (the AI character) and its two
 * config-driven variants: `ghostwrite` (draft the player's turn) and `npc`
 * (a stage NPC speaks). Narrator beats live in narrator-prompt.js.
 *
 * Returns the open <SYSTEM> prefix without its closing tag; the transport
 * injects <CONVERSATION_HISTORY> and the <TASK> block before appending
 * `system_close` (</SYSTEM>), so history + task live inside <SYSTEM>.
 *
 * @param {Object} params
 * @param {number|string|null} [params.round]
 * @param {any} params.entities
 * @param {any} [params.speaker] - Speaker entity (defaults to entities.AI)
 * @param {string} [params.input]
 * @param {any} [params.compressed_snapshot]
 * @param {any} [params.meta]
 * @param {any} [params.render_accessors]
 * @param {boolean} [params.ghostwrite]
 * @param {string|null} [params.prompt_mode]
 * @param {any} [params.director_data]
 * @param {any[]} [params.npc_entities]
 * @param {string[]} [params.in_scene_ids]
 * @returns {{ system: string, task: string, system_close: string }}
 */
export function render_story_prose({
  round = null,
  entities = {},
  speaker = null,
  input = "",
  compressed_snapshot = {},
  meta = {},
  render_accessors = null,
  ghostwrite = false,
  prompt_mode = null,
  director_data = null,
  npc_entities = [],
  in_scene_ids = [],
}) {
  const active_speaker = speaker || entities?.AI;
  const is_npc = !!active_speaker && active_speaker !== entities?.AI;
  const config = prompt_mode ? get_prompt_mode(prompt_mode) : resolve_prompt_mode({ ghostwrite, is_npc });

  const accessors = render_accessors || render_builder.create_render_accessors(entities, input);
  const pov_protocol = resolve_pov_protocol(active_speaker);

  const speaker_name = prompt_escape(active_speaker?.name || (is_npc ? "NPC" : "AI"));
  const ai_name = prompt_escape(entities?.AI?.name || "AI Character");

  const style = get_narrative_style(resolve_active_style_key());

  const speaker_dynamics = is_npc ? active_speaker?.dynamics || {} : compressed_snapshot?.ai?.dynamics || entities?.AI?.dynamics || {};

  const fractal_dynamics = compressed_snapshot?.fractal?.dynamics || entities?.FRACTAL?.dynamics || {};

  const somatic_signals_xml = build_somatic_signals_xml(speaker_dynamics, fractal_dynamics, {
    keywords: director_data?.keywords || [],
    style: config.ghostwrite ? null : style,
  });
  const somatic_inner = String(somatic_signals_xml || "")
    .replace(/^\s*<SUBTEXT>\s*/, "")
    .replace(/\s*<\/SUBTEXT>\s*$/, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const is_first_contact =
    meta?.is_opening_turn ||
    (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT")) ||
    (Array.isArray(director_data?.keywords) && director_data.keywords.includes("first_contact"));

  const constitution = render_axiomatic_constitution({ ghostwrite: config.ghostwrite });

  const entities_block = render_entity_sheets({
    entities,
    npc_entities,
    in_scene_ids,
    active_speaker,
    accessors,
    config,
    is_npc,
    speaker_dynamics,
    fractal_dynamics,
  });

  const core = render_core_protocols({
    is_narrator: false,
    pov_protocol,
    style,
    is_first_contact,
    has_alternation: has_alternations(entities_block),
  });

  const ai_char_name = prompt_escape(entities?.AI?.name || "AI Character");
  const user_name = prompt_escape(entities?.USER?.name || "User Persona");
  const fractal_name = prompt_escape(entities?.FRACTAL?.name || "the setting");

  const role_line = config.ghostwrite
    ? INTERACTION_PROTOCOLS.ROLE_LINES.GHOSTWRITE(ai_char_name, fractal_name)
    : is_npc
      ? INTERACTION_PROTOCOLS.ROLE_LINES.NPC(speaker_name, user_name, fractal_name)
      : INTERACTION_PROTOCOLS.ROLE_LINES.DEFAULT(ai_char_name, fractal_name, user_name);

  const system = clean_xml(
    `\n<SYSTEM round="${escape_xml(String(round ?? 0))}" mode="${escape_xml(config.system_mode)}">\n${role_line}\n${constitution}\n\n${core}\n\n${entities_block}\n`,
  ).trim();

  const stability_lock_content = resolve_stability_lock(meta);

  const draft_directive = input?.trim()
    ? INTERACTION_PROTOCOLS.GHOSTWRITE.ENHANCE(ai_name, prompt_escape(input.trim()))
    : INTERACTION_PROTOCOLS.GHOSTWRITE.DRAFT(ai_name, prompt_escape(entities?.USER?.name || "AI Character"));

  const action_directive = is_npc
    ? INTERACTION_PROTOCOLS.DIRECTIVES.NPC_BOUNDARY(speaker_name)
    : config.ghostwrite
      ? `${draft_directive}\n    ${INTERACTION_PROTOCOLS.GHOSTWRITE.META}`
      : input?.trim()
        ? INTERACTION_PROTOCOLS.DIRECTIVES.ADVANCE
        : INTERACTION_PROTOCOLS.DIRECTIVES.INITIATIVE;

  const input_origin_entity = config.ghostwrite ? active_speaker : entities?.USER;
  const input_origin = input_origin_entity?.id || input_origin_entity?.name || "USER";

  const task = render_task({
    config,
    input,
    input_origin,
    style,
    somatic_inner,
    snapshot: { dynamics: speaker_dynamics, style },
    action_directive,
    stability_lock: stability_lock_content,
  });

  return { system, task, system_close: "</SYSTEM>" };
}

// ── 5. Player Ghostwriter Compiler ───────────────────────────────────────────

/**
 * Ghostwriter prompt compiler — player drafting and enhancement assistant.
 * @param {Object} params
 * @param {any} params.entities
 * @param {string} [params.input=""]
 * @returns {{ system: string, task: string, system_close: string }}
 */
export function render_ghostwriter({ entities, input = "" }) {
  const user_name = entities?.USER?.name || "User Persona";
  const ai_name = entities?.AI?.name || "AI Character";

  const swapped = {
    ...(entities || {}),
    AI: entities?.USER ? expand_entity_macros(entities.USER, entities) : { name: user_name, present: {}, eternal: {}, future: "", past: [] },
    USER: entities?.AI ? expand_entity_macros(entities.AI, entities) : { name: ai_name, present: {}, eternal: {}, future: "", past: [] },
  };

  const render_accessors = render_builder.create_render_accessors(swapped, input || "", []);
  const rendered = render_story_prose({
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
    prompt_mode: "ghostwrite",
  });

  return rendered;
}

/**
 * CHANGELOG
 * - 2026-09-10: Renamed STORY_PROTOCOLS → INTERACTION_PROTOCOLS and folded every remaining
 *   interaction protocol body into it: the three role lines (ROLE_LINES.GHOSTWRITE/NPC/DEFAULT),
 *   the pacing directives (PACING), the recency-anchor copy (RECENCY.RHYTHM/DRIVE_ACTIVE/
 *   DRIVE_PASSIVE) and the interaction THINK_FORMAT (now a registry template, so build_think_format
 *   is deleted). The "Advance the scene..." action directive became DIRECTIVES.ADVANCE and the
 *   style-less emotional-grounding fallback became DEFAULTS.EMOTIONAL_GROUNDING.
 *   build_pacing_directive / build_recency_anchor remain as the two selection compilers that read
 *   from the registry.
 * - 2026-09-10: Redundancy sweep. The turn block's <CURRENTS>/<INPUT> assembly now comes from
 *   the shared render_task_currents / render_task_input helpers (previously duplicated verbatim
 *   in narrator-prompt.js).
 * - 2026-09-10: <AXIOMATIC_CONSTITUTION> now comes from shared.js (it was briefly parked in
 *   physics-prompt.js, which is dynamics-only); only build_somatic_signals_xml remains from
 *   physics-prompt.js.
 * - 2026-09-10: Moved the shared Shot-2 blocks out: <AXIOMATIC_CONSTITUTION> (LAWs L1-L5)
 *   to physics-prompt.js and <CORE_PROTOCOLS> to shared.js. narrator-prompt.js now consumes
 *   both from there, so this file no longer exports them; only the interaction THINK_FORMAT
 *   body (build_think_format) stays local.
 * - 2026-09-10: Renamed from story-prompt.js and narrowed to the Shot-2 base compiler. The narrator
 *   beat (SCENE_TEMPLATES / CONTINUATION / PROLOGUE / EPILOGUE / COLLAPSE) moved to the new
 *   narrator-prompt.js, which imports render_axiomatic_constitution + render_core_protocols from
 *   here; resolve_pov_protocol + the stability-lock messages now come from shared.js. render_story_prose
 *   dropped its `mode`/`scene_template`/narrator branch (it now compiles only interaction / ghostwrite /
 *   npc via prompt_mode); resolve_prompt_mode() no longer accepts a `mode` key.
 * - 2026-09-10: Consumed `extract_style_dna` from @data (now beside the `define_style` compiler that
 *   writes `narrative_engine`) and `expand_entity_macros` from @utils (the deep entity macro expander
 *   belongs with `parse_macros`). Dropped the unused `parse_macros` import. De-exported the four
 *   module-private helpers `resolve_pov_protocol`, `STORY_PROTOCOLS`, `build_pacing_directive` and
 *   `build_recency_anchor` — no consumer outside this module.
 * - 2026-09-10: Moved the prompt-mode registry accessor `get_prompt_mode` + the
 *   prompt-modes.json import into interaction-prompt.js (the mode-driven sheets
 *   compiler owns the registry), and `_wrap_tag` → the exported `wrap_tag` layout
 *   helper there. `_has_alternation` was a duplicate of @utils `has_alternations`
 *   and is deleted.
 * - 2026-09-10: Entity-sheet extraction. Moved every per-entity sheet renderer
 *   (_render_speaker_sheet / _render_user_persona_sheet / _render_fractal_sheet and their
 *   helpers) into the new shared interaction-prompt.js, which compiles the <STORY_ENTITIES>
 *   block from the mode's `sheets` config. render_story_prose now calls render_entity_sheets;
 *   the role line moved to a per-mode `role_line` emitted directly under <SYSTEM> (previously
 *   suppressed for narrator/NPC). The local render_story_entities_section + cast helpers are gone.
 * - 2026-09-10: USER_PERSONA privacy. Dropped the user persona's <DISPOSITIONS>
 *   from its sheet (and pruned the now-unused npc_entities/name_to_id/active_names
 *   params) so the AI character is never handed the player's directed attitudes —
 *   knowledge it could not have observed (L3_SPATIAL / L5_AGENCY). Matches the
 *   blueprint; the AI's own and the Fractal's dispositions still render.
 * - 2026-09-10: Scene-anchor removal + sensory re-source. Dropped <SCENE_ANCHOR>
 *   (LOCATION/ENVIRONMENT/CONDITION) from the turn block and the scene-derived
 *   sensory path with it: <SENSORY_EXPERIENCE> now emits the selected
 *   NarrativeStyle's SENSORY_ORDER verbatim. Deleted the now-dead
 *   _scene_environment / _render_scene_anchor helpers and the flatten_physical
 *   import (pruned from @utils).
 * - 2026-09-10: Blueprint follow-up review. AGENDA moved inside <PSYCHOLOGY> and TRAJECTORY inside
 *   <ATMOSPHERE> (both sheets); <USER_SOVEREIGNTY> removed entirely (the agency guarantee is carried
 *   by L5_AGENCY + PROSE_DISCIPLINE) — dropped the SHOT2_PROTOCOLS.USER_SOVEREIGNTY body and the
 *   prompt-modes `user_sovereignty` flag; <ALTERNATION_OPTIONS> now renders only when a rendered
 *   entity field still carries {A|B} syntax; THINK_FORMAT wording realigned to the blueprint
 *   ("internal reasoning across 4 sequential beats", "Immediate non-verbal reaction", bare "Draft a
 *   dialogue line before generating outward prose", "Close with </THINK> before generating narrative
 *   prose").
 * - 2026-09-10: Blueprint-alignment pass (story-prose scope). Renamed/nested the whole Shot-2
 *   schema to the authored blueprint: L1_INTEGRITY / L2_CONTINUITY / L3_SPATIAL / L4_AESTHETIC /
 *   L5_AGENCY (blueprint wording — "player sovereignty" framing removed); CREATIVE_FREEDOM →
 *   SIMULATION_FIDELITY (content-permission line retained); POV_DIRECTIVE + <TENSE> → one
 *   <PERSPECTIVE person tense> with two bullets; NARRATIVE_STYLE now carries its description +
 *   <SIGNUM>; BEHAVIORAL_DISCIPLINE → PROSE_DISCIPLINE (FORMAT / ANTI_TROPES / BANNED_CLICHES /
 *   NATURAL_DIALOGUE); entity sheets gained id attrs and re-nested (AGENDA at top level,
 *   PSYCHOLOGICAL_PROFILE → PSYCHOLOGY with STATE/DISPOSITIONS/DYNAMIC_AXES inside); FRACTAL gained
 *   TRAJECTORY + <ATMOSPHERE> (PERMANENT_TRUTHS/STATE/DISPOSITIONS/DYNAMIC_AXES) and
 *   ENVIRONMENT → TOPOGRAPHY; PRESENT_NPCS → PROXIMATE_NPCS (<NPC id name />); the turn block
 *   became <TASK>: STAGE_DIRECTIVES → CURRENTS (SENSORY_EXPERIENCE + SUBTEXT), RECENCY_ANCHOR →
 *   DELIVERY_POSTURE (PACING/RHYTHM/DRIVE), <USER_ACTION> → <INPUT origin>, THINK_FORMAT beats →
 *   <BEAT id step> tags; section dividers dropped; top line to blueprint wording. History + TASK
 *   now render INSIDE <SYSTEM> (render_story_prose returns an open system + system_close for the
 *   transport to close). SCENE_ANCHOR / USER_SOVEREIGNTY / ALTERNATION_OPTIONS / FIRST_CONTACT /
 *   STABILITY_LOCK kept.
 * - 2026-09-10: Merged the old `fractal`/`prologue`/`epilogue` prompt modes into the single
 *   `narrator` mode; render_story_prose now takes `scene_template` instead of `conclusion_status`
 *   and dispatches the narrator beat (CONTINUATION / PROLOGUE / EPILOGUE / COLLAPSE) from it.
 * - 2026-09-10: Scene grounding: the turn block now opens with a SCENE_ANCHOR
 *   (the Fractal's LOCATION/ENVIRONMENT/CONDITION) and SENSORY_EXPERIENCE is
 *   derived from the live fractal environment instead of the style's static
 *   SENSORY_ORDER, so backstory can no longer override the live scene.
 * - 2026-09-10: Fused every speaker mode onto ONE <SYSTEM mode="..."> layout (deleted the character
 *   layout fork: CHARACTER_* laws, render_character_system/task/core/entities, the character sheets
 *   and _render_psychology); AXIOMATIC_CONSTITUTION is now a top-level sibling above CORE_PROTOCOLS;
 *   prompt-modes.json drives system_mode / user_sovereignty / input.tag / think_format / axes_scope /
 *   scene_template; per-entity <DISPOSITIONS> render in all sheets; ghostwrite now drafts the PLAYER's
 *   turn against the AI character (identity-inversion fix); <TASK> carries no mode.
 * - 2026-09-04: Shot-2 polish: THINK_FORMAT (attr-free, 4 beats; beat 4 ratio-conditional on style), NARRATIVE_STYLE internal_ratio attr + <SIGNATURE_ELEMENTS> child, <TENSE mode="PRESENT">, <CLICHE_BAN>, <SENSORY_EXPERIENCE>, USER_SOVEREIGNTY mode="ABSOLUTE", DIRECTOR_NOTE removed (directive moves to startWith), FIRST_CONTACT via CONTEXT_DIRECTIVE_REGISTRY, PACING de-duplicated, dialogue-quote rule consolidated into PROSE_BOUNDS, <entry> → <ENTRY>, character "You are" top line after <SYSTEM>, FRACTAL sheet always renders fractal dynamics axes.
 * - 2026-09-06: Redesign (suggestion.md): <HIERARCHY> → <AXIOMATIC_CONSTITUTION> with <LAW id="L1..L4"> wrappers; FICTIONAL_LICENSE → <CREATIVE_FREEDOM> (content-permission line preserved); NARRATIVE_STYLE → single-line "<NARRATIVE_STYLE id=\"UPPER\">Employ the signature storytelling of [name]. [description] Include things such as [elements]</NARRATIVE_STYLE>" (omitted for default); build_pacing_directive → <PACING mode="..."> tags; DIRECTOR_NOTE child <STAGE_DIRECTION> → <CLIFFSNOTES>; global RELATIONSHIPS mesh removed, replaced by per-entity OUTGOING <RELATIONSHIPS> in each sheet (before MEMORIES/BACKSTORY/HISTORY) shown only when the target is present in the story.
 * - 2026-09-06: Forked Shot 2 from the shared system head — new blueprint-aligned <SYSTEM round="N"> layout (CORE_PROTOCOLS / STORY_ENTITIES / TURN_EXECUTION). CONVERSATION_HISTORY stays engine-injected between system and task.
 * - 2026-09-06: Rebuilt entity sheets: AI_CHARACTER + USER_PERSONA + FRACTAL + <NPC> in <STORY_ENTITIES> with PSYCHOLOGICAL_PROFILE (AGENDA / DYNAMIC_AXES / STATE_OF_MIND / PERSONALITY), merged <APPEARANCE>/<ENVIRONMENT> (eternal + present), MEMORIES/BACKSTORY/HISTORY; PRESENT_NPCS roster followed by <RELATIONSHIPS> mesh (below PRESENT_NPCS).
 * - 2026-09-06: Redistributed style fields: internal_ratio → THINK_FORMAT attr, sentence_rhythm → RECENCY_ANCHOR RHYTHM, sensory_order → STAGE_DIRECTIVES SENSORY_HIERARCHY, emotional_grounding → THINK_FORMAT beat 2; NARRATIVE_STYLE shrinks to ESSENCE + ELEMENTS.
 * - 2026-09-06: Dropped <DYNAMICS> laws/legend, SNAPSHOT, ROUND and USER_ACTION from the task (moved into system); task shrinks to STABILITY_LOCK + action directive.
 * - 2026-09-06: Moved render_recoupled_cast_body to shared.js (single shared cast renderer for storyteller and director) and removed the eternal-only cached CAST path (system_head_cache/_render_eternal_cast_body); render_system_head now takes the cast body directly.
 * - 2026-09-06: Recoupled the prompt layout: each entity's eternal + present + future + past now clump into one per-entity character-sheet block inside <CAST> (render_recoupled_cast_body). The SNAPSHOT shrinks to the relational mesh (<CURRENT_STORY_STATE>) + ROUND/USER_ACTION/TASK. <YOUR_IDENTITY>, PROTAGONIST, and the old split SNAPSHOT blocks are removed.
 * - 2026-09-04: Ghostwriter now resolves stored {{...}} macros against stable identities before its perspective swap, so swapped character state never inverts {{char}}/{{user}} references.
 * - 2026-09-06: Pruned dead <ANCHOR> tag from narrator protocols XML.
 * - 2026-09-06: Consolidated somatic directives and dynamics signals into build_somatic_signals_xml (<SOMATIC_SIGNALS>).
 * - 2026-08-28: Ground-up deconstruct & refactor: unified protocol composition, streamlined XML templating across AI/NPC/Narrator engines, and added clear section dividers.
 * - 2026-09-04: Added L5_AGENCY law (actor-agency wording), ALTERNATION_OPTIONS selectable-option protocol, and ghostwrite exemption for L5_AGENCY in render_core_protocols.
 */
