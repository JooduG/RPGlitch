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
 * task.js, which consumes this module and keeps live references in
 * TASK_LIBRARY so directive keys and prompt bytes are unchanged).
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string catalog + pure functions over
 *   @utils + @data. Zero sibling imports (no task.js cycle).
 * - Single source of truth for pacing/recency/voice/environmental-hint copy
 *   and for stability-lock/truncation recovery copy.
 * ============================================================================
 */

import { escape_xml, prompt_escape, render_xml_tag, has_alternations } from "@utils";
import { extract_style_dna } from "@data";

// ============================================================================
// [SECTION 1: STRUCTURAL RECOVERY]
// ============================================================================

export const STABILITY_LOCK = Object.freeze({
  WARNING: "WARNING: Structural drift detected. Ensure all XML tags close cleanly.",
  CRITICAL: "CRITICAL: Structural collapse. Every XML tag must close cleanly.",
});

export const TRUNCATION_COMPLETE_NOTE =
  "\n\nIMPORTANT: Previous reply cut off mid-sentence. Complete the response directly without repeating earlier text or rehashing events. Conclude on a complete sentence.";

/**
 * Resolves appropriate stability lock escalation message based on recorded structural errors.
 * @param {Object} [metadata]
 * @param {number} [metadata.structural_errors]
 * @returns {string}
 */
export function resolve_stability_lock(metadata) {
  const errors = Number(metadata?.structural_errors) || 0;
  if (errors >= 3) return STABILITY_LOCK.CRITICAL;
  if (errors >= 1) return STABILITY_LOCK.WARNING;
  return "";
}

// ============================================================================
// [SECTION 2: REFLEX CATALOG — PACING, RECENCY, VOICE & HINTS]
// ============================================================================

export const REFLEX_LIBRARY = Object.freeze({
  PACING: Object.freeze({
    TERSE: `<PACING mode="TERSE">Brief, weighted reply in 1-2 sharp beats. Zero padding.</PACING>`,
    ADAPTIVE: `<PACING mode="ADAPTIVE">A reply of 2-4 sentences—substantive, driving the scene forward.</PACING>`,
    EXPANSIVE: `<PACING mode="EXPANSIVE">Expand to match message breadth; close on one decisive hook.</PACING>`,
  }),

  RECENCY: Object.freeze({
    RHYTHM_DEFAULT:
      "Hold temperament; resist passive compliance. Match conversational scale and build situational friction rather than rushing resolution.",
    DRIVE_WITH_INPUT:
      "Advance the scene in response to «INPUT»: drive the beat forward independently and end on an unresolved hook demanding response.",
    DRIVE_WITHOUT_INPUT:
      "Take active initiative: drive events forward on your own terms through decisive actions and end on an unresolved hook demanding response.",
  }),

  VOICE: "Deliver dialogue matching the {speaking_style} speaking register.",

  ENVIRONMENTAL_HINT:
    'ENVIRONMENTAL HINT: Non-verbal environmental action. Strongly consider setting "speaker" to "fractal" to narrate the setting, unless AI character should react directly.',

  ALTERNATION: `Resolve {Option A|Option B} alternations by selecting exactly ONE contextually fitting option. Emit only the chosen text—never echo braces or pipes, blend choices, or output multiple options simultaneously.`,
});

// ============================================================================
// [SECTION 3: PROSE REFLEX & INPUT REACTION ENGINE]
// ============================================================================

const DIALOGUE_QUOTES_PATTERN = /["'“”‘’]/;

const ACTION_VERBS_PATTERN =
  /\b(?:approach|ascend|bend|circle|climb|close|dash|descend|draw|draws|edge|enter|examine|follow|gaze|grab|grabs|gripp?|halt|kneel|leap|linger|listen|lower|move|nod|nods|observe|open|opens|pause|peer|press|pull|pulls|push|pushes|raise|raises|reach|rest|run|say|says|scan|set|settle|shake|shakes|shout|shouts|sit|sits|slam|slip|smell|stand|stands|stare|step|steps|strike|study|sweep|swing|take|takes|trail|turn|turns|wait|walk|watch|whisper|whispers)\b/i;

const SPATIAL_NOUNS_PATTERN =
  /\b(?:alcove|alley|altar|arch|belly|bridge|cave|ceiling|chamber|column|conduit|corridor|court|crevice|cylinder|deeps|door|field|floor|forest|gate|gear|hall|keep|ledge|light|lock|mechanism|mouth|passage|rain|river|rock|room|seal|shadow|sky|spillway|stair|stone|street|threshold|tower|tunnel|vault|wall|water|wheel|wind|window|yard)\b/i;

/**
 * Pacing calibration: classifies user message scale and returns kinetic length directive.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function build_pacing_directive(input) {
  const pacing = REFLEX_LIBRARY.PACING;
  const text = String(input || "").trim();
  if (!text) return pacing.TERSE;

  const character_count = text.length;
  const word_count = text.split(/\s+/).filter(Boolean).length;
  if (character_count >= 300 || word_count >= 60) return pacing.EXPANSIVE;
  if (character_count <= 40 || word_count <= 8) return pacing.TERSE;

  return pacing.ADAPTIVE;
}

/**
 * Compiles the canonical <ALTERNATION_OPTIONS> protocol tag if the input text contains {Option A|Option B} alternations.
 * @param {string} text - Input text or serialized entity sheet
 * @returns {string} Formatted <ALTERNATION_OPTIONS> block or empty string
 */
export function render_alternation_protocol(text = "") {
  if (!has_alternations(text)) return "";
  return render_xml_tag({
    tag: "ALTERNATION_OPTIONS",
    children: [REFLEX_LIBRARY.ALTERNATION],
    inline: true,
  });
}

/**
 * Detects a non-verbal, environmental user turn and returns a hint nudging the Director.
 * @param {string|null|undefined} input
 * @returns {string}
 */
export function render_environmental_hint(input) {
  if (!input?.trim()) return "";
  if (DIALOGUE_QUOTES_PATTERN.test(input)) return "";
  if (!ACTION_VERBS_PATTERN.test(input) && !SPATIAL_NOUNS_PATTERN.test(input)) return "";
  return REFLEX_LIBRARY.ENVIRONMENTAL_HINT;
}

/**
 * Prose Reflex (Delivery Posture) — kinetic reaction envelope calibrated to user input and active voice.
 * @param {any} snapshot - { dynamics?, style?, speaking_style?, speaker? }
 * @param {string} [input] - current user action / scene beat
 * @param {string} [speaking_style=""] - active speaking style register override
 * @returns {string}
 */
export function render_prose_reflex(snapshot, input, speaking_style = "") {
  const style_dna = extract_style_dna(snapshot?.style || null);
  const { RHYTHM_DEFAULT, DRIVE_WITH_INPUT, DRIVE_WITHOUT_INPUT } = REFLEX_LIBRARY.RECENCY;
  const pacing = build_pacing_directive(input);
  const rhythm = style_dna.sentence_rhythm || RHYTHM_DEFAULT;
  const drive = String(input || "").trim() ? DRIVE_WITH_INPUT : DRIVE_WITHOUT_INPUT;
  const resolved_speaking_style = speaking_style || snapshot?.speaking_style || snapshot?.speaker?.speaking_style || "";

  const children = [
    pacing,
    `<RHYTHM>${prompt_escape(rhythm)}</RHYTHM>`,
    `<DRIVE>${prompt_escape(drive)}</DRIVE>`,
    resolved_speaking_style
      ? render_xml_tag({
          tag: "VOICE",
          attrs: { mode: String(resolved_speaking_style).toLowerCase() },
          children: [REFLEX_LIBRARY.VOICE.replace("{speaking_style}", escape_xml(String(resolved_speaking_style)))],
          inline: true,
        })
      : null,
  ].filter(Boolean);

  return render_xml_tag({
    tag: "DELIVERY_POSTURE",
    children,
    indent: 0,
    child_indent: 4,
    separator: "\n",
  });
}

/**
 * CHANGELOG
 * - 2026-10-04: Absorbed the alternation conditional (REFLEX_LIBRARY.ALTERNATION + render_alternation_protocol, ex-protocols.js) — reactive option-picking lives with the other reflexes.
 * - 2026-10-04: Created from task.js Section 3 (pacing/reflex engine) plus stability/truncation recovery (from recovery.js, now deleted) — the reflex layer owns calibration + resilience; task.js keeps turn assembly with live TASK_LIBRARY references.
 */
