/**
 * src/intelligence/prompts/physics-prompts.js
 * 🫀 SOMATIC & PHYSICS PROMPT DIRECTIVES
 *
 * Prompt XML compilers for dynamics and somatic tells:
 * - SOMATIC_REGISTRY (12 universal static physical archetypes)
 * - build_dynamics_legend (<DYNAMICS_LEGEND> XML compiler)
 * - format_dynamics_attrs (Dynamics parameter XML attributes)
 * - build_signals_xml (<DYNAMICS_SIGNALS> XML compiler)
 * - resolve_somatic_directives (Resolves keywords against static and style-motif registries)
 * - build_somatic_directives_xml (<SOMATIC_DIRECTIVES> XML compiler)
 * - build_available_keywords_xml (<AVAILABLE_KEYWORDS> XML compiler for Director)
 */

import { STYLE_MOTIF_REGISTRY } from "@data";
import { escape_xml } from "@utils";
import { DYNAMICS_AXES, resolve_non_verbal_reactions, evaluate_dynamics_signals } from "../physics.js";

// ── 1. Static Archetypes Registry ─────────────────────────────────────────────

/**
 * 12 universal static somatic & trauma archetypes.
 * @type {{ id: string, label: string, tells: string, directive: string }[]}
 */
export const SOMATIC_REGISTRY = [
  {
    id: "shame",
    label: "Shame",
    tells: "Averted eye contact, fidgeting fingers, heat rising in ears and collar, hunched shoulders.",
    directive: "Weave involuntary physical shame tells (averted gaze, flushed neck); attempts verbal deflection while posture collapses inward.",
  },
  {
    id: "fear",
    label: "Fear",
    tells: "Shallow breathing, locked jaw, cold sweat, scanning physical exits.",
    directive: "Physical freeze/flight response; hyper-vigilant scanning of immediate space.",
  },
  {
    id: "vulnerability",
    label: "Vulnerability",
    tells: "Unclenching hands, softened gaze, hesitant cadence, dropped defensive posture.",
    directive: "Defensive walls softening; cautious, tentative physical opening.",
  },
  {
    id: "betrayal",
    label: "Betrayal",
    tells: "Throat constricted, cold hands, sudden step backward, guarded silence.",
    directive: "Acute trust collapse; sudden physical withdrawal and rigid skepticism.",
  },
  {
    id: "abandonment",
    label: "Abandonment",
    tells: "Hollow stomach, chest tightness, searching gaze, abrupt cling or preemptive detachment.",
    directive: "Panic of separation; hyper-reactive to perceived emotional distance.",
  },
  {
    id: "emotional_neglect",
    label: "Emotional Neglect",
    tells: "Affect numbness, flat monotone delivery, drifting gaze, motionless hands.",
    directive: "Affect blunting and quiet withdrawal; disengages from connection effort.",
  },
  {
    id: "defiance",
    label: "Defiance",
    tells: "Raised chin, rigid spine, locked eye contact, squared stance.",
    directive: "Open resistance and pride; physical assertion against authority or pressure.",
  },
  {
    id: "intimacy",
    label: "Intimacy",
    tells: "Leaning inward, softened micro-expressions, matched breathing tempo, lingering contact.",
    directive: "Sensory closeness and reduced spatial distance; warmth and physical presence.",
  },
  {
    id: "grief",
    label: "Grief",
    tells: "Heavy swallow, pressure behind eyes, decelerated motor cadence, weighted pauses.",
    directive: "Visceral emotional weight; speech slowed and anchored in physical heaviness.",
  },
  {
    id: "dominance",
    label: "Dominance",
    tells: "Deliberate unhurried movements, spatial expansion, steady downward gaze.",
    directive: "Assert spatial control; unwavering presence and physical command.",
  },
  {
    id: "deception",
    label: "Deception",
    tells: "Calculated micro-pauses, forced smoothness, throat clearing, stiff hands.",
    directive: "Over-managed composure; unnatural control concealing rapid internal calculation.",
  },
  {
    id: "dysregulation",
    label: "Dysregulation",
    tells: "Pacing, fine motor tremors, erratic vocal cadence, rapid uneven respiration.",
    directive: "Cognitive overload; fragmented sentences and chaotic motor agitation.",
  },
];

/** Fast O(1) archetype lookup map */
const SOMATIC_MAP = new Map(SOMATIC_REGISTRY.map((entry) => [entry.id, entry]));

// ── 2. Dynamics XML Compilers ─────────────────────────────────────────────────

/** @type {string | null} */
let cached_dynamics_legend = null;

/**
 * Builds a dynamic rule guide explaining all simulation sliders to the LLM.
 * @returns {string}
 */
export function build_dynamics_legend() {
  if (cached_dynamics_legend !== null) return cached_dynamics_legend;
  if (!DYNAMICS_AXES) return "";

  const definitions = Object.entries(DYNAMICS_AXES)
    .map(([key, meta]) => `    - ${key} (${meta.label}): ${meta.desc}`)
    .join("\n");

  cached_dynamics_legend = `
<DYNAMICS_LEGEND>
  Scale: 0 (minimum) to 100 (maximum)
  Axes:
${definitions}
  Laws:
    1. Calibrate dynamics_deltas conservatively (+1 to +4 standard; +8 to +12 extreme).
    2. Adjust deltas carefully near boundaries (5 or 95) to prevent clipping at 0 or 100.
    3. Ensure state_append matches the mathematical intensity of selected deltas.
</DYNAMICS_LEGEND>`.trim();

  return cached_dynamics_legend;
}

/**
 * Compiles dynamic system parameter keys into inline XML attributes.
 * @param {Record<string, number>} [dynamics]
 * @returns {string}
 */
export function format_dynamics_attrs(dynamics) {
  if (!dynamics || typeof dynamics !== "object") return "";
  const attrs = Object.entries(dynamics)
    .map(([k, v]) => `${escape_xml(k)}="${Math.round(v)}"`)
    .join(" ");
  return attrs ? ` ${attrs}` : "";
}

/**
 * Renders the active narrative signals as a <DYNAMICS_SIGNALS> XML block.
 * @param {Record<string, number>} [ai_dynamics]
 * @param {Record<string, number>} [fractal_dynamics]
 * @param {{ style?: object }} [options]
 * @returns {string} XML block string, or "" when no signals are active.
 */
export function build_signals_xml(ai_dynamics = {}, fractal_dynamics = {}, options = {}) {
  const active = evaluate_dynamics_signals(ai_dynamics, fractal_dynamics, options?.style);
  if (active.length === 0) return "";
  const inner = active.map((s) => `      • ${s.text}`).join("\n");
  return `    <DYNAMICS_SIGNALS>\n${inner}\n    </DYNAMICS_SIGNALS>`;
}

// ── 3. Somatic Directive Compilers ───────────────────────────────────────────

/**
 * Resolves a list of chosen keywords against the static archetype registry and
 * the style-motif registry with O(1) efficiency.
 * @param {string[]} [keywords]
 * @returns {{ id: string, tells?: string, directive: string }[]}
 */
export function resolve_somatic_directives(keywords = []) {
  const resolved = [];
  for (const keyword of keywords || []) {
    if (!keyword || typeof keyword !== "string") continue;
    const static_def = SOMATIC_MAP.get(keyword);
    if (static_def) {
      resolved.push({ id: static_def.id, tells: static_def.tells, directive: static_def.directive });
      continue;
    }
    const motif = STYLE_MOTIF_REGISTRY[keyword];
    if (motif) resolved.push({ id: keyword, directive: motif.directive });
  }
  return resolved;
}

/**
 * Compiles dynamic somatic directives into a formatted <SOMATIC_DIRECTIVES> XML block.
 * Resolves thresholds from dynamics and manual keywords in a single linear pass.
 *
 * @param {string[]} [keywords=[]]
 * @param {Record<string, number>|null} [dynamics=null]
 * @returns {string}
 */
export function build_somatic_directives_xml(keywords = [], dynamics = null) {
  const resolved_keywords = dynamics ? resolve_non_verbal_reactions(dynamics, keywords) : keywords;
  const resolved = resolve_somatic_directives(resolved_keywords);
  if (resolved.length === 0) return "";

  const items = resolved.map((entry) => `- ${entry.id}: ${entry.directive}`).join("\n");
  return `\n<SOMATIC_DIRECTIVES>\n${items}\n</SOMATIC_DIRECTIVES>`;
}

/**
 * Builds <AVAILABLE_KEYWORDS> listing for the Director.
 * @param {string[]} [active_style_keywords]
 * @returns {string}
 */
export function build_available_keywords_xml(active_style_keywords = []) {
  const static_ids = SOMATIC_REGISTRY.map((entry) => entry.id).join(", ");
  const lines = [`- static (universal): ${static_ids}`];
  const motifs = (active_style_keywords || []).filter((k) => typeof k === "string" && k.trim());
  if (motifs.length > 0) {
    lines.push(`- active style: ${motifs.join(", ")}`);
  }
  return lines.join("\n");
}

/**
 * CHANGELOG
 * - 2026-08-28: Streamlined somatic prompt compilation into unified build_somatic_directives_xml and build_available_keywords_xml functions.
 */
