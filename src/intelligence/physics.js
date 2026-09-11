/**
 * src/intelligence/physics.js
 * ============================================================================
 * ⚙️ PHYSICS DOMAIN MODULE — 6-Axis Dynamics Engine, Protocols & XML Compilers
 * ============================================================================
 *
 * Simulates the psychological and environmental physics of RPGlitch:
 * 1. Dynamics Axis Metadata (DYNAMICS_AXES)
 * 2. Physics & Subtext Protocols Registry (PHYSICS_PROTOCOLS, AVAILABLE_KEYWORDS)
 * 3. Unified Dynamics Rules (DYNAMICS_RULES: subtext protocols & somatic thresholds)
 * 4. Physics Engine & Gravity Settlement (apply_dynamics_gravity, extract_entity_dynamics_baselines)
 * 5. Delta Computation & Subtext Protocol Evaluators (compute_dynamics_deltas, evaluate_subtext_protocols, evaluate_dynamics_rules)
 * 6. Dynamics XML Compilers (render_dynamics_xml, render_dynamics_axes_xml, render_subtext_xml, render_available_keywords_xml)
 * 7. Protocol Resolvers (resolve_physics_protocols, resolve_context_directives)
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure data, math calculations, and XML generation.
 * - Single source of truth for 6-axis psychological simulation and somatic subtext.
 * ============================================================================
 */

import { STYLE_MOTIF_REGISTRY } from "@data";
import { escape_xml } from "@utils";

// ── 1. Dynamics Axes ──────────────────────────────────────────────────────────

/**
 * 6 core dynamics axes: 4 somatic (character) and 2 environmental (fractal).
 * Each axis carries a `scope` ("somatic" | "fractal") used to split sheets,
 * plus explicit `low` and `high` spectrum bounds.
 * @type {Record<string, { label: string, low: string, high: string, scope: "somatic" | "fractal" }>}
 */
export const DYNAMICS_AXES = Object.freeze({
  // Character (Somatic) axes
  chaos: { label: "Chaos", low: "Order", high: "Volatility", scope: "somatic" },
  intensity: { label: "Intensity", low: "Stillness", high: "Surge", scope: "somatic" },
  openness: { label: "Openness", low: "Insulation", high: "Permeability", scope: "somatic" },
  affinity: { label: "Affinity", low: "Isolation", high: "Coalescence", scope: "somatic" },

  // Fractal (Environmental) axes
  velocity: { label: "Velocity", low: "Suspension", high: "Acceleration", scope: "fractal" },
  entropy: { label: "Entropy", low: "Glitching", high: "Coherence", scope: "fractal" },
});

// ── 2. Physics Protocols & Directives Registry ────────────────────────────────

/**
 * Universal physics protocols: 12 somatic archetypes + 18 dynamics trigger directives + context directives.
 * @type {Record<string, { label?: string, tells?: string, directive: string } | string>}
 */
export const PHYSICS_PROTOCOLS = Object.freeze({
  // ── 2.1 Universal Somatic & Trauma Archetypes ───────────────────────────────
  SHAME:
    "Averted eye contact, fidgeting fingers, heat rising in ears and collar, hunched shoulders. Weave involuntary physical shame tells (averted gaze, flushed neck); attempts verbal deflection while posture collapses inward.",
  FEAR: "Shallow breathing, locked jaw, cold sweat, scanning physical exits. Physical freeze/flight response; hyper-vigilant scanning of immediate space.",
  VULNERABILITY:
    "Unclenching hands, softened gaze, hesitant cadence, dropped defensive posture. Defensive walls softening; cautious, tentative physical opening.",
  BETRAYAL:
    "Throat constricted, cold hands, sudden step backward, guarded silence. Acute trust collapse; sudden physical withdrawal and rigid skepticism.",
  ABANDONMENT:
    "Hollow stomach, chest tightness, searching gaze, abrupt cling or preemptive detachment. Panic of separation; hyper-reactive to perceived emotional distance.",
  EMOTIONAL_NEGLECT:
    "Affect numbness, flat monotone delivery, drifting gaze, motionless hands. Affect blunting and quiet withdrawal; disengages from connection effort.",
  DEFIANCE:
    "Raised chin, rigid spine, locked eye contact, squared stance. Open resistance and pride; physical assertion against authority or pressure.",
  INTIMACY:
    "Leaning inward, softened micro-expressions, matched breathing tempo, lingering contact. Sensory closeness and reduced spatial distance; warmth and physical presence.",
  GRIEF:
    "Heavy swallow, pressure behind eyes, decelerated motor cadence, weighted pauses. Visceral emotional weight; speech slowed and anchored in physical heaviness.",
  DOMINANCE:
    "Deliberate unhurried movements, spatial expansion, steady downward gaze. Assert spatial control; unwavering presence and physical command.",
  DECEPTION:
    "Calculated micro-pauses, forced smoothness, throat clearing, stiff hands. Over-managed composure; unnatural control concealing rapid internal calculation.",
  DYSREGULATION:
    "Pacing, fine motor tremors, erratic vocal cadence, rapid uneven respiration. Cognitive overload; fragmented sentences and chaotic motor agitation.",

  // ── 2.2 Dynamics Triggers & Somatic Pacing Directives ───────────────────────
  ADRENALINE:
    "High-adrenaline pacing. Slow narrative time: expand detail in decisive beats — micro-expressions, split-second thoughts, and immediate sensory physics.",
  SLOW_MOTION: "Pacing slow. Heavy fatigue. Deliberate, languid actions.",
  GLITCH: "Reality glitching. Fragmented memory. Non-linear time perception.",
  RECOVERY: "High clarity. Sharp recall. Stable environment.",
  EXPOSED:
    "Psychological armor down, highly receptive and unshielded. Reveal genuine reactions without reflexive deflection; raw unguarded openness.",
  MASKING:
    "Guarded self-containment. Deflects intrusive personal questions with disciplined silence, keeping private history and feelings concealed while avoiding overt hostility.",
  SYNCHRONY: "Mirroring user movement. Intense focus. Deep rapport.",
  DISSONANCE: "Interpersonal friction and irritation. Sharp tone, physical boundary defense, and visible exasperation without emotional withdrawal.",
  OVERDRIVE: "Environmental pacing accelerated. Time compressing.",
  STASIS: "Environmental stasis. Time stretching.",
  INSTABILITY:
    "Pathetic fallacy: The environmental geometry is unstable. Weave sensory descriptions of physical glitches, non-linear decay, and structural reality degradation directly into the background texture.",
  STABILITY: "Structural stability. Safe, predictable physics.",
  SUSPICION:
    "Acute suspicion and estrangement. Guarded deflection and physical boundary defense — actively test the user's motives, question inconsistencies, and maintain vigilant distance.",
  CATACLYSM:
    "Accelerated environmental upheaval. Physical structures decaying and tearing apart at breakneck speed with cascading reality glitches and rapid hazards.",
  CONFESSION:
    "Quiet emotional vulnerability. Environmental pacing slows to a crawl as personal defenses drop, inviting honest confessions and unguarded admissions.",
  PASSION:
    "High-adrenaline resonance and deep rapport. Expand detail in decisive beats with intense focus, mirroring movement, breathless momentum, and raw connection.",
  TRANCE:
    "Lethargic dissociation and perceptual distortion. Heavy physical fatigue and languid actions paired with surreal, fragmented thoughts and reality glitches.",
  HARMONY: "Pristine mental clarity and physical stability. Razor-sharp recall and steady focus grounded in safe, predictable environmental physics.",

  // ── 2.3 System-Forced Context Directives ─────────────────────────────────────
  FIRST_CONTACT:
    "Unless context explicitly establishes a prior relationship, treat this as a first encounter. You do not know the user's name, history, or intent.",
});

/** List of static archetype keyword IDs for Director available keyword listings */
export const AVAILABLE_KEYWORDS = Object.freeze([
  "SHAME",
  "FEAR",
  "VULNERABILITY",
  "BETRAYAL",
  "ABANDONMENT",
  "EMOTIONAL_NEGLECT",
  "DEFIANCE",
  "INTIMACY",
  "GRIEF",
  "DOMINANCE",
  "DECEPTION",
  "DYSREGULATION",
]);

// ── 3. Dynamics Rules (Subtext Protocols & Somatic Reactions) ─────────────────

/**
 * Unified dynamics rules encompassing non-verbal emotional reaction thresholds (with priority)
 * and environmental/somatic subtext protocol triggers.
 *
 * @type {Array<{ id: string, when: ((dynamics: any) => boolean) | ((ai: any, fractal?: any) => boolean), priority?: number }>}
 */
export const DYNAMICS_RULES = [
  // ── 3.1 Non-Verbal Reaction Thresholds (Priority-Ranked) ───────────────────
  {
    id: "FEAR",
    when: (d) => (d.intensity ?? 50) >= 75 && (d.affinity ?? 50) <= 60,
    priority: 85,
  },
  {
    id: "DYSREGULATION",
    when: (d) => (d.chaos ?? 50) >= 75 || ((d.intensity ?? 50) >= 80 && (d.chaos ?? 50) >= 60),
    priority: 80,
  },
  {
    id: "EMOTIONAL_NEGLECT",
    when: (d) => (d.intensity ?? 50) <= 25 && (d.openness ?? 50) <= 35,
    priority: 75,
  },
  {
    id: "BETRAYAL",
    when: (d) => (d.openness ?? 50) <= 25 && (d.affinity ?? 50) <= 40,
    priority: 80,
  },
  {
    id: "DEFIANCE",
    when: (d) => (d.openness ?? 50) <= 30 && (d.intensity ?? 50) >= 60,
    priority: 70,
  },
  {
    id: "VULNERABILITY",
    when: (d) => (d.openness ?? 50) >= 75 && (d.affinity ?? 50) >= 50,
    priority: 75,
  },
  {
    id: "INTIMACY",
    when: (d) => (d.affinity ?? 50) >= 75 && (d.openness ?? 50) >= 60,
    priority: 80,
  },
  {
    id: "GRIEF",
    when: (d) => (d.intensity ?? 50) <= 35 && (d.affinity ?? 50) >= 65 && (d.chaos ?? 50) <= 40,
    priority: 70,
  },
  {
    id: "SHAME",
    when: (d) => (d.openness ?? 50) <= 35 && (d.intensity ?? 50) >= 60 && (d.affinity ?? 50) >= 45,
    priority: 65,
  },

  // ── 3.2 Global Baseline Dynamics Subtext Triggers ───────────────────────────
  // 📈 INTENSITY
  {
    id: "ADRENALINE",
    when: (d) => (d?.intensity ?? 50) > 70 && (d?.affinity ?? 50) <= 70,
  },
  {
    id: "SLOW_MOTION",
    when: (d) => (d?.intensity ?? 50) < 30 && (d?.chaos ?? 50) <= 70,
  },

  // 🌪️ CHAOS
  {
    id: "GLITCH",
    when: (d) => (d?.chaos ?? 50) > 70 && (d?.intensity ?? 50) >= 30,
  },
  {
    id: "RECOVERY",
    when: (d) => (d?.chaos ?? 50) < 30 && (d?.entropy ?? 50) >= 30,
  },

  // 🔓 OPENNESS
  {
    id: "EXPOSED",
    when: (d) => (d?.openness ?? 50) > 70 && (d?.velocity ?? 50) >= 30,
  },
  {
    id: "MASKING",
    when: (d) => (d?.openness ?? 50) < 30 && (d?.affinity ?? 50) >= 30,
  },

  // 🤝 AFFINITY
  {
    id: "SYNCHRONY",
    when: (d) => (d?.affinity ?? 50) > 70 && (d?.intensity ?? 50) <= 70,
  },
  {
    id: "DISSONANCE",
    when: (d) => (d?.affinity ?? 50) < 30 && (d?.openness ?? 50) >= 30,
  },

  // 🚀 VELOCITY
  {
    id: "OVERDRIVE",
    when: (d) => (d?.velocity ?? 50) > 70 && (d?.entropy ?? 50) <= 70,
  },
  {
    id: "STASIS",
    when: (d) => (d?.velocity ?? 50) < 30 && (d?.openness ?? 50) <= 70,
  },

  // 📉 ENTROPY
  {
    id: "INSTABILITY",
    when: (d) => (d?.entropy ?? 50) > 70 && (d?.velocity ?? 50) <= 70,
  },
  {
    id: "STABILITY",
    when: (d) => (d?.entropy ?? 50) < 30 && (d?.chaos ?? 50) >= 30,
  },

  // 🛡️ COMPOSITE TRIGGERS
  {
    id: "SUSPICION",
    when: (d) => (d?.openness ?? 50) < 30 && (d?.affinity ?? 50) < 30,
  },
  {
    id: "CATACLYSM",
    when: (d) => (d?.velocity ?? 50) > 70 && (d?.entropy ?? 50) > 70,
  },
  {
    id: "CONFESSION",
    when: (d) => (d?.openness ?? 50) > 70 && (d?.velocity ?? 50) < 30,
  },
  {
    id: "PASSION",
    when: (d) => (d?.intensity ?? 50) > 70 && (d?.affinity ?? 50) > 70,
  },
  {
    id: "TRANCE",
    when: (d) => (d?.intensity ?? 50) < 30 && (d?.chaos ?? 50) > 70,
  },
  {
    id: "HARMONY",
    when: (d) => (d?.chaos ?? 50) < 30 && (d?.entropy ?? 50) < 30,
  },
];

// ============================================================================
// 4. Physics Engine & Gravity Settlement
// ============================================================================

/**
 * Applies baseline settlement gravity to an entity's live dynamics.
 * Non-destructive mutation: clamps final dynamic numbers between 0 and 100.
 *
 * @param {Record<string, number>} dynamics - Mutable live dynamics state to settle
 * @param {Record<string, number>} [baselines={}] - Target baseline dynamics
 * @param {number} [active_entropy=50] - Environmental entropy level controlling variance
 * @param {number} [base_gravity=0.08] - Base rate of gravity pull toward baselines
 * @param {Set<string>|null} [skip_axes=null] - Set of axis keys that should not settle
 */
export function apply_dynamics_gravity(dynamics, baselines = {}, active_entropy = 50, base_gravity = 0.08, skip_axes = null) {
  if (!dynamics || typeof dynamics !== "object") return;

  const variance = (active_entropy / 100) * 0.05;

  for (const axis of Object.keys(dynamics)) {
    if (skip_axes && skip_axes.has(axis)) continue;
    const target = baselines[axis] ?? 50;
    const randomized_gravity = base_gravity + (Math.random() * 2 - 1) * variance;
    const applied_gravity = Math.max(0, Math.min(1, randomized_gravity));

    const next_val = dynamics[axis] + (target - dynamics[axis]) * applied_gravity;
    dynamics[axis] = Math.max(0, Math.min(100, Math.round(next_val)));
  }
}

/**
 * Extracts baseline dynamics from an entity.
 * @param {any} entity
 * @returns {Record<string, number>}
 */
export function extract_entity_dynamics_baselines(entity) {
  return entity?.dynamics_baseline || {};
}

// ============================================================================
// 5. Delta Computation & Subtext Protocol Evaluators
// ============================================================================

/**
 * Computes dynamics deltas between turns for telemetry recording.
 * Pure calculation returning structured delta objects and formatted log entries.
 *
 * @param {string} target - Entity target identifier (e.g. "ai", "fractal")
 * @param {Record<string, number>} dynamics - Current turn dynamics
 * @param {any} runtime_target - Prior runtime state containing previous dynamics
 * @returns {{ deltas: Array<{ axis: string, target: string, old_value: number, new_value: number, diff: number }>, log_strings: string[] }}
 */
export function compute_dynamics_deltas(target, dynamics, runtime_target) {
  const deltas = [];
  const log_strings = [];

  for (const [axis, val] of Object.entries(dynamics || {})) {
    const old_value = /** @type {any} */ (runtime_target)?.[axis] ?? 50;
    const diff = val - old_value;
    if (diff !== 0) {
      deltas.push({ axis, target, old_value, new_value: val, diff });
      const axis_label = DYNAMICS_AXES[axis]?.label || axis.charAt(0).toUpperCase() + axis.slice(1);
      log_strings.push(`${axis_label} ${diff > 0 ? "+" : ""}${diff}`);
    }
  }

  return { deltas, log_strings };
}

/**
 * Evaluates active subtext protocols and style triggers for current dynamics state.
 *
 * @param {object} [options={}]
 * @param {Record<string, number>} [options.ai_dynamics={}]
 * @param {Record<string, number>} [options.fractal_dynamics={}]
 * @param {object|null} [options.style=null]
 * @returns {Array<{ id: string, text?: string }>}
 */
export function evaluate_subtext_protocols({ ai_dynamics = {}, fractal_dynamics = {}, style = null } = {}) {
  const active = [];
  const d = { ...(fractal_dynamics || {}), ...(ai_dynamics || {}) };

  for (const rule of DYNAMICS_RULES) {
    if (rule.priority === undefined && typeof rule.when === "function") {
      if (rule.when(d)) {
        active.push({ id: rule.id });
      }
    }
  }

  if (style && typeof style === "object" && Array.isArray(style.triggers) && style.id !== "default") {
    for (const trigger of style.triggers) {
      if (typeof trigger.when === "function") {
        if (trigger.when(ai_dynamics, fractal_dynamics)) {
          active.push({ id: trigger.id, text: trigger.directive });
        }
      }
    }
  }

  return active;
}

/**
 * Evaluates entity dynamics against dynamic somatic rules and merges with manual keywords.
 * Returns up to `max_directives` active uppercase keyword IDs (e.g. `["FEAR", "DYSREGULATION"]`).
 *
 * @param {Record<string, number>} [dynamics={}] - Entity dynamics state
 * @param {string[]} [manual_keywords=[]] - Explicit manual or director keywords
 * @param {number} [max_directives=2] - Maximum number of active rule IDs to return
 * @returns {string[]} Ordered list of uppercase rule/keyword IDs
 */
export function evaluate_dynamics_rules(dynamics = {}, manual_keywords = [], max_directives = 2) {
  const result = [];
  const seen = new Set();

  if (Array.isArray(manual_keywords)) {
    for (const raw_keyword of manual_keywords) {
      if (typeof raw_keyword === "string" && raw_keyword.trim()) {
        const cleaned_keyword = raw_keyword.trim();
        const upper_keyword = cleaned_keyword.toUpperCase();
        if (!seen.has(upper_keyword)) {
          seen.add(upper_keyword);
          result.push(upper_keyword);
          if (result.length >= max_directives) return result;
        }
      }
    }
  }

  if (!dynamics || typeof dynamics !== "object") return result;

  const candidates = [];
  for (const rule of DYNAMICS_RULES) {
    if (rule.priority === undefined || seen.has(rule.id)) continue;
    if (typeof rule.when === "function" && rule.when(dynamics)) {
      candidates.push(rule);
    }
  }

  candidates.sort((first, second) => (second.priority || 0) - (first.priority || 0));

  for (const candidate of candidates) {
    if (!seen.has(candidate.id)) {
      seen.add(candidate.id);
      result.push(candidate.id);
      if (result.length >= max_directives) break;
    }
  }

  return result;
}

// ============================================================================
// 6. Dynamics XML Compilers
// ============================================================================

/**
 * Compiles the canonical <DYNAMICS> reference block (laws & axes legend) for the Director prompt.
 * @returns {string} Formatted XML block.
 */
export function render_dynamics_xml() {
  const axes = Object.entries(DYNAMICS_AXES)
    .map(([key, meta]) => `    - ${key} (${meta.label}): ${meta.low} vs ${meta.high}`)
    .join("\n");

  return `
<DYNAMICS>
  <LAWS>
  1. Calibrate dynamics_deltas conservatively (±1 to ±4 standard; ±8 to ±12 extreme). 
  2. Adjust deltas carefully near boundaries (5 or 95) to prevent clipping at 0 or 100. 
  3. Calibrate dynamics_deltas to reflect the psychological and environmental shift of the turn.
  </LAWS>
  <AXES>
${axes}
  </AXES>
</DYNAMICS>`.trim();
}

/**
 * Compiles live dynamics into a <DYNAMIC_AXES> axis-entity block for the story sheet.
 * Each active axis becomes its own named tag (`<CHAOS value="44" low="Order" high="Volatility" />`).
 *
 * @param {Record<string, number>|null} [live_dynamics=null]
 * @param {"somatic" | "fractal" | null} [scope=null] - Restrict to one axis group
 * @returns {string} XML block string or "" if no dynamics are active.
 */
export function render_dynamics_axes_xml(live_dynamics = null, scope = null) {
  if (!live_dynamics || typeof live_dynamics !== "object") return "";

  const tags = Object.entries(DYNAMICS_AXES)
    .filter(([key, meta]) => (!scope || meta.scope === scope) && live_dynamics[key] !== undefined && live_dynamics[key] !== null)
    .map(([key, meta]) => {
      const value = Math.round(Number(live_dynamics[key]));
      const tag = key.toUpperCase();
      return `  <${tag} value="${value}" low="${escape_xml(meta.low)}" high="${escape_xml(meta.high)}" />`;
    });

  return tags.length > 0 ? `<DYNAMIC_AXES scale="0-100">\n${tags.join("\n")}\n</DYNAMIC_AXES>` : "";
}

/**
 * Compiles dynamic somatic directives and narrative signals into a single unified <SUBTEXT> XML block.
 *
 * @param {Record<string, number>} [ai_dynamics={}] - Active character dynamics
 * @param {Record<string, number>} [fractal_dynamics={}] - Active fractal/environmental dynamics
 * @param {{ style?: object, keywords?: string[] }} [options={}] - Narrative style and manual or director keywords
 * @returns {string} XML block string or "" if no signals or directives are active.
 */
export function render_subtext_xml(ai_dynamics = {}, fractal_dynamics = {}, options = {}) {
  const tags = [];
  const seen = new Set();

  const push = (id, directive) => {
    const tag =
      String(id || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, "_") || "";
    const text = String(directive || "").trim();
    if (!tag || !text || seen.has(tag)) return;
    seen.add(tag);
    tags.push(`      <${tag}>${escape_xml(text)}</${tag}>`);
  };

  // 1. Somatic Directives
  const manual_keywords = options?.keywords || [];
  const resolved_keywords = ai_dynamics && Object.keys(ai_dynamics).length ? evaluate_dynamics_rules(ai_dynamics, manual_keywords) : manual_keywords;

  const resolved_directives = resolve_physics_protocols(resolved_keywords);
  for (const entry of resolved_directives) {
    push(entry.id, entry.directive);
  }

  // 2. Dynamics Subtext Protocols
  const active_protocols = evaluate_subtext_protocols({
    ai_dynamics,
    fractal_dynamics,
    style: options?.style,
  });
  for (const protocol of active_protocols) {
    const text =
      protocol.text ||
      (typeof PHYSICS_PROTOCOLS[protocol.id] === "string" ? PHYSICS_PROTOCOLS[protocol.id] : PHYSICS_PROTOCOLS[protocol.id]?.directive);
    push(protocol.id, text);
  }

  if (tags.length === 0) return "";
  return `    <SUBTEXT>\n${tags.join("\n")}\n    </SUBTEXT>`;
}

// ============================================================================
// 7. Protocol Resolvers & Keyword Compilers
// ============================================================================

/**
 * Resolves a list of chosen keywords against the physics protocol registry and the style-motif registry.
 * @param {string[]} [keywords]
 * @returns {{ id: string, tells?: string, directive: string }[]}
 */
export function resolve_physics_protocols(keywords = []) {
  const resolved = [];
  for (const keyword of keywords || []) {
    if (!keyword || typeof keyword !== "string") continue;
    const clean_key = keyword.trim();
    const upper_key = clean_key.toUpperCase();
    const protocol_def = PHYSICS_PROTOCOLS[upper_key] || PHYSICS_PROTOCOLS[clean_key];
    if (protocol_def) {
      if (typeof protocol_def === "object") {
        resolved.push({ id: upper_key, tells: protocol_def.tells, directive: protocol_def.directive });
      } else {
        resolved.push({ id: upper_key, directive: String(protocol_def) });
      }
      continue;
    }
    const motif = STYLE_MOTIF_REGISTRY[clean_key] || STYLE_MOTIF_REGISTRY[clean_key.toLowerCase()];
    if (motif) resolved.push({ id: clean_key, directive: motif.directive });
  }
  return resolved;
}

/**
 * Resolves injected context-directive keywords against the physics protocol registry.
 * @param {string[]} [keywords]
 * @returns {{ id: string, directive: string }[]}
 */
export function resolve_context_directives(keywords = []) {
  const resolved = [];
  for (const keyword of keywords || []) {
    if (!keyword || typeof keyword !== "string") continue;
    const clean_key = keyword.trim();
    const upper_key = clean_key.toUpperCase();
    const entry = PHYSICS_PROTOCOLS[upper_key];
    if (entry) {
      const directive = typeof entry === "string" ? entry : entry.directive;
      resolved.push({ id: upper_key, directive });
    }
  }
  return resolved;
}

/**
 * Builds <AVAILABLE_KEYWORDS> listing for the Director as a unified, flat bracketed list of tags.
 * @param {string[]} [active_style_keywords]
 * @returns {string}
 */
export function render_available_keywords_xml(active_style_keywords = []) {
  const static_ids = AVAILABLE_KEYWORDS;
  const motifs = (active_style_keywords || []).filter((k) => typeof k === "string" && k.trim());
  const combined = Array.from(new Set([...static_ids, ...motifs]));
  return combined.map((k) => `[${k}]`).join(" ");
}

/**
 * CHANGELOG
 * - 2026-09-11: Consolidated physics domain: merged physics-protocols.js directly into physics.js, housing all math, registries, and XML compilers together.
 * - 2026-09-11: Streamlined physics engine: stripped redundant desc field from DYNAMICS_AXES; renamed duplicate VULNERABILITY rule to EXPOSED; made compute_dynamics_deltas pure; renamed evaluate_dynamics_signals to evaluate_subtext_protocols with clean options object signature.
 * - 2026-09-11: Refactored physics.js to functional paradigm: dismantled physics_engine singleton into top-level exports, renamed resolve_non_verbal_reactions to evaluate_dynamics_rules, and enforced Universal File Architecture.
 * - 2026-09-11: Consolidated GLOBAL_TRIGGERS and DYNAMIC_NON_VERBAL_RULES into unified DYNAMICS_RULES; trigger directives co-located into PHYSICS_PROTOCOLS in physics-prompt.js.
 * - 2026-08-28: Harmonized dynamics nomenclature: DYNAMIC_NON_VERBAL_RULES, extract_entity_dynamics_baselines, compute_dynamics_deltas, evaluate_dynamics_signals, and apply_dynamics_gravity.
 */
