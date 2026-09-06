/**
 * src/intelligence/prompts/physics-prompts.js
 * 🫀 SOMATIC & PHYSICS PROMPT DIRECTIVES
 *
 * Prompt XML compilers for dynamics and somatic tells:
 * - SOMATIC_REGISTRY (12 universal static physical archetypes)
 * - render_dynamics_block (<DYNAMICS> XML compiler)
 * - format_dynamics_attrs (Dynamics parameter XML attributes)
 * - build_somatic_signals_xml (<SOMATIC_SIGNALS> XML compiler)
 * - resolve_somatic_directives (Resolves keywords against static and style-motif registries)
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
 * Compiles a unified <DYNAMICS> block merging scale legend, axis definitions,
 * optional current live values [current: XX], and calibration laws.
 * @param {Record<string, number>|null} [live_dynamics=null]
 * @returns {string}
 */
export function render_dynamics_block(live_dynamics = null) {
  if (!live_dynamics && cached_dynamics_legend !== null) {
    return cached_dynamics_legend;
  }
  if (!DYNAMICS_AXES) return "";

  const definitions = Object.entries(DYNAMICS_AXES)
    .map(([key, meta]) => {
      const value = live_dynamics?.[key];
      const current_suffix = value !== undefined && value !== null ? ` [current: ${Math.round(Number(value))}]` : "";
      return `    - ${key} (${meta.label}): ${meta.desc}${current_suffix}`;
    })
    .join("\n");

  const rendered = `
<DYNAMICS>
  Scale: 0 (minimum) to 100 (maximum)
  Axes:
${definitions}
  Laws:
    1. Calibrate dynamics_deltas conservatively (+1 to +4 standard; +8 to +12 extreme).
    2. Adjust deltas carefully near boundaries (5 or 95) to prevent clipping at 0 or 100.
    3. Calibrate dynamics_deltas to reflect the psychological and environmental shift of the turn.
</DYNAMICS>`.trim();

  if (!live_dynamics) {
    cached_dynamics_legend = rendered;
  }

  return rendered;
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
 * Compiles dynamic somatic directives and narrative signals into a single unified <SOMATIC_SIGNALS> XML block.
 *
 * @param {Record<string, number>} [ai_dynamics={}] - Active character dynamics
 * @param {Record<string, number>} [fractal_dynamics={}] - Active fractal/environmental dynamics
 * @param {{ style?: object, keywords?: string[] }} [options={}] - Narrative style and manual or director keywords
 * @returns {string} XML block string or "" if no signals or directives are active.
 */
export function build_somatic_signals_xml(ai_dynamics = {}, fractal_dynamics = {}, options = {}) {
  const bullets = [];

  // 1. Somatic Directives (from keywords or dynamics-based non-verbal reaction thresholds)
  const manual_keywords = options?.keywords || [];
  const resolved_keywords =
    ai_dynamics && Object.keys(ai_dynamics).length ? resolve_non_verbal_reactions(ai_dynamics, manual_keywords) : manual_keywords;

  const resolved_directives = resolve_somatic_directives(resolved_keywords);
  for (const entry of resolved_directives) {
    bullets.push(`• ${entry.id}: ${entry.directive}`);
  }

  // 2. Dynamics Signals (from active thresholds and narrative style)
  const active_signals = evaluate_dynamics_signals(ai_dynamics, fractal_dynamics, options?.style);
  for (const signal of active_signals) {
    bullets.push(`• ${signal.text}`);
  }

  if (bullets.length === 0) return "";
  const inner = bullets.map((item) => `      ${item}`).join("\n");
  return `    <SOMATIC_SIGNALS>\n${inner}\n    </SOMATIC_SIGNALS>`;
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
 * Builds <AVAILABLE_KEYWORDS> listing for the Director as a unified, flat comma-separated list of tags.
 * @param {string[]} [active_style_keywords]
 * @returns {string}
 */
export function build_available_keywords_xml(active_style_keywords = []) {
  const static_ids = SOMATIC_REGISTRY.map((entry) => entry.id);
  const motifs = (active_style_keywords || []).filter((k) => typeof k === "string" && k.trim());
  const combined = Array.from(new Set([...static_ids, ...motifs]));
  return combined.map((k) => `[${k}]`).join(" ");
}

/**
 * CHANGELOG
 * - 2026-09-06: Formatted build_available_keywords_xml tags as bracketed tokens [keyword] for high-adherence LLM parsing.
 * - 2026-09-06: Consolidated build_signals_xml and build_somatic_directives_xml into unified build_somatic_signals_xml (<SOMATIC_SIGNALS>).
 * - 2026-09-06: Unified build_available_keywords_xml into a single flat comma-separated list of tags.
 * - 2026-09-06: Relocated render_dynamics_block to physics-prompts.js, replacing build_dynamics_legend.
 * - 2026-08-28: Streamlined somatic prompt compilation into unified build_somatic_directives_xml and build_available_keywords_xml functions.
 */
