/**
 * src/intelligence/modules/reflex.js
 * ============================================================================
 * 🪞 REFLEX MODULE — Pacing, Delivery Posture & Structural Recovery
 * ============================================================================
 *
 * Owns the turn-level reflex layer: how the model calibrates reply length and
 * drive (pacing classification, environmental-hint detection, delivery
 * posture), plus structural error recovery (stability-lock escalation and the
 * truncation completion note). These are resilience concerns, not identity
 * (role lines live in system.js) and not turn assembly (envelopes live in
 * task.js, which consumes this module through get_reflex_atom and the
 * plan-backed entry points below).
 *
 * Architecture & Modification Rules:
 * - Catalog + compiler + plans + thin renderers (protocols.js pattern):
 *   `REFLEX_LIBRARY` holds bare string atoms and {tag,body}/{tag,template}
 *   records — never pre-wrapped XML; `get_reflex_atom` is the single dotted-key
 *   resolver; `resolve_*_plan` functions own every selection as frozen pure
 *   data; `render_*` functions map plans to XML without branching.
 * - Unidirectional layer flow: pure string catalog + pure functions over
 *   @utils + @data. Zero sibling imports (no task.js cycle).
 * - Single source of truth for pacing/rhythm/drive/voice/environmental-hint
 *   copy and for stability-lock/truncation recovery copy.
 * ============================================================================
 */

import { escape_xml, prompt_escape, render_xml_tag, has_alternations } from "@utils";
import { extract_style_dna } from "@data";

// ============================================================================
// [SECTION 1: REFLEX DEFAULTS — FROZEN CALIBRATION CONFIG]
// ============================================================================

/**
 * Frozen calibration config: pacing length bands, stability escalation rungs
 * (first match wins, ordered most-severe first), and input-signal detectors.
 * Tuning calibration is a data edit here — never a renderer edit.
 */
export const REFLEX_DEFAULTS = Object.freeze({
  PACING_BANDS: Object.freeze({
    TERSE: Object.freeze({ max_chars: 40, max_words: 8 }),
    EXPANSIVE: Object.freeze({ min_chars: 300, min_words: 60 }),
  }),
  STABILITY_LADDER: Object.freeze([Object.freeze({ at: 3, level: "CRITICAL" }), Object.freeze({ at: 1, level: "WARNING" })]),
  DETECTORS: Object.freeze({
    DIALOGUE_QUOTES: /["'“”‘’]/,
    ACTION_VERBS:
      /\b(?:approach|ascend|bend|circle|climb|close|dash|descend|draw|draws|edge|enter|examine|follow|gaze|grab|grabs|gripp?|halt|kneel|leap|linger|listen|lower|move|nod|nods|observe|open|opens|pause|peer|press|pull|pulls|push|pushes|raise|raises|reach|rest|run|say|says|scan|set|settle|shake|shakes|shout|shouts|sit|sits|slam|slip|smell|stand|stands|stare|step|steps|strike|study|sweep|swing|take|takes|trail|turn|turns|wait|walk|watch|whisper|whispers)\b/i,
    SPATIAL_NOUNS:
      /\b(?:alcove|alley|altar|arch|belly|bridge|cave|ceiling|chamber|column|conduit|corridor|court|crevice|cylinder|deeps|door|field|floor|forest|gate|gear|hall|keep|ledge|light|lock|mechanism|mouth|passage|rain|river|rock|room|seal|shadow|sky|spillway|stair|stone|street|threshold|tower|tunnel|vault|wall|water|wheel|wind|window|yard)\b/i,
  }),
});

// ============================================================================
// [SECTION 2: REFLEX CATALOG — PACING, RHYTHM, DRIVE, VOICE & CONDITIONALS]
// ============================================================================

/**
 * Normalized reflex catalog: every atom is a bare body ({tag,body} records for
 * XML-wrapped atoms, {tag,template,tokens} for interpolated ones). Envelope
 * wrapping is renderer-owned (Section 5), so atoms stay retaggable without
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

  VOICE: Object.freeze({
    tag: "VOICE",
    template: "Deliver dialogue matching the {speaking_style} speaking register.",
    tokens: Object.freeze(["speaking_style"]),
  }),

  CONDITIONALS: Object.freeze({
    ENVIRONMENTAL_HINT: Object.freeze({
      tag: "ENVIRONMENTAL_HINT",
      body: 'ENVIRONMENTAL HINT: Non-verbal environmental action. Strongly consider setting "speaker" to "fractal" to narrate the setting, unless AI character should react directly.',
    }),
    ALTERNATION: Object.freeze({
      tag: "ALTERNATION_OPTIONS",
      body: `Resolve {Option A|Option B} alternations by selecting exactly ONE contextually fitting option. Emit only the chosen text—never echo braces or pipes, blend choices, or output multiple options simultaneously.`,
    }),
  }),

  RECOVERY: Object.freeze({
    STABILITY: Object.freeze({
      WARNING: Object.freeze({
        tag: "STABILITY_LOCK",
        level: "WARNING",
        body: "WARNING: Structural drift detected. Ensure all XML tags close cleanly.",
      }),
      CRITICAL: Object.freeze({ tag: "STABILITY_LOCK", level: "CRITICAL", body: "CRITICAL: Structural collapse. Every XML tag must close cleanly." }),
    }),
    TRUNCATION: Object.freeze({
      tag: "TRUNCATION_NOTE",
      body: "\n\nIMPORTANT: Previous reply cut off mid-sentence. Complete the response directly without repeating earlier text or rehashing events. Conclude on a complete sentence.",
    }),
  }),
});

/**
 * Stability-lock escalation copy, read from the catalog so the recovery atoms
 * have exactly one owner.
 */
export const STABILITY_LOCK = Object.freeze({
  WARNING: REFLEX_LIBRARY.RECOVERY.STABILITY.WARNING.body,
  CRITICAL: REFLEX_LIBRARY.RECOVERY.STABILITY.CRITICAL.body,
});

/**
 * Truncation completion note, read from the catalog so recovery copy has
 * exactly one owner.
 */
export const TRUNCATION_COMPLETE_NOTE = REFLEX_LIBRARY.RECOVERY.TRUNCATION.body;

// ============================================================================
// [SECTION 3: REFLEX PLANS — PURE DATA, NO XML]
// ============================================================================

/**
 * Pacing calibration plan: classifies user message scale into a frozen
 * {level, chars, words} plan. Bands come from REFLEX_DEFAULTS.
 * @param {string|null|undefined} input
 * @returns {Readonly<{ level: "TERSE"|"ADAPTIVE"|"EXPANSIVE", chars: number, words: number }>}
 */
export function classify_pacing(input) {
  const bands = REFLEX_DEFAULTS.PACING_BANDS;
  const text = String(input || "").trim();
  if (!text) return Object.freeze({ level: "TERSE", chars: 0, words: 0 });
  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (chars >= bands.EXPANSIVE.min_chars || words >= bands.EXPANSIVE.min_words) return Object.freeze({ level: "EXPANSIVE", chars, words });
  if (chars <= bands.TERSE.max_chars || words <= bands.TERSE.max_words) return Object.freeze({ level: "TERSE", chars, words });
  return Object.freeze({ level: "ADAPTIVE", chars, words });
}

/**
 * Environmental-hint detection plan: classifies a user turn as verbal or
 * non-verbal/environmental, with the reason for the decision.
 * @param {string|null|undefined} input
 * @returns {Readonly<{ hit: boolean, reason: "blank"|"quotes"|"no-signal"|"verb"|"noun" }>}
 */
export function detect_environmental_hint(input) {
  const detectors = REFLEX_DEFAULTS.DETECTORS;
  if (!input?.trim()) return Object.freeze({ hit: false, reason: "blank" });
  if (detectors.DIALOGUE_QUOTES.test(input)) return Object.freeze({ hit: false, reason: "quotes" });
  const verb = detectors.ACTION_VERBS.test(input);
  const noun = detectors.SPATIAL_NOUNS.test(input);
  if (!verb && !noun) return Object.freeze({ hit: false, reason: "no-signal" });
  return Object.freeze({ hit: true, reason: verb ? "verb" : "noun" });
}

/**
 * Resolves snapshot + input into a frozen delivery-posture plan. Every
 * selection (pacing band, rhythm source, drive kind, voice register) happens
 * here — the renderer maps plan fields to envelopes without branching.
 * @param {any} snapshot - { dynamics?, style?, speaking_style?, speaker? }
 * @param {string} [input] - current user action / scene beat
 * @param {string} [speaking_style=""] - active speaking style register override
 * @returns {Readonly<{ pacing: Readonly<{ level: string, chars: number, words: number }>, rhythm: Readonly<{ source: "style_dna"|"default", body: string }>, drive: Readonly<{ kind: "with_input"|"without_input", body: string }>, voice: Readonly<{ style: string, mode: string }>|null }>}
 */
export function resolve_prose_posture_plan(snapshot, input, speaking_style = "") {
  const pacing = classify_pacing(input);
  const style_dna = extract_style_dna(snapshot?.style || null);
  const has_input = Boolean(String(input || "").trim());
  const drive_key = has_input ? "WITH_INPUT" : "WITHOUT_INPUT";
  const resolved_speaking_style = speaking_style || snapshot?.speaking_style || snapshot?.speaker?.speaking_style || "";
  return Object.freeze({
    pacing,
    rhythm: Object.freeze({
      source: style_dna.sentence_rhythm ? "style_dna" : "default",
      body: style_dna.sentence_rhythm || REFLEX_LIBRARY.RHYTHM.DEFAULT.body,
    }),
    drive: Object.freeze({ kind: has_input ? "with_input" : "without_input", body: REFLEX_LIBRARY.DRIVE[drive_key].body }),
    voice: resolved_speaking_style
      ? Object.freeze({ style: String(resolved_speaking_style), mode: String(resolved_speaking_style).toLowerCase() })
      : null,
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

// ============================================================================
// [SECTION 4: REFLEX ATOM COMPILER — SINGLE DOTTED-KEY RESOLVER]
// ============================================================================

/**
 * Resolves one dotted reflex key (`REFLEX.*` prefix optional) to its body with
 * `{placeholder}` tokens interpolated from the values bag. Branch keys and
 * unknown keys resolve to "". The single exact matcher for reflex emission —
 * task.js delegates its REFLEX.* directive keys here.
 * @param {string} directive_key - Dotted reflex path (e.g. "REFLEX.CONDITIONALS.ENVIRONMENTAL_HINT")
 * @param {Record<string, any>} [values={}]
 * @returns {string}
 */
export function get_reflex_atom(directive_key, values = {}) {
  const directive_parts = String(directive_key ?? "")
    .trim()
    .split(".");
  const atom = (directive_parts[0] === "REFLEX" ? directive_parts.slice(1) : directive_parts).reduce(
    (node, part) => node?.[part],
    /** @type {any} */ (REFLEX_LIBRARY),
  );
  if (atom == null) return "";
  const template = typeof atom === "string" ? atom : (atom.body ?? atom.template ?? "");
  if (typeof template !== "string" || !template) return "";
  return template.replace(/\{([a-z0-9_]+)\}/g, (match, token) => (values[token] != null ? String(values[token]) : ""));
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
 * Maps a prose-posture plan to the Layer 6 <DELIVERY_POSTURE> envelope. Every
 * selection is already plan data — this function only wraps.
 * @param {ReturnType<typeof resolve_prose_posture_plan>|null|undefined} plan
 * @returns {string}
 */
export function render_prose_posture_plan(plan) {
  if (!plan) return "";
  const children = [
    render_pacing_atom(plan.pacing?.level),
    render_xml_tag({ tag: REFLEX_LIBRARY.RHYTHM.DEFAULT.tag, children: [prompt_escape(plan.rhythm.body)], inline: true }),
    render_xml_tag({ tag: REFLEX_LIBRARY.DRIVE.WITH_INPUT.tag, children: [prompt_escape(plan.drive.body)], inline: true }),
    plan.voice
      ? render_xml_tag({
          tag: REFLEX_LIBRARY.VOICE.tag,
          attrs: { mode: plan.voice.mode },
          children: [REFLEX_LIBRARY.VOICE.template.replace("{speaking_style}", escape_xml(plan.voice.style))],
          inline: true,
        })
      : null,
  ].filter(Boolean);
  return render_xml_tag({ tag: "DELIVERY_POSTURE", children, indent: 0, child_indent: 4, separator: "\n" });
}

/**
 * Maps a stability plan to its escalation message (bare string, no envelope).
 * @param {ReturnType<typeof resolve_stability_plan>|null|undefined} plan
 * @returns {string}
 */
export function render_stability_plan(plan) {
  if (!plan || plan.level === "NONE") return "";
  return REFLEX_LIBRARY.RECOVERY.STABILITY[plan.level].body;
}

/**
 * Renders the unconditional <ALTERNATION_OPTIONS> block (plan-gated callers
 * use this; text-gated callers use render_alternation_protocol).
 * @returns {string} Formatted <ALTERNATION_OPTIONS> block
 */
export function render_alternation_block() {
  const atom = REFLEX_LIBRARY.CONDITIONALS.ALTERNATION;
  return render_xml_tag({ tag: atom.tag, children: [atom.body], inline: true });
}

/**
 * Compiles the canonical <ALTERNATION_OPTIONS> protocol tag if the input text contains {Option A|Option B} alternations.
 * @param {string} text - Input text or serialized entity sheet
 * @returns {string} Formatted <ALTERNATION_OPTIONS> block or empty string
 */
export function render_alternation_protocol(text = "") {
  if (!has_alternations(text)) return "";
  return render_alternation_block();
}

// ============================================================================
// [SECTION 6: PUBLIC ENTRY POINTS — PLAN-BACKED STABLE API]
// ============================================================================

/**
 * Pacing calibration: classifies user message scale and returns kinetic length directive.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function build_pacing_directive(input) {
  return render_pacing_atom(classify_pacing(input).level);
}

/**
 * Detects a non-verbal, environmental user turn and returns a hint nudging the Director.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function render_environmental_hint(input) {
  const detection = detect_environmental_hint(input);
  return detection.hit ? REFLEX_LIBRARY.CONDITIONALS.ENVIRONMENTAL_HINT.body : "";
}

/**
 * Prose Reflex (Delivery Posture) — kinetic reaction envelope calibrated to user input and active voice.
 * @param {any} snapshot - { dynamics?, style?, speaking_style?, speaker? }
 * @param {string} [input] - current user action / scene beat
 * @param {string} [speaking_style=""] - active speaking style register override
 * @returns {string}
 */
export function render_prose_reflex(snapshot, input, speaking_style = "") {
  return render_prose_posture_plan(resolve_prose_posture_plan(snapshot, input, speaking_style));
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
 * - 2026-10-04: Plan/render split + catalog normalization (Plans 1+2) — REFLEX_LIBRARY atoms are bare bodies ({tag,body}/{tag,template}; envelope wrapping is renderer-owned), REFLEX_DEFAULTS owns pacing bands/stability ladder/detectors, resolve_*_plan functions own all selection as frozen data, render_* functions only wrap; get_reflex_atom is the single REFLEX.* resolver (task.js delegates); RECENCY splits into RHYTHM + DRIVE, recovery copy lives in RECOVERY with STABILITY_LOCK/TRUNCATION_COMPLETE_NOTE derived from it; build_pacing_directive/render_prose_reflex/render_environmental_hint/resolve_stability_lock are plan-backed adapters — prompt bytes byte-identical.
 * - 2026-10-04: Added render_alternation_block for plan-gated callers (protocols.js plan renderer); text-gated render_alternation_protocol unchanged.
 * - 2026-10-04: Absorbed the alternation conditional (REFLEX_LIBRARY.ALTERNATION + render_alternation_protocol, ex-protocols.js) — reactive option-picking lives with the other reflexes.
 * - 2026-10-04: Created from task.js Section 3 (pacing/reflex engine) plus stability/truncation recovery (from recovery.js, now deleted) — the reflex layer owns calibration + resilience; task.js keeps turn assembly with live TASK_LIBRARY references.
 */
