/**
 * src/intelligence/modules/reflex.js
 * ============================================================================
 * 🪞 REFLEX MODULE — Pacing, Delivery Posture & Structural Recovery
 * ============================================================================
 *
 * Owns the turn-level reflex layer: how the model calibrates reply length and
 * drive (pacing classification, environmental-hint detection, delivery
 * posture), which transient turn-state conditionals fire (first contact,
 * round one, input/scene evaluation), plus structural error recovery (stability-lock escalation and the
 * truncation completion note). These are resilience concerns, not identity
 * (role lines live in system.js) and not turn assembly (envelopes live in
 * task.js, which consumes this module through get_reflex_atom and the
 * plan-backed entry points below).
 *
 * Architecture & Modification Rules:
 * - Catalog + compiler + plans + thin renderers (protocols.js pattern):
 *   `REFLEX_LIBRARY` holds bare string atoms and {tag,body} records — never
 *   pre-wrapped XML; `get_reflex_atom` is the single dotted-key resolver; `resolve_*_plan` functions own every selection as frozen pure
 *   data; `render_*` functions map plans to XML without branching.
 * - Unidirectional layer flow: pure string catalog + pure functions over
 *   @utils + @data. Zero sibling imports (no task.js cycle).
 * - Single source of truth for pacing/rhythm/drive/environmental-hint copy
 *   and for stability-lock/truncation recovery copy.
 * ============================================================================
 */

import { prompt_escape, render_xml_tag, has_alternations, resolve_catalog_atom } from "@utils";

// ============================================================================
// [SECTION 1: REFLEX DEFAULTS — FROZEN CALIBRATION CONFIG]
// ============================================================================

/**
 * Frozen calibration config: pacing selection rules (first match wins, walked
 * in order with an ADAPTIVE fallback tail), stability escalation rungs (first
 * match wins, ordered most-severe first), input-signal detectors, and the
 * precedence order environmental-hint signals resolve in. Tuning calibration
 * is a data edit here — never a renderer edit.
 */
export const REFLEX_DEFAULTS = Object.freeze({
  PACING_RULES: Object.freeze([
    Object.freeze({ level: "EXPANSIVE", at_least: Object.freeze({ chars: 300, words: 60 }) }),
    Object.freeze({ level: "TERSE", at_most: Object.freeze({ chars: 40, words: 8 }) }),
  ]),
  STABILITY_LADDER: Object.freeze([Object.freeze({ at: 3, level: "CRITICAL" }), Object.freeze({ at: 1, level: "WARNING" })]),
  INPUT_SIZE_TIERS: Object.freeze([
    Object.freeze({
      tier: "TINY",
      at_most_chars: 12,
      beats: "1",
      mandate: "Reply in exactly 1 beat — a fragment, a single line, or a single action. Zero padding.",
    }),
    Object.freeze({ tier: "SMALL", at_most_chars: 90, beats: "1-2", mandate: "Reply in 1-2 sharp beats. No unprompted exposition." }),
    Object.freeze({ tier: "MEDIUM", at_most_chars: 400, beats: "2-4", mandate: "Reply in 2-4 beats, proportionate to «INPUT» breadth." }),
    Object.freeze({ tier: "EXPANSIVE", at_most_chars: Infinity, beats: "open", mandate: "Match «INPUT» breadth; close on one decisive hook." }),
  ]),
  PAUSE_MARKERS: /(\.\.\.|…|\(silence\)|\(pause\)|\bsays nothing\b|\bremains silent\b|\bno response\b|\bno answer\b)/i,
  DETECTORS: Object.freeze({
    DIALOGUE_QUOTES: /["'“”‘’]/,
    ACTION_VERBS:
      /\b(?:approach|ascend|bend|circle|climb|close|dash|descend|draw|draws|edge|enter|examine|follow|gaze|grab|grabs|gripp?|halt|kneel|leap|linger|listen|lower|move|nod|nods|observe|open|opens|pause|peer|press|pull|pulls|push|pushes|raise|raises|reach|rest|run|say|says|scan|set|settle|shake|shakes|shout|shouts|sit|sits|slam|slip|smell|stand|stands|stare|step|steps|strike|study|sweep|swing|take|takes|trail|turn|turns|wait|walk|watch|whisper|whispers)\b/i,
    SPATIAL_NOUNS:
      /\b(?:alcove|alley|altar|arch|belly|bridge|cave|ceiling|chamber|column|conduit|corridor|court|crevice|cylinder|deeps|door|field|floor|forest|gate|gear|hall|keep|ledge|light|lock|mechanism|mouth|passage|rain|river|rock|room|seal|shadow|sky|spillway|stair|stone|street|threshold|tower|tunnel|vault|wall|water|wheel|wind|window|yard)\b/i,
  }),
  HINT_SIGNALS: Object.freeze([
    Object.freeze({ reason: "verb", detector: "ACTION_VERBS" }),
    Object.freeze({ reason: "noun", detector: "SPATIAL_NOUNS" }),
  ]),
});

// ============================================================================
// [SECTION 2: REFLEX CATALOG — PACING, RHYTHM, DRIVE & CONDITIONALS]
// ============================================================================

/**
 * Normalized reflex catalog: every atom is a bare body ({tag,body} records for
 * XML-wrapped atoms). Envelope wrapping is renderer-owned (Section 5), so atoms stay retaggable without
 * rewording, and every sentence is individually manifest-addressable.
 */
export const REFLEX_LIBRARY = Object.freeze({
  PACING: Object.freeze({
    TERSE: Object.freeze({ tag: "PACING", mode: "TERSE", body: "Brief, weighted reply in 1-2 sharp beats. Zero padding." }),
    ADAPTIVE: Object.freeze({ tag: "PACING", mode: "ADAPTIVE", body: "A reply of 2-4 sentences—substantive, driving the scene forward." }),
    EXPANSIVE: Object.freeze({ tag: "PACING", mode: "EXPANSIVE", body: "Expand to match message breadth; close on one decisive hook." }),
  }),

  RHYTHM: Object.freeze({
    DEFAULT: Object.freeze({
      tag: "RHYTHM",
      body: "Hold temperament; resist passive compliance. Match conversational scale and build situational friction rather than rushing resolution.",
    }),
  }),

  DRIVE: Object.freeze({
    WITH_INPUT: Object.freeze({
      tag: "DRIVE",
      body: "Advance the scene in response to «INPUT»: drive the beat forward independently and end on an unresolved hook demanding response.",
    }),
    WITHOUT_INPUT: Object.freeze({
      tag: "DRIVE",
      body: "Take active initiative: drive events forward on your own terms through decisive actions and end on an unresolved hook demanding response.",
    }),
  }),

  TURN_STATE: Object.freeze({
    FIRST_CONTACT: Object.freeze({
      tag: "FIRST_CONTACT",
      body: "First encounter: characters are strangers. Acknowledge visual first impressions, physical distance, and tone before full dialogue.",
    }),
    ROUND_ONE: Object.freeze({
      tag: "ROUND_ONE",
      body: 'Round 1 follows the Fractal prologue, so next_action MUST be "AI_CHARACTER".',
    }),
    EVALUATION_INPUT: Object.freeze({
      tag: "EVALUATION_INPUT",
      body: 'Evaluate state mutations caused by «INPUT». Evaluate biological limits and physical causality strictly: if «INPUT» or physical events describe definitively fatal, terminal bodily destruction (e.g. biological death, irreversible drowning/asphyxiation, decapitation, or lethal cranial destruction with zero chance of medical survival), you MUST emit next_action: "EPILOGUE_COLLAPSED" and story_status: "COLLAPSED". Severe but survivable trauma (maiming, crushed limbs, severe blood loss, unconsciousness) should remain in-progress with somatic penalties in present.physical. Never hallucinate physical survival, bypass consequence, or continue casual dialogue across fatal events.',
    }),
    EVALUATION_SCENE: Object.freeze({
      tag: "EVALUATION_SCENE",
      body: 'Evaluate state mutations caused by the current situation. If environmental catastrophe or definitively fatal bodily destruction has occurred, emit next_action: "EPILOGUE_COLLAPSED" and story_status: "COLLAPSED". Severe non-lethal injuries remain in-progress.',
    }),
  }),

  CONDITIONALS: Object.freeze({
    ENVIRONMENTAL_HINT: Object.freeze({
      tag: "ENVIRONMENTAL_HINT",
      enveloped: true,
      body: 'Non-verbal environmental action. Strongly consider setting "speaker" to "fractal" to narrate the setting, unless AI character should react directly.',
    }),
    ALTERNATION: Object.freeze({
      tag: "ALTERNATION_OPTIONS",
      body: `Resolve {Option A|Option B} alternations by selecting exactly ONE contextually fitting option. Emit only the chosen text—never echo braces or pipes, blend choices, or output multiple options simultaneously.`,
    }),
    ANTI_STAGING: Object.freeze({
      tag: "ANTI_STAGING",
      body: "Terse dialogue turn: deliver the line and hold position. Forbid gratuitous physical movement, blocking, or scene re-staging on this beat.",
    }),
    HELD_MOMENT: Object.freeze({
      tag: "HELD_MOMENT",
      body: "Held moment: the other side offers pause or silence. Permit lingering — stay in the beat, do not force a scene transition or manufacture urgency.",
    }),
  }),

  RECOVERY: Object.freeze({
    STABILITY: Object.freeze({
      WARNING: Object.freeze({ tag: "STABILITY_LOCK", level: "WARNING", body: "Structural drift detected. Ensure all XML tags close cleanly." }),
      CRITICAL: Object.freeze({ tag: "STABILITY_LOCK", level: "CRITICAL", body: "Structural collapse. Every XML tag must close cleanly." }),
    }),
    TRUNCATION: Object.freeze({
      tag: "TRUNCATION_NOTE",
      body: "\n\nIMPORTANT: Previous reply cut off mid-sentence. Complete the response directly without repeating earlier text or rehashing events. Conclude on a complete sentence.",
    }),
  }),
});

// ============================================================================
// [SECTION 3: REFLEX PLANS — PURE DATA, NO XML]
// ============================================================================

/**
 * Pacing calibration plan: walks PACING_RULES first-match-wins over the input
 * scale into a frozen {level, chars, words} plan, falling back to ADAPTIVE.
 * @param {string|null|undefined} input
 * @returns {Readonly<{ level: "TERSE"|"ADAPTIVE"|"EXPANSIVE", chars: number, words: number }>}
 */
export function classify_pacing(input) {
  const text = String(input || "").trim();
  const chars = text.length;
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const hit = REFLEX_DEFAULTS.PACING_RULES.find(
    (rule) =>
      (rule.at_least && (chars >= rule.at_least.chars || words >= rule.at_least.words)) ||
      (rule.at_most && (chars <= rule.at_most.chars || words <= rule.at_most.words)),
  );
  return Object.freeze({ level: hit ? hit.level : "ADAPTIVE", chars, words });
}

/**
 * Input-size calibration plan (Track 3.1): walks INPUT_SIZE_TIERS first-match-wins
 * over trimmed character length into a frozen {tier, chars, words} plan.
 * @param {string|null|undefined} input
 * @returns {Readonly<{ tier: "TINY"|"SMALL"|"MEDIUM"|"EXPANSIVE", chars: number, words: number }>}
 */
export function classify_input_size(input) {
  const text = String(input || "").trim();
  const chars = text.length;
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const hit =
    REFLEX_DEFAULTS.INPUT_SIZE_TIERS.find((tier) => chars <= tier.at_most_chars) ||
    REFLEX_DEFAULTS.INPUT_SIZE_TIERS[REFLEX_DEFAULTS.INPUT_SIZE_TIERS.length - 1];
  return Object.freeze({ tier: hit.tier, chars, words });
}

/**
 * Beat-budget plan (Track 3.1): maps the input-size tier onto its frozen
 * {tier, beats, mandate} contract — the input-proportional reply clamp.
 * @param {string|null|undefined} input
 * @returns {Readonly<{ tier: string, beats: string, mandate: string }>}
 */
export function resolve_beat_budget_plan(input) {
  const size = classify_input_size(input);
  const tier = REFLEX_DEFAULTS.INPUT_SIZE_TIERS.find((candidate) => candidate.tier === size.tier);
  return Object.freeze({ tier: size.tier, beats: tier.beats, mandate: tier.mandate });
}

/**
 * Anti-staging detection plan (Track 3.1): a terse dialogue turn carries quoted
 * speech, no physical action verbs, and fits the TINY/SMALL bands — movement
 * on such beats is gratuitous staging.
 * @param {string|null|undefined} input
 * @returns {Readonly<{ hit: boolean, reason: "blank"|"no-quotes"|"has-action-verbs"|"too-long"|"terse-dialogue" }>}
 */
export function detect_staged_dialogue_turn(input) {
  const defaults = REFLEX_DEFAULTS;
  if (!input?.trim()) return Object.freeze({ hit: false, reason: "blank" });
  if (!defaults.DETECTORS.DIALOGUE_QUOTES.test(input)) return Object.freeze({ hit: false, reason: "no-quotes" });
  if (defaults.DETECTORS.ACTION_VERBS.test(input)) return Object.freeze({ hit: false, reason: "has-action-verbs" });
  const size = classify_input_size(input);
  if (size.tier !== "TINY" && size.tier !== "SMALL") return Object.freeze({ hit: false, reason: "too-long" });
  return Object.freeze({ hit: true, reason: "terse-dialogue" });
}

/**
 * Held-moment detection plan (Track 3.1): explicit conversational pause/silence
 * markers permit lingering. Blank input is NOT a held moment (initiative drive
 * owns the empty turn), so fixtures without pause markers stay silent.
 * @param {string|null|undefined} input
 * @returns {Readonly<{ hit: boolean, reason: "blank"|"no-pause-marker"|"held-pause" }>}
 */
export function detect_held_moment(input) {
  if (!input?.trim()) return Object.freeze({ hit: false, reason: "blank" });
  if (!REFLEX_DEFAULTS.PAUSE_MARKERS.test(input)) return Object.freeze({ hit: false, reason: "no-pause-marker" });
  return Object.freeze({ hit: true, reason: "held-pause" });
}

/**
 * Environmental-hint detection plan: classifies a user turn as verbal or
 * non-verbal/environmental, with the reason for the decision. Signal
 * precedence (verb before noun) comes from HINT_SIGNALS order.
 * @param {string|null|undefined} input
 * @returns {Readonly<{ hit: boolean, reason: "blank"|"quotes"|"no-signal"|"verb"|"noun" }>}
 */
export function detect_environmental_hint(input) {
  const defaults = REFLEX_DEFAULTS;
  if (!input?.trim()) return Object.freeze({ hit: false, reason: "blank" });
  if (defaults.DETECTORS.DIALOGUE_QUOTES.test(input)) return Object.freeze({ hit: false, reason: "quotes" });
  const signal = defaults.HINT_SIGNALS.find((candidate) => defaults.DETECTORS[candidate.detector].test(input));
  if (!signal) return Object.freeze({ hit: false, reason: "no-signal" });
  return Object.freeze({ hit: true, reason: signal.reason });
}

/**
 * Resolves snapshot + input into a frozen delivery-posture plan. Every
 * selection (pacing rule, rhythm source, drive kind) happens
 * here — the renderer maps plan fields to envelopes without branching.
 * Style DNA arrives pre-resolved (style.js resolve_style_dna, via
 * resolve_task_values) — this plan never parses style records. Input presence
 * arrives pre-resolved the same way; standalone callers omit it and the plan
 * derives it from the input text.
 * @param {any} snapshot - { style_dna? }
 * @param {string} [input] - current user action / scene beat
 * @param {Object} [options={}]
 * @param {boolean} [options.has_input] - pre-resolved input presence (defaults to deriving from input)
 * @returns {Readonly<{ pacing: Readonly<{ level: string, chars: number, words: number }>, rhythm: Readonly<{ source: "style_dna"|"default", body: string }>, drive: Readonly<{ kind: "with_input"|"without_input", body: string }> }>}
 */
export function resolve_prose_posture_plan(snapshot, input, { has_input = Boolean(String(input || "").trim()) } = {}) {
  const pacing = classify_pacing(input);
  const beat_budget = resolve_beat_budget_plan(input);
  const rhythm_body = snapshot?.style_dna?.rhythm || "";
  const drive_key = has_input ? "WITH_INPUT" : "WITHOUT_INPUT";
  return Object.freeze({
    pacing,
    beat_budget,
    rhythm: Object.freeze({
      source: rhythm_body ? "style_dna" : "default",
      body: rhythm_body || REFLEX_LIBRARY.RHYTHM.DEFAULT.body,
    }),
    drive: Object.freeze({ kind: has_input ? "with_input" : "without_input", body: REFLEX_LIBRARY.DRIVE[drive_key].body }),
    constraints: Object.freeze({
      anti_staging: detect_staged_dialogue_turn(input).hit,
      held_moment: detect_held_moment(input).hit,
    }),
  });
}

/**
 * Stability-lock escalation plan: maps recorded structural errors onto the
 * first matching STABILITY_LADDER rung (most-severe first).
 * @param {Object} [metadata]
 * @param {number} [metadata.structural_errors]
 * @returns {Readonly<{ level: "NONE"|"WARNING"|"CRITICAL", errors: number }>}
 */
export function resolve_stability_plan(metadata) {
  const errors = Number(metadata?.structural_errors) || 0;
  const rung = REFLEX_DEFAULTS.STABILITY_LADDER.find((candidate) => errors >= candidate.at);
  return Object.freeze({ level: rung ? rung.level : "NONE", errors });
}

/**
 * Turn-state plan: resolves transient turn metadata (input presence, round
 * index, relational novelty) into frozen firing flags. Composers read the
 * flags and emit the matching TURN_STATE atoms — reflex decides which fire.
 * @param {Object} [parameters={}]
 * @param {boolean} [parameters.has_input=false]
 * @param {number} [parameters.round=1]
 * @param {boolean} [parameters.is_first_contact=false]
 * @returns {Readonly<{ first_contact: boolean, round_one: boolean, evaluation: "EVALUATION_INPUT"|"EVALUATION_SCENE" }>}
 */
export function resolve_turn_state_plan({ has_input = false, round = 1, is_first_contact = false } = {}) {
  return Object.freeze({
    first_contact: Boolean(is_first_contact),
    round_one: Number(round) <= 1,
    evaluation: has_input ? "EVALUATION_INPUT" : "EVALUATION_SCENE",
  });
}

// ============================================================================
// [SECTION 4: REFLEX ATOM COMPILER — SINGLE DOTTED-KEY RESOLVER]
// ============================================================================

/**
 * Resolves one dotted reflex key (`REFLEX.*` prefix optional) to its body with
 * `{placeholder}` tokens interpolated from the values bag. Records flagged
 * `enveloped` render inside their canonical element (renderer-owned envelope);
 * all other records resolve to bare text. Branch keys and unknown keys resolve
 * to "". The single exact matcher for reflex emission — task.js delegates its
 * REFLEX.* directive keys here.
 * @param {string} directive_key - Dotted reflex path (e.g. "REFLEX.CONDITIONALS.ENVIRONMENTAL_HINT")
 * @param {Record<string, any>} [values={}]
 * @returns {string}
 */
export function get_reflex_atom(directive_key, values = {}) {
  const directive_parts = String(directive_key ?? "")
    .trim()
    .split(".");
  const stripped_key = (directive_parts[0] === "REFLEX" ? directive_parts.slice(1) : directive_parts).join(".");
  const resolved = resolve_catalog_atom(REFLEX_LIBRARY, stripped_key, values);
  if (typeof resolved === "string") return resolved;
  if (resolved && typeof resolved === "object") {
    const text = resolved.body ?? "";
    if (!text) return "";
    if (resolved.enveloped) {
      return render_xml_tag({ tag: resolved.tag, children: [text], inline: true });
    }
    return text;
  }
  return "";
}

// ============================================================================
// [SECTION 5: THIN PLAN RENDERERS — NO DECISIONS, ONLY XML]
// ============================================================================

/**
 * Wraps a pacing level atom in its canonical <PACING mode> element.
 * @param {string} [level="ADAPTIVE"]
 * @returns {string}
 */
function render_pacing_atom(level = "ADAPTIVE") {
  const atom = REFLEX_LIBRARY.PACING[level] || REFLEX_LIBRARY.PACING.ADAPTIVE;
  return render_xml_tag({ tag: atom.tag, attrs: { mode: atom.mode }, children: [atom.body], inline: true });
}

/**
 * Wraps a beat-budget plan in its canonical <BEAT_BUDGET size beats> element.
 * @param {ReturnType<typeof resolve_beat_budget_plan>|null|undefined} plan
 * @returns {string}
 */
function render_beat_budget_atom(plan) {
  const budget = plan || resolve_beat_budget_plan("");
  return render_xml_tag({ tag: "BEAT_BUDGET", attrs: { size: budget.tier, beats: budget.beats }, children: [budget.mandate], inline: true });
}

/**
 * Maps a prose-posture plan to the Layer 6 <DELIVERY_POSTURE> envelope. Every
 * selection is already plan data — this function only wraps.
 * @param {ReturnType<typeof resolve_prose_posture_plan>|null|undefined} plan
 * @returns {string}
 */
export function render_prose_posture_plan(plan) {
  if (!plan) return "";
  const constraints = [];
  if (plan.constraints?.anti_staging) {
    const atom = REFLEX_LIBRARY.CONDITIONALS.ANTI_STAGING;
    constraints.push(render_xml_tag({ tag: atom.tag, children: [atom.body], inline: true }));
  }
  if (plan.constraints?.held_moment) {
    const atom = REFLEX_LIBRARY.CONDITIONALS.HELD_MOMENT;
    constraints.push(render_xml_tag({ tag: atom.tag, children: [atom.body], inline: true }));
  }
  const children = [
    render_pacing_atom(plan.pacing?.level),
    render_beat_budget_atom(plan.beat_budget),
    render_xml_tag({ tag: REFLEX_LIBRARY.RHYTHM.DEFAULT.tag, children: [prompt_escape(plan.rhythm.body)], inline: true }),
    render_xml_tag({ tag: REFLEX_LIBRARY.DRIVE.WITH_INPUT.tag, children: [prompt_escape(plan.drive.body)], inline: true }),
    ...constraints,
  ].filter(Boolean);
  return render_xml_tag({ tag: "DELIVERY_POSTURE", children, indent: 0, child_indent: 4, separator: "\n" });
}

/**
 * Maps a stability plan to the <STABILITY_LOCK> envelope block carrying the
 * escalation level as an attribute.
 * @param {ReturnType<typeof resolve_stability_plan>|null|undefined} plan
 * @returns {string}
 */
export function render_stability_plan(plan) {
  if (!plan || plan.level === "NONE") return "";
  const atom = REFLEX_LIBRARY.RECOVERY.STABILITY[plan.level];
  return render_xml_tag({ tag: atom.tag, attrs: { level: atom.level }, children: [atom.body], inline: true });
}

/**
 * Compiles the canonical <ALTERNATION_OPTIONS> block. Text-gated callers pass
 * the candidate text; plan-gated callers pass {force:true} with no text.
 * @param {string} [text=""] - Candidate text scanned for {Option A|Option B} alternations
 * @param {Object} [options={}]
 * @param {boolean} [options.force=false] - Emit unconditionally, skipping the syntax probe
 * @returns {string} Formatted <ALTERNATION_OPTIONS> block or empty string
 */
export function render_alternation_protocol(text = "", { force = false } = {}) {
  if (!force && !has_alternations(text)) return "";
  const atom = REFLEX_LIBRARY.CONDITIONALS.ALTERNATION;
  return render_xml_tag({ tag: atom.tag, children: [atom.body], inline: true });
}

// ============================================================================
// [SECTION 6: PUBLIC ENTRY POINTS — PLAN-BACKED STABLE API]
// ============================================================================

/**
 * Detects a non-verbal, environmental user turn and returns the enveloped hint
 * nudging the Director. Single envelope path with the plan-gated compiler.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function render_environmental_hint(input) {
  const detection = detect_environmental_hint(input);
  return detection.hit ? get_reflex_atom("REFLEX.CONDITIONALS.ENVIRONMENTAL_HINT") : "";
}

/**
 * Prose Reflex (Delivery Posture) — kinetic reaction envelope calibrated to user input.
 * @param {any} snapshot - { style_dna? }
 * @param {string} [input] - current user action / scene beat
 * @param {Object} [options={}]
 * @param {boolean} [options.has_input] - pre-resolved input presence (defaults to deriving from input)
 * @returns {string}
 */
export function render_prose_reflex(snapshot, input, options) {
  return render_prose_posture_plan(resolve_prose_posture_plan(snapshot, input, options));
}

/**
 * Resolves appropriate stability lock escalation message based on recorded structural errors.
 * @param {Object} [metadata]
 * @param {number} [metadata.structural_errors]
 * @returns {string}
 */
export function resolve_stability_lock(metadata) {
  return render_stability_plan(resolve_stability_plan(metadata));
}

/**
 * CHANGELOG
 * - Track 3.1: Input-proportional pacing contracts — INPUT_SIZE_TIERS (TINY<=12/SMALL<=90/MEDIUM<=400/EXPANSIVE) with beat budgets, classify_input_size + resolve_beat_budget_plan, <BEAT_BUDGET> child in every DELIVERY_POSTURE; gated ANTI_STAGING (terse dialogue) + HELD_MOMENT (explicit pause markers, never blank) constraint children via plan.constraints.
 * - Track 0.10: Section 6 dissolved - render_subtext_xml + resolve_physics_protocols move to physics.js (beside the registries they read), render_available_keywords_xml moves to task.js (beside KEYWORD_DIRECTIVES); STYLE_MOTIF_REGISTRY and escape_xml imports dropped. Prompt bytes byte-identical.
 * - 2026-10-07: Plan Omega for Task — repatriated render_subtext_xml, resolve_physics_protocols, and render_available_keywords_xml from task.js (new Section 6; STYLE_MOTIF_REGISTRY imported from @data, escape_xml added to @utils import) — prompt bytes byte-identical.

 * - 2026-10-04: Single has_input resolution (Plan A) — resolve_task_values owns values.has_input + values.turn_state; posture plan and director_directives accept the pre-resolved flags (standalone callers still derive); prose_posture threads the bag flag — prompt bytes byte-identical.
 * - 2026-10-04: Environmental-hint envelope (stability-lock treatment) — prefix drops from the body, CONDITIONALS.ENVIRONMENTAL_HINT flags enveloped:true, get_reflex_atom wraps flagged records, render_environmental_hint shares the compiler path; no fixture input fires the hint so contract baselines are untouched.
 * - 2026-10-04: Style-DNA single parse (style.js resolve_style_dna) — resolve_prose_posture_plan reads pre-resolved snapshot.style_dna, @data import dropped; build_pacing_directive retired (no production callers; pacing covered by the posture plan) — prompt bytes byte-identical.
 * - 2026-10-04: Catalog-owns-everything (Plan B) — PACING_BANDS becomes the ordered PACING_RULES table (first-match-wins + ADAPTIVE tail; classify_pacing walks it, zero English in logic), HINT_SIGNALS owns verb/noun precedence (detect_environmental_hint walks it), STABILITY_LOCK/TRUNCATION_COMPLETE_NOTE derived aliases retired (callers read REFLEX_LIBRARY.RECOVERY directly: story.js, system.test.js), render_alternation_block folds into render_alternation_protocol(text, {force}) (protocols.js plan renderer passes force:true) — prompt bytes byte-identical.
 * - 2026-10-04: Removed the VOICE atom (hallucinated steering — no caller ever set speaking_style, register is entity data enforced by detox_prose); posture plans are {pacing, rhythm, drive}.
 * - 2026-10-04: Absorbed the transient turn-state conditionals (FIRST_CONTACT ex-PROSE.CHARACTER, ROUND_ONE/EVALUATION_INPUT/EVALUATION_SCENE ex-DIRECTOR) into REFLEX_LIBRARY.TURN_STATE with resolve_turn_state_plan owning the firing flags — prompt bytes byte-identical.
 * - 2026-10-04: Stability escalation renders as the <STABILITY_LOCK level> envelope (bare WARNING:/CRITICAL: lines retired); contract fixtures never trigger errors so inventories and sizes are untouched.
 * - 2026-10-04: Plan/render split + catalog normalization (Plans 1+2) — REFLEX_LIBRARY atoms are bare bodies ({tag,body}/{tag,template}; envelope wrapping is renderer-owned), REFLEX_DEFAULTS owns pacing bands/stability ladder/detectors, resolve_*_plan functions own all selection as frozen data, render_* functions only wrap; get_reflex_atom is the single REFLEX.* resolver (task.js delegates); RECENCY splits into RHYTHM + DRIVE, recovery copy lives in RECOVERY with STABILITY_LOCK/TRUNCATION_COMPLETE_NOTE derived from it; build_pacing_directive/render_prose_reflex/render_environmental_hint/resolve_stability_lock are plan-backed adapters — prompt bytes byte-identical.
 * - 2026-10-04: Added render_alternation_block for plan-gated callers (protocols.js plan renderer); text-gated render_alternation_protocol unchanged.
 * - 2026-10-04: Absorbed the alternation conditional (REFLEX_LIBRARY.ALTERNATION + render_alternation_protocol, ex-protocols.js) — reactive option-picking lives with the other reflexes.
 * - 2026-10-04: Created from task.js Section 3 (pacing/reflex engine) plus stability/truncation recovery (from recovery.js, now deleted) — the reflex layer owns calibration + resilience; task.js keeps turn assembly with live TASK_LIBRARY references.
 * Modules Ground Refactor Phase 1 — get_reflex_atom delegates lookup to utils/catalog.js resolve_catalog_atom; enveloped wrapping stays record-driven — prompt bytes byte-identical.
 */
