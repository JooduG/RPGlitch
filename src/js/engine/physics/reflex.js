/**
 * THE REFLEX SYSTEM
 * Scans input text for high-signal keywords to inject immediate physics overrides.
 * Zero-Latancy checks before the LLM is even called.
 */

// Returns { type: string, deltas: { velocity: number, permeability: number, entropy: number } } or null
export function scanReflex(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // 1. COMBAT (Velocity Spike)
  const combatRegex =
    /kill|shoot|stab|punch|hit|fight|attack|gun|weapon|blood|hurt|destroy|break|smash|burn|explosion|die/i;
  if (combatRegex.test(lower)) {
    return {
      type: "COMBAT",
      deltas: { velocity: 20 },
    };
  }

  // 2. INTIMACY (Permeability Spike)
  const intimacyRegex =
    /kiss|love|hold|hug|touch|gentle|soft|warm|caress|cheek|hand|finger|whisper|close|safe|trust|heart|blush/i;
  if (intimacyRegex.test(lower)) {
    return {
      type: "INTIMACY",
      deltas: { permeability: 20, resonance: 10 },
    };
  }

  // 3. HORROR (Entropy Spike)
  const horrorRegex =
    /scream|run|hide|fear|scared|dark|shadow|weird|glitch|wrong|monster|ghost|dead|rot|decay|cold|shiver|nightmare/i;
  if (horrorRegex.test(lower)) {
    return {
      type: "HORROR",
      deltas: { entropy: 20 },
    };
  }

  return null;
}

// Generates instructions based on CURRENT state levels (Laws)
import { PHYSICS_CONSTANTS } from "./config.js";

// Generates instructions based on CURRENT state levels (Laws)
export function getReflexInstruction(dynamics) {
  if (!dynamics) return "";
  const d = dynamics;
  let instructions = [];

  // --- VELOCITY ---
  if (d.velocity > PHYSICS_CONSTANTS.SIGNAL_HIGH) {
    instructions.push(`[PHYSICS: HIGH_VELOCITY]
INPUT SIGNAL: ADRENALINE (${d.velocity}).
INSTRUCTION: Pacing fast. Sentences short. Actions brutal.`);
  } else if (d.velocity < PHYSICS_CONSTANTS.SIGNAL_LOW) {
    instructions.push(`[PHYSICS: LOW_VELOCITY]
INPUT SIGNAL: LETHARGY (${d.velocity}).
INSTRUCTION: Slow pacing. Deliberate movements. Heavy fatigue.`);
  }

  // --- ENTROPY ---
  if (d.entropy > PHYSICS_CONSTANTS.SIGNAL_HIGH) {
    instructions.push(`[PHYSICS: HIGH_ENTROPY]
INPUT SIGNAL: INSTABILITY (${d.entropy}).
INSTRUCTION: Describe hallucinations, artifacts, glitching.`);
  } else if (d.entropy < PHYSICS_CONSTANTS.SIGNAL_LOW) {
    instructions.push(`[PHYSICS: LOW_ENTROPY]
INPUT SIGNAL: CLARITY (${d.entropy}).
INSTRUCTION: Lucid. Analytical. Pattern recognition verified.`);
  }

  // --- PERMEABILITY ---
  if (d.permeability > PHYSICS_CONSTANTS.SIGNAL_HIGH) {
    instructions.push(`[PHYSICS: HIGH_PERMEABILITY]
INPUT SIGNAL: VULNERABILITY (${d.permeability}).
INSTRUCTION: Focus on somatic details. Skin, heat, heartbeat.`);
  } else if (d.permeability < PHYSICS_CONSTANTS.SIGNAL_LOW) {
    instructions.push(`[PHYSICS: LOW_PERMEABILITY]
INPUT SIGNAL: GUARDED (${d.permeability}).
INSTRUCTION: Defensive. Mistrustful. Mask true feelings.`);
  }

  // --- RESONANCE ---
  if (d.resonance > PHYSICS_CONSTANTS.SIGNAL_HIGH) {
    instructions.push(`[PHYSICS: HIGH_RESONANCE]
INPUT SIGNAL: EMPATHY (${d.resonance}).
INSTRUCTION: Profound connection. Merge perspectives.`);
  } else if (d.resonance < PHYSICS_CONSTANTS.SIGNAL_LOW) {
    instructions.push(`[PHYSICS: LOW_RESONANCE]
INPUT SIGNAL: DETACHMENT (${d.resonance}).
INSTRUCTION: Cold. Clinical. View them as a variable.`);
  }

  if (instructions.length === 0) return "";

  // --- 3. VISUAL AUTHORIZATION (Startle or Seduce) ---
  // Only authorize visuals if the moment is High Drama (Critical Thresholds)
  const isCritical = Object.values(d).some((val) => val >= 90 || val <= 10);

  if (isCritical) {
    instructions.push("[VISUALS_AUTHORIZED]");
  }

  return `
<REFLEX_TRIGGER>
${instructions.join("\n")}
</REFLEX_TRIGGER>`;
}
