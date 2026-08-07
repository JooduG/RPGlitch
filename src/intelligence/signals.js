/**
 * src/intelligence/signals.js
 * 📡 DYNAMICS SIGNALS — the single foundational home for all dynamics-threshold →
 * prompt-directive injection (narrative signals).
 *
 * Consolidates the scattered threshold logic that previously lived in prompts.js
 * (PACING, ATMOSPHERE) into one declarative registry, one evaluator, and a thin
 * renderer. Adding a new directive = one registry entry.
 *
 * Scope guards vs. the legacy DYNAMICS registry (2026-06):
 *  - NO user-input keyword scanning (active impulses) — intentionally excluded.
 *  - NO numerical axis mutation — the Director owns state mutations.
 */

/**
 * Narrative signal registry.
 * Each entry triggers when its axis crosses the threshold on the owning domain:
 *  - domain "ai"      → the AI character's dynamics (intensity, chaos, ...)
 *  - domain "fractal" → the fractal's dynamics (entropy, velocity, ...)
 * At most one of `above`/`below` may be set.
 */
export const DYNAMICS_SIGNALS = [
  {
    id: "PACING_HIGH",
    domain: "ai",
    axis: "intensity",
    above: 70,
    text: "High-adrenaline pacing. Slow narrative time: expand detail in decisive beats — micro-expressions, split-second thoughts, immediate sensory physics. Use short, urgent sentences.",
  },
  {
    id: "PACING_LOW",
    domain: "ai",
    axis: "intensity",
    below: 30,
    text: "Low-energy pacing. Compress routine transitions; draw out actions with heavy, deliberate, languid detail.",
  },
  {
    id: "ATMOSPHERE_TENSE",
    domain: "fractal",
    axis: "entropy",
    above: 70,
    text: "Pathetic fallacy: the environment mirrors the scene's emotional tension — sharp sounds, cold drafts, oppressive light, close space.",
  },
  {
    id: "ATMOSPHERE_CALM",
    domain: "fractal",
    axis: "entropy",
    below: 30,
    text: "Pathetic fallacy: the environment mirrors calm — ambient hum, warmth, expansive views, rhythmic sounds.",
  },
];

/**
 * Evaluates which narrative signals are active for the given dynamics.
 * Emits nothing for unknown/non-numeric axis values and stays silent at
 * neutral values so mid-range turns are free of prompt noise.
 * @param {Record<string, number>} [ai_dynamics]
 * @param {Record<string, number>} [fractal_dynamics]
 * @returns {Array<{id: string, domain: string, axis: string, value: number, text: string}>}
 */
export function evaluate_dynamics_signals(ai_dynamics = {}, fractal_dynamics = {}) {
  const active = [];
  for (const signal of DYNAMICS_SIGNALS) {
    const dynamics = signal.domain === "fractal" ? fractal_dynamics : ai_dynamics;
    const value = dynamics?.[signal.axis];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const passes = signal.above !== undefined ? value > signal.above : signal.below !== undefined ? value < signal.below : false;
    if (passes) active.push({ id: signal.id, domain: signal.domain, axis: signal.axis, value: Math.round(value), text: signal.text });
  }
  return active;
}

/**
 * Renders the active narrative signals as a <DYNAMICS_SIGNALS> XML block.
 * @param {Record<string, number>} [ai_dynamics]
 * @param {Record<string, number>} [fractal_dynamics]
 * @param {{ domains?: Array<"ai" | "fractal"> }} [options]
 * @returns {string} XML block string, or "" when no signals are active.
 */
export function build_signals_xml(ai_dynamics = {}, fractal_dynamics = {}, options = {}) {
  const domains = options.domains ?? ["ai", "fractal"];
  const active = evaluate_dynamics_signals(ai_dynamics, fractal_dynamics).filter((s) => domains.includes(s.domain));
  if (active.length === 0) return "";
  const inner = active.map((s) => `      ${s.text}`).join("\n");
  return `    <DYNAMICS_SIGNALS>\n${inner}\n    </DYNAMICS_SIGNALS>`;
}
