/**
 * src/utils/styles.js
 * 🎨 STYLE RESOLUTION ENGINE
 *
 * Core Responsibilities:
 * - Cross-layer resolution of active styles (visual, narrative, speaking) across entity overrides and app settings.
 *   (Prose detox lives in ./detox.js; this module re-exports its VALID_SPEAKING_STYLES.)
 * - Speaking Style Hierarchy Resolution: Entity Speaking Style > Narrative Style Preset > "casual" default.
 * - AI Prose Detoxification (`detox_prose`): Intercepts and scrubs purple prose clichés, overused sensory crutches,
 *   and formulaic LLM sentence structures (denial-then-affirmation, self-answering dialogue, binary comparisons).
 * - Verb Conjugation & Case Preservation: Maps matching grammatical suffixes (-ed, -ing, -s, -es, -ly) and matches source casing.
 * - Decoupled Registry Integration: Rules are registered dynamically via `register_speaking_rules` to prevent circular dependencies.
 *
 * Consumed by:
 * - `src/intelligence/story-pipeline.js` (Prose cleanup before log persistence and streaming).
 * - `src/ui/message/render.js` (Message rendering and display transformations).
 * - `src/media/visual.svelte.js` (Visual style resolution for image generation).
 */

import { state_bridge } from "./bridges.js";
import { VALID_SPEAKING_STYLES } from "./detox.js";

export { VALID_SPEAKING_STYLES };

// ============================================================================
// [SECTION 1: NARRATIVE SLOP LINTER (Track 3.1)]
// ============================================================================

/**
 * Frozen slop catalog: repetitive narrative clichés the detox pass does not
 * structurally rewrite, plus the cliché somatic-marker set capped at one
 * occurrence per reply. Data-only — detection and enforcement below walk it.
 */
export const SLOP_PATTERNS = Object.freeze({
  CLICHES: Object.freeze([
    /\bagainst better judgment\b/i,
    /\bfor what felt like an eternity\b/i,
    /\btime (seemed|felt) to (slow|stop|stand still)\b/i,
    /\ba shiver (ran|went|crawled) down\b/i,
    /\bher word(s)? (hung|lingered) in the air\b/i,
    /\bhis word(s)? (hung|lingered) in the air\b/i,
    /\bwords? (hung|lingered) in the air\b/i,
    /\bcould cut the tension with a knife\b/i,
    /\bdeafening silence\b/i,
    /\bpregnant (pause|silence)\b/i,
  ]),
  SOMATIC_MARKERS: Object.freeze([
    /\bheart (pounded|hammered|raced|thudded|fluttered)\b/i,
    /\bbreath (hitched|caught|hitched in|caught in|stuttered)\b/i,
    /\bheld (his|her|their) breath\b/i,
    /\bstomach (dropped|twisted|churned|lurched)\b/i,
    /\bblood ran cold\b/i,
    /\bskin (prickled|crawled)\b/i,
    /\bknees (went weak|buckled)\b/i,
    /\bhands? (trembled|shook)\b/i,
    /\bpulse (quickened|roared|pounded)\b/i,
    /\bthroat (went dry|tightened|closed)\b/i,
    /\bghost of a (smirk|smile)\b/i,
    /\bbarely above a whisper\b/i,
    /\beyes (darkened|flashed|narrowed|hardened)\b/i,
    /\b(jaw|mouth) (tight|tightened|set|clenched|locked)\b/i,
    /\bfists? (clenched|tightened)\b/i,
    /\bran a hand through (his|her|their) hair\b/i,
    /\btime seemed to (stop|slow)\b/i,
  ]),
});

export const SOMATIC_MARKER_CAP = 1;

/**
 * Lints a prose reply for narrative slop: cliché hits plus cliché somatic
 * markers over the per-reply cap.
 * @param {string|null|undefined} text
 * @returns {Readonly<{ violations: ReadonlyArray<Readonly<{ kind: string, match: string }>>, somatic_count: number, over_cap: boolean }>}
 */
export function lint_narrative_slop(text) {
  const source = String(text || "");
  const violations = [];
  for (const pattern of SLOP_PATTERNS.CLICHES) {
    const hit = source.match(pattern);
    if (hit) violations.push(Object.freeze({ kind: "cliche", match: hit[0] }));
  }
  let somatic_count = 0;
  for (const pattern of SLOP_PATTERNS.SOMATIC_MARKERS) {
    const hits = source.match(new RegExp(pattern.source, "gi")) || [];
    for (const hit of hits) {
      somatic_count += 1;
      violations.push(Object.freeze({ kind: "somatic_marker", match: hit }));
    }
  }
  return Object.freeze({ violations: Object.freeze(violations), somatic_count, over_cap: somatic_count > SOMATIC_MARKER_CAP });
}

/**
 * Enforces the somatic-marker cap: keeps the first marker occurrence intact and
 * strips the matched marker phrase from every later occurrence, collapsing the
 * leftover whitespace. Pure text surgery — sentence structure is preserved.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function cap_somatic_markers(text) {
  const source = String(text || "");
  if (!source) return "";
  const hits = [];
  for (const pattern of SLOP_PATTERNS.SOMATIC_MARKERS) {
    for (const match of source.matchAll(new RegExp(pattern.source, "gi"))) {
      hits.push({ index: match.index ?? 0, length: match[0].length });
    }
  }
  if (hits.length <= SOMATIC_MARKER_CAP) return source;
  hits.sort((left, right) => left.index - right.index);
  const doomed = hits.slice(SOMATIC_MARKER_CAP).sort((left, right) => right.index - left.index);
  let output = source;
  for (const hit of doomed) output = output.slice(0, hit.index) + output.slice(hit.index + hit.length);
  return output.replace(/[ \t]{2,}/g, " ").replace(/\s+([,;.!?])/g, "$1");
}

// ============================================================================
// [SECTION 2: STYLE HIERARCHY RESOLVERS]
// ============================================================================

/**
 * Resolves an active style key across an explicit entity override and global app settings.
 * @param {string | undefined} explicit_style - Explicit style key from entity/fractal.
 * @param {string} app_setting_key - Key in app settings (e.g. "narrative_style" | "visual_style").
 * @param {Record<string, any>} [registry={}] - Registry dictionary for validating key existence.
 * @param {string} [fallback=""] - Fallback key when no active style is found.
 * @returns {string} Resolved style identifier.
 */
export function resolve_style(explicit_style, app_setting_key, registry = {}, fallback = "") {
  if (explicit_style && explicit_style !== "default" && explicit_style !== "" && registry?.[explicit_style]) {
    return explicit_style;
  }

  const app_style = state_bridge.app?.settings?.[app_setting_key];
  if (app_style && app_style !== "default" && registry?.[app_style]) {
    return app_style;
  }

  return fallback;
}

/**
 * Resolves the active speaking style based on entity and narrative style hierarchy.
 * Priority: Entity Speaking Style > Narrative Style Preset > "casual" (default).
 * @param {Record<string, any> | null} [entity=null] - Active character or user entity.
 * @param {string | Record<string, any> | null} [narrative_style=null] - Active narrative style ID or style object.
 * @returns {SpeakingStyleId} Resolved speaking style identifier.
 */
export function resolve_speaking_style(entity = null, narrative_style = null) {
  const entity_style = entity?.speaking_style;
  if (entity_style && VALID_SPEAKING_STYLES.has(entity_style)) {
    return /** @type {SpeakingStyleId} */ (entity_style);
  }

  const style_speaking = typeof narrative_style === "object" && narrative_style !== null ? narrative_style.speaking_style : null;

  if (style_speaking && VALID_SPEAKING_STYLES.has(style_speaking)) {
    return /** @type {SpeakingStyleId} */ (style_speaking);
  }

  return "casual";
}

// ============================================================================
// [SECTION 3: MACRO SHAPE AUDITOR (Track 3.4)]
// ============================================================================

/**
 * Audits macro shape of narrative prose:
 * - as_if_overuse: `as if` / `as though` > 2 in one reply
 * - every_para_question: every paragraph in a multi-paragraph reply ends in ?
 * - familiar_closer: final paragraph opens with Meanwhile / Then / Suddenly
 * - door_slam_closer: closing sentence ends on a door slam/shut beat
 *
 * @param {string|null|undefined} text
 * @returns {Readonly<{
 *   as_if_count: number,
 *   as_if_overuse: boolean,
 *   every_para_question: boolean,
 *   familiar_closer: boolean,
 *   door_slam_closer: boolean,
 *   violations: ReadonlyArray<string>
 * }>}
 */
export function audit_macro_shape(text) {
  const source = String(text || "").trim();
  if (!source) {
    return Object.freeze({
      as_if_count: 0,
      as_if_overuse: false,
      every_para_question: false,
      familiar_closer: false,
      door_slam_closer: false,
      violations: Object.freeze([]),
    });
  }

  const violations = [];

  // 1. as if overuse (> 2)
  const as_if_matches = source.match(/\bas\s+(?:if|though)\b/gi) || [];
  const as_if_count = as_if_matches.length;
  const as_if_overuse = as_if_count > 2;
  if (as_if_overuse) violations.push("as-if-overuse");

  // 2. every paragraph ends in a question
  const paragraphs = source
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const every_para_question = paragraphs.length >= 2 && paragraphs.every((p) => /\?["'”’]?$/.test(p));
  if (every_para_question) violations.push("every-para-question");

  // 3. familiar closer (final paragraph opens with Meanwhile / Then / Suddenly)
  const last_para = paragraphs[paragraphs.length - 1] || "";
  const familiar_closer = /^(?:meanwhile|then|suddenly)\b/i.test(last_para);
  if (familiar_closer) violations.push("familiar-closer");

  // 4. door slam closer
  const sentences = (source.match(/[^.!?…\n]+[.!?…]*/g) || []).map((s) => s.trim()).filter(Boolean);
  const last_sentence = sentences[sentences.length - 1] || "";
  const door_slam_closer = /\b(?:the\s+)?door\s+(?:slammed|slams|slam|shut|clicked)\b/i.test(last_sentence);
  if (door_slam_closer) violations.push("door-slam-closer");

  // 5. Tier 2 vocabulary cluster (>= 2 cluster words in single response)
  const cluster_words = _cached_cluster_words || [];
  let cluster_hit_count = 0;
  for (const word of cluster_words) {
    const word_regex = new RegExp(`\\b${word}(?:s|ed|ing|ly)?\\b`, "i");
    if (word_regex.test(source)) {
      cluster_hit_count += 1;
    }
  }
  const vocabulary_cluster = cluster_hit_count >= 2;
  if (vocabulary_cluster) violations.push("vocabulary-cluster");

  return Object.freeze({
    as_if_count,
    as_if_overuse,
    every_para_question,
    familiar_closer,
    door_slam_closer,
    cluster_hit_count,
    vocabulary_cluster,
    violations: Object.freeze(violations),
  });
}

/** @type {ReadonlyArray<string> | null} */
let _cached_cluster_words = null;

/**
 * Registers Tier 2 cluster words with the styles macro shape auditor.
 * @param {ReadonlyArray<string>} words
 */
export function register_cluster_words(words) {
  _cached_cluster_words = words;
}

/**
 * CHANGELOG
 * - Track 3.3: Expanded SOMATIC_MARKERS with stock faces (smirks, whispers, clenched fists, etc.) capped at 1 per reply.
 * - Track 3.4: Added audit_macro_shape auditing as-if-overuse (> 2), every-para-question, familiar-closer, and door-slam-closer.
 * - Track 3.5: Added Tier 2 vocabulary cluster linter (>= 2 cluster words per reply) via register_cluster_words.
 */
