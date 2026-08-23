/**
 * src/data/definitions/triggers.js
 * 🫀 TRIGGER & DIRECTIVE REGISTRIES
 * Universal static registry of emotional undercurrents (12 somatic archetypes),
 * the dynamic style motifs each narrative style contributes, and the global
 * baseline dynamics-signal triggers. The Director picks 1-2 keywords from the
 * combined pool each turn; the resolved definitions are injected as a
 * deterministic <SOMATIC_DIRECTIVES> block into the active speaker's prompt —
 * physical tells that betray the mask.
 *
 * This module is intentionally dependency-free (pure data + pure helpers).
 */

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
 * Dynamic style motifs — the contextual emotional signature each narrative
 * style contributes to the Director's keyword pool. Keys are referenced by
 * each style's `keywords` array in narrative-styles.js.
 * @type {Record<string, { directive: string }>}
 */
export const STYLE_MOTIF_REGISTRY = {
  sensual_submersion: {
    directive: "Sensory blur and lyrical interiority; emotional states surface as vast, intimate physical landscapes.",
  },
  captive_control: {
    directive: "Rationalized possession; obsessive hyper-focus and stark declarations of constraint.",
  },
  decaying_opulence: {
    directive: "Lush operatic intimacy inside unstable worlds; linger on bodily textures, light, and decaying architecture.",
  },
  tactile_grounding: {
    directive: "Raw working-class touch; feelings grounded in muscle tension, breathing rate, and physical friction.",
  },
  blunt_fatalism: {
    directive: "Unvarnished brutalist gaze; emotional truth inferred purely from survival mechanics.",
  },
  uncanny_hum: {
    directive: "Nightmare logic beneath still surfaces; auditory dread and uncanny mystery in ordinary moments.",
  },
  escalating_dread: {
    directive: "Feverish obsessive cadence; repetitive motifs building toward paranoid climax.",
  },
  court_paranoia: {
    directive: "Political intrigue and layered motive; every gesture weighted with courtly calculation and moral compromise.",
  },
  bitter_confrontation: {
    directive: "Reckless impulsive action colliding with deeply conflicted internal thought; high physical stakes.",
  },
  quiet_detachment: {
    directive: "Calm, slightly numb acceptance; domestic routine deforming seamlessly into the surreal.",
  },
  predatory_tension: {
    directive: "Hunted atmosphere; threat and arousal fused into an indivisible physiological rush.",
  },
  cosmic_insignificance: {
    directive: "Clinical metaphysical shock; human emotion replaced by absolute awe and alienation.",
  },
  ironic_decorum: {
    directive: "Free indirect irony beneath polished etiquette; subtext carried by subtle glances and social breach.",
  },
  elegiac_light: {
    directive: "Mythic fading light; world-weariness and hope mirrored in the surrounding environment and sky.",
  },
  tactical_geometry: {
    directive: "Staccato spatial physics; exact leverage, elapsed time, and mechanical geometry over feeling.",
  },
  battlefield_vulnerability: {
    directive: "Confrontational angst; emotional vulnerability treated as a high-stakes battlefield with somatic grounding.",
  },
  ontological_doubt: {
    directive: "Questioning the authenticity of reality and memory; paranoia threaded through plain declarations.",
  },
  numb_precision: {
    directive: "Flat, unadorned clinical observation; emotional turmoil dissected analytically without moral affect.",
  },
  anatomical_philosophy: {
    directive: "Intellectualized visceral precision; intimacy and taboo processed as social theory in physical terms.",
  },
  folksy_dread: {
    directive: "Everyman horror; fear manifesting directly in bodily discomfort and plainspoken dread.",
  },
  high_tech_low_life: {
    directive: "Dense neon-noir texture; psychological states register through hardware and software metaphors.",
  },
  flickering_neon_data: {
    directive: "Rapid fluid cuts of information; technical jargon juxtaposed against street-level grime.",
  },
  stoic_pain: {
    directive: "Mask pain behind curt declarative statements; heavy unspoken subtext.",
  },
  iceberg_subtext: {
    directive: "Minimalist understatement; actions and concrete physical objects carry the emotional weight.",
  },
  grim_bathos: {
    directive: "Caustic cynical wit that deflates drama; weary pragmatism grounded in bodily aches and mundane discomfort.",
  },
  outlaw_fatigue: {
    directive: "World-weary moral exhaustion; every observation filtered through hardened instinct and laconic grit.",
  },
};

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

/** Baseline global dynamics signals that apply across all scenes for all 6 dynamics axes */
export const GLOBAL_TRIGGERS = [
  // 📈 INTENSITY (AI Somatics & Pacing)
  {
    id: "ADRENALINE",
    when: (ai) => ai.intensity > 70 && (ai.affinity ?? 50) <= 70,
    directive:
      "High-adrenaline pacing. Slow narrative time: expand detail in decisive beats — micro-expressions, split-second thoughts, and immediate sensory physics.",
  },
  {
    id: "SLOW_MOTION",
    when: (ai) => ai.intensity < 30 && (ai.chaos ?? 50) <= 70,
    directive: "Pacing slow. Heavy fatigue. Deliberate, languid actions.",
  },

  // 🌪️ CHAOS (AI Somatics & Perception)
  {
    id: "GLITCH",
    when: (ai) => ai.chaos > 70 && (ai.intensity ?? 50) >= 30,
    directive: "Reality glitching. Fragmented memory. Non-linear time perception.",
  },
  {
    id: "RECOVERY",
    when: (ai, fractal) => ai.chaos < 30 && (fractal?.entropy ?? 50) >= 30,
    directive: "High clarity. Sharp recall. Stable environment.",
  },

  // 🔓 OPENNESS (AI Somatics & Receptivity)
  {
    id: "VULNERABILITY",
    when: (ai, fractal) => ai.openness > 70 && (fractal?.velocity ?? 50) >= 30,
    directive: "Emotional exposure. Seeking comfort. Honest admissions.",
  },
  {
    id: "MASKING",
    when: (ai) => ai.openness < 30 && (ai.affinity ?? 50) >= 30,
    directive:
      "Guarded self-containment. Deflects intrusive personal questions with disciplined silence, keeping private history and feelings concealed while avoiding overt hostility.",
  },

  // 🤝 AFFINITY (AI Somatics & Inter-Entity Bond)
  {
    id: "SYNCHRONY",
    when: (ai) => ai.affinity > 70 && (ai.intensity ?? 50) <= 70,
    directive: "Mirroring user movement. Intense focus. Deep rapport.",
  },
  {
    id: "DISSONANCE",
    when: (ai) => ai.affinity < 30 && (ai.openness ?? 50) >= 30,
    directive: "Interpersonal friction and irritation. Sharp tone, physical boundary defense, and visible exasperation without emotional withdrawal.",
  },

  // 🚀 VELOCITY (World / Fractal Environmental Pacing)
  {
    id: "OVERDRIVE",
    when: (ai, fractal) => fractal.velocity > 70 && (fractal.entropy ?? 50) <= 70,
    directive: "Environmental pacing accelerated. Time compressing.",
  },
  {
    id: "STASIS",
    when: (ai, fractal) => fractal.velocity < 30 && (ai?.openness ?? 50) <= 70,
    directive: "Environmental stasis. Time stretching.",
  },

  // 📉 ENTROPY (World / Fractal Structural Reality)
  {
    id: "INSTABILITY",
    when: (ai, fractal) => fractal.entropy > 70 && (fractal.velocity ?? 50) <= 70,
    directive:
      "Pathetic fallacy: The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.",
  },
  {
    id: "STABILITY",
    when: (ai, fractal) => fractal.entropy < 30 && (ai?.chaos ?? 50) >= 30,
    directive: "Structural stability. Safe, predictable physics.",
  },

  // 🛡️ COMPOSITE TRIGGERS (Unique Dual-Axis Resonances)
  {
    id: "SUSPICION",
    when: (ai) => ai.openness < 30 && ai.affinity < 30,
    directive:
      "Acute suspicion and estrangement. Guarded deflection and physical boundary defense — actively test the user's motives, question inconsistencies, and maintain vigilant distance.",
  },
  {
    id: "CATACLYSM",
    when: (ai, fractal) => fractal.velocity > 70 && fractal.entropy > 70,
    directive:
      "Accelerated environmental upheaval. Physical structures decaying and tearing apart at breakneck speed with cascading reality glitches and rapid hazards.",
  },
  {
    id: "CONFESSION",
    when: (ai, fractal) => ai.openness > 70 && fractal.velocity < 30,
    directive:
      "Quiet emotional vulnerability. Environmental pacing slows to a crawl as personal defenses drop, inviting honest confessions and unguarded admissions.",
  },
  {
    id: "PASSION",
    when: (ai) => ai.intensity > 70 && ai.affinity > 70,
    directive:
      "High-adrenaline resonance and deep rapport. Expand detail in decisive beats with intense focus, mirroring movement, breathless momentum, and raw connection.",
  },
  {
    id: "TRANCE",
    when: (ai) => ai.intensity < 30 && ai.chaos > 70,
    directive:
      "Lethargic dissociation and perceptual distortion. Heavy physical fatigue and languid actions paired with surreal, fragmented thoughts and reality glitches.",
  },
  {
    id: "HARMONY",
    when: (ai, fractal) => ai.chaos < 30 && fractal.entropy < 30,
    directive:
      "Pristine mental clarity and physical stability. Razor-sharp recall and steady focus grounded in safe, predictable environmental physics.",
  },
];
