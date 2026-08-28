/**
 * src/intelligence/prompts/physics-prompts.js
 * 🫀 SOMATIC & PHYSICS PROMPT DIRECTIVES
 *
 * Prompt directive catalog for somatic tells and emotional undercurrents:
 * - SOMATIC_REGISTRY (12 universal static physical archetypes)
 * - STYLE_MOTIF_REGISTRY (imported from @data)
 * - DYNAMIC_SOMATIC_RULES & evaluate_automatic_somatics (threshold resolver)
 * - build_somatic_directives_block (<SOMATIC_DIRECTIVES> XML compiler)
 * - build_available_keywords_xml (<AVAILABLE_KEYWORDS> XML compiler)
 */

import { STYLE_MOTIF_REGISTRY } from "@data";

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

/**
 * Resolves a list of chosen keywords against the static archetype registry and
 * the style-motif registry. Unknown keywords are silently dropped so a wayward
 * Director payload can never corrupt the prompt.
 * @param {string[]} [keywords]
 * @returns {{ id: string, tells?: string, directive: string }[]}
 */
export function resolve_somatic_directives(keywords = []) {
  const resolved = [];
  for (const keyword of keywords) {
    if (!keyword || typeof keyword !== "string") continue;
    const static_def = SOMATIC_REGISTRY.find((entry) => entry.id === keyword);
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
 * Renders the resolved keyword definitions as a deterministic XML block for
 * prompt injection. Returns an empty string when nothing resolved.
 * @param {{ id: string, directive: string }[]} [resolved]
 * @returns {string}
 */
export function render_somatic_directives_xml(resolved = []) {
  if (!Array.isArray(resolved) || resolved.length === 0) return "";
  const items = resolved.map((entry) => `- ${entry.id}: ${entry.directive}`).join("\n");
  return `\n<SOMATIC_DIRECTIVES>\n${items}\n</SOMATIC_DIRECTIVES>`;
}

/**
 * Deterministic threshold mapping from emotional dynamics axes to somatic archetype keys.
 * Each rule provides an archetype id, an activation predicate over entity dynamics, and a priority score.
 */
export const DYNAMIC_SOMATIC_RULES = [
  // Intensity thresholds
  {
    id: "fear",
    when: (d) => (d.intensity ?? 50) >= 75 && (d.affinity ?? 50) <= 60,
    priority: 85,
  },
  {
    id: "dysregulation",
    when: (d) => (d.chaos ?? 50) >= 75 || ((d.intensity ?? 50) >= 80 && (d.chaos ?? 50) >= 60),
    priority: 80,
  },
  {
    id: "emotional_neglect",
    when: (d) => (d.intensity ?? 50) <= 25 && (d.openness ?? 50) <= 35,
    priority: 75,
  },
  // Openness & Defense thresholds
  {
    id: "betrayal",
    when: (d) => (d.openness ?? 50) <= 25 && (d.affinity ?? 50) <= 40,
    priority: 80,
  },
  {
    id: "defiance",
    when: (d) => (d.openness ?? 50) <= 30 && (d.intensity ?? 50) >= 60,
    priority: 70,
  },
  {
    id: "vulnerability",
    when: (d) => (d.openness ?? 50) >= 75 && (d.affinity ?? 50) >= 50,
    priority: 75,
  },
  // Affinity & Intimacy thresholds
  {
    id: "intimacy",
    when: (d) => (d.affinity ?? 50) >= 75 && (d.openness ?? 50) >= 60,
    priority: 80,
  },
  {
    id: "grief",
    when: (d) => (d.intensity ?? 50) <= 35 && (d.affinity ?? 50) >= 65 && (d.chaos ?? 50) <= 40,
    priority: 70,
  },
  {
    id: "shame",
    when: (d) => (d.openness ?? 50) <= 35 && (d.intensity ?? 50) >= 60 && (d.affinity ?? 50) >= 45,
    priority: 65,
  },
];

/**
 * Deterministically evaluates an entity's dynamic state against somatic threshold rules
 * and merges the result with any manual Director keywords.
 * Manual Director keywords take top precedence.
 * Clamps result to `max_directives` (default: 2) to maintain strict token economy.
 *
 * @param {Record<string, number>} [dynamics={}] - Entity's active dynamics (intensity, chaos, openness, affinity)
 * @param {string[]} [manual_keywords=[]] - Explicit keywords chosen by Director
 * @param {number} [max_directives=2] - Maximum number of resolved somatic keywords
 * @returns {string[]} Deduplicated list of keyword ids
 */
export function evaluate_automatic_somatics(dynamics = {}, manual_keywords = [], max_directives = 2) {
  const result = [];
  const seen = new Set();

  // 1. Manual Director keywords take absolute first priority
  if (Array.isArray(manual_keywords)) {
    for (const k of manual_keywords) {
      if (typeof k === "string" && k.trim() && !seen.has(k.trim())) {
        const cleaned = k.trim();
        seen.add(cleaned);
        result.push(cleaned);
        if (result.length >= max_directives) return result;
      }
    }
  }

  if (!dynamics || typeof dynamics !== "object") {
    return result;
  }

  // 2. Evaluate active threshold rules sorted by priority
  const candidates = [];
  for (const rule of DYNAMIC_SOMATIC_RULES) {
    if (seen.has(rule.id)) continue;
    try {
      if (typeof rule.when === "function" && rule.when(dynamics)) {
        candidates.push(rule);
      }
    } catch (_err) {
      /* ignore evaluate error */
    }
  }

  candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const c of candidates) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      result.push(c.id);
      if (result.length >= max_directives) break;
    }
  }

  return result;
}

/**
 * Convenience one-call builder: resolves manual keywords and/or automatic dynamics,
 * then renders the deterministic XML block.
 *
 * @param {string[]|Record<string, any>} [keywords_or_dynamics=[]]
 * @param {string[]|Record<string, any>} [maybe_keywords=[]]
 * @returns {string}
 */
export function build_somatic_directives_block(keywords_or_dynamics = [], maybe_keywords = []) {
  let keywords = [];
  let dynamics = null;

  if (Array.isArray(keywords_or_dynamics)) {
    keywords = keywords_or_dynamics;
    if (maybe_keywords && typeof maybe_keywords === "object" && !Array.isArray(maybe_keywords)) {
      dynamics = maybe_keywords;
    }
  } else if (keywords_or_dynamics && typeof keywords_or_dynamics === "object") {
    dynamics = keywords_or_dynamics;
    if (Array.isArray(maybe_keywords)) {
      keywords = maybe_keywords;
    }
  }

  const resolved_keywords = dynamics ? evaluate_automatic_somatics(dynamics, keywords) : keywords;

  return render_somatic_directives_xml(resolve_somatic_directives(resolved_keywords));
}

/**
 * Builds the <AVAILABLE_KEYWORDS> listing shown to the Director: the 12 static
 * archetypes always, plus the active narrative style's motifs.
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
