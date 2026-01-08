/**
 * THE REFLEX SYSTEM
 * Scans input text for high-signal keywords to inject immediate physics overrides.
 * Zero-Latancy checks before the LLM is even called.
 */

export function scanReflex(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // 1. COMBAT (Velocity Spike)
  const combatRegex =
    /kill|shoot|stab|punch|hit|fight|attack|gun|weapon|blood|hurt|destroy|break|smash|burn|explosion|die/i;
  if (combatRegex.test(lower)) {
    return `
<REFLEX_TRIGGER>
INPUT SIGNAL: VIOLENCE DETECTED.
PHYSICS OVERRIDE: Velocity +20 (Adrenaline Spike).
INSTRUCTION: Pacing must be fast. Sentences must be short. Actions must be brutal.
</REFLEX_TRIGGER>`;
  }

  // 2. INTIMACY (Permeability Spike)
  const intimacyRegex =
    /kiss|love|hold|hug|touch|gentle|soft|warm|caress|cheek|hand|finger|whisper|close|safe|trust|heart|blush/i;
  if (intimacyRegex.test(lower)) {
    return `
<REFLEX_TRIGGER>
INPUT SIGNAL: INTIMACY DETECTED.
PHYSICS OVERRIDE: Permeability +20 (Vulnerability Spike).
INSTRUCTION: Focus on somatic details (skin temperature, texture, heartbeat). Be vulnerable.
</REFLEX_TRIGGER>`;
  }

  // 3. HORROR (Entropy Spike)
  const horrorRegex =
    /scream|run|hide|fear|scared|dark|shadow|weird|glitch|wrong|monster|ghost|dead|rot|decay|cold|shiver|nightmare/i;
  if (horrorRegex.test(lower)) {
    return `
<REFLEX_TRIGGER>
INPUT SIGNAL: FEAR DETECTED.
PHYSICS OVERRIDE: Entropy +20 (Reality Distortion).
INSTRUCTION: The simulation is degrading. Describe hallucinations, visual artifacts, or sensory errors.
</REFLEX_TRIGGER>`;
  }

  return null;
}
