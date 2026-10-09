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
    /\bbreath (hitched|caught|hitched in|caught in)\b/i,
    /\bheld (his|her|their) breath\b/i,
    /\bstomach (dropped|twisted|churned|lurched)\b/i,
    /\bblood ran cold\b/i,
    /\bskin (prickled|crawled)\b/i,
    /\bknees (went weak|buckled)\b/i,
    /\bhands? (trembled|shook)\b/i,
    /\bpulse (quickened|roared|pounded)\b/i,
    /\bthroat (went dry|tightened|closed)\b/i,
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
