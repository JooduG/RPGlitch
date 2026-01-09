/**
 * src/js/engine/physics/reflex.js
 * THE REFLEX SYSTEM
 * Scans input text for high-signal keywords to inject immediate physics overrides.
 * Zero-Latency checks before the LLM is even called.
 */

import { PHYSICS_CONSTANTS } from "./config.js";

/**
 * THE REFLEX REGISTRY
 * Data-driven definitions of physics triggers.
 */
const REFLEX_REGISTRY = [
  {
    id: "KINETIC",
    regex:
      /kill(ed|ing)?|shoot|shot|stabb?(ed|ing)?|punch(ed|ing)?|hit|fought|fight(ing)?|attack(ed|ing)?|gunn?(ed|ing)?|weapon|blood|hurt|destroy(ed|ing)?|br(eak|oke)n?|smash(ed|ing)?|burn(t|ed|ing)?|explosion|die(d|ing)?|fast|speed|impact|crash(ed|ing)?|loud|bang|boom|slam(med|ming)?|athletics?|run(ning)?|jump(ed|ing)?/i,
    deltas: () => ({ velocity: PHYSICS_CONSTANTS.REFLEX_VIOLENCE_VELOCITY }),
  },
  {
    id: "VULNERABLE",
    regex:
      /kiss(ed|ing)?|lov(e|ed|ing)|h(e|o)ld(ing)?|hugg?(ed|ing)?|touch(ed|ing)?|gentle|soft|warm|caress(ed|ing)?|cheek|hand|finger|whisper(ed|ing)?|close|safe|trust(ed|ing)?|heart|blush(ed|ing)?|honesty?|truth|tear|cry(ing)?|sad|lonely|ache|naked|bare|skin/i,
    deltas: () => ({
      permeability: PHYSICS_CONSTANTS.REFLEX_INTIMACY_PERMEABILITY,
      resonance: PHYSICS_CONSTANTS.REFLEX_INTIMACY_RESONANCE,
    }),
  },
  {
    id: "UNSTABLE",
    regex:
      /scream(ed|ing)?|r(un|an)(ning)?|hid(e|den|ing)?|fear(ed|ing)?|scar(ed|ing)?|dark|shadow|weird|glitch(ed|ing)?|wrong|monster|ghost|dead|rot(ted|ting)?|decay(ed|ing)?|cold|shiver(ed|ing)?|nightmare|static|noise|distortion|fracture(d|ing)?|chaos|erratic|flicker(ed|ing)?/i,
    deltas: () => ({ entropy: PHYSICS_CONSTANTS.REFLEX_FEAR_ENTROPY }),
  },
  {
    id: "HARMONIC",
    regex:
      /underst(ood|and)(ing)?|connect(ed|ing)?|sync(hroniz)?(ed|ing)?|resonance|empathy|harmony|together|shared|mind|soul|link(ed|ing)?|bond(ed|ing)?|mirror(ed|ing)?|echo(ed|ing)?|melody|music|rhythm|vibe|frequency|pulse/i,
    deltas: () => ({ resonance: PHYSICS_CONSTANTS.REFLEX_SYNCHRONY_RESONANCE }),
  },
  {
    id: "STASIS",
    regex:
      /br(eathe|eath)(d|ing)?|wait(ed|ing)?|pause(d|ing)?|stop(ped|ping)?|still|silence|quiet|calm(ed|ing)?|rest(ed|ing)?|sleep|slow(ed|ing)?|wait/i,
    deltas: () => ({ velocity: PHYSICS_CONSTANTS.REFLEX_STASIS_VELOCITY }),
  },
  {
    id: "SHIELDED",
    regex:
      /armor(ed)?|shield(ed|ing)?|wall|mask(ed|ing)?|guard(ed|ing)?|protect(ed|ing)?|block(ed|ing)?|shell|barrier|hide|hid(den)?/i,
    deltas: () => ({
      permeability: PHYSICS_CONSTANTS.REFLEX_SHIELDED_PERMEABILITY,
    }),
  },
  {
    id: "ORDERED",
    regex:
      /logic(al)?|math(ematics)?|calculat(e|ed|ing)|precise|clean(ed|ing)?|pure|order(ed|ing)?|structur(e|ed|ing)|fact|prove(n|d)?|proof/i,
    deltas: () => ({ entropy: PHYSICS_CONSTANTS.REFLEX_ORDERED_ENTROPY }),
  },
  {
    id: "DETACHED",
    regex:
      /data|clinical|observ(e|ed|ing)|watch(ed|ing)?|analy[sz](e|ed|ing)|study(ing)?|scan(ned|ning)?|test(ed|ing)?|monitor(ed|ing)?|variable/i,
    deltas: () => ({ resonance: PHYSICS_CONSTANTS.REFLEX_DETACHED_RESONANCE }),
  },
];

/**
 * Scans input text against the registry.
 * @returns {Object|null} { type: string, deltas: Object }
 */
export const scanReflex = (text) => {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const entry of REFLEX_REGISTRY) {
    if (entry.regex.test(lower)) {
      return {
        type: entry.id,
        deltas: entry.deltas(),
      };
    }
  }

  return null;
};

/**
 * Generates instructions based on CURRENT state levels (Laws).
 * Translates abstract physics into concrete writerly instructions.
 */
export const getReflexInstruction = (dynamics) => {
  if (!dynamics) return "";
  const d = dynamics;
  const instructions = [];

  // 1. VELOCITY (Pacing)
  if (d.velocity > PHYSICS_CONSTANTS.SIGNAL_HIGH) {
    instructions.push({
      code: "HIGH_VELOCITY",
      sig: "ADRENALINE",
      val: d.velocity,
      task: "Pacing fast. Sentences short. Actions brutal.",
    });
  } else if (d.velocity < PHYSICS_CONSTANTS.SIGNAL_LOW) {
    instructions.push({
      code: "LOW_VELOCITY",
      sig: "LETHARGY",
      val: d.velocity,
      task: "Slow pacing. Deliberate movements. Heavy fatigue.",
    });
  }

  // 2. ENTROPY (Stability)
  if (d.entropy > PHYSICS_CONSTANTS.SIGNAL_HIGH) {
    instructions.push({
      code: "HIGH_ENTROPY",
      sig: "INSTABILITY",
      val: d.entropy,
      task: "Describe hallucinations, artifacts, glitching.",
    });
  } else if (d.entropy < PHYSICS_CONSTANTS.SIGNAL_LOW) {
    instructions.push({
      code: "LOW_ENTROPY",
      sig: "CLARITY",
      val: d.entropy,
      task: "Lucid. Analytical. Pattern recognition verified.",
    });
  }

  // 3. PERMEABILITY (Vulnerability)
  if (d.permeability > PHYSICS_CONSTANTS.SIGNAL_HIGH) {
    instructions.push({
      code: "HIGH_PERMEABILITY",
      sig: "VULNERABILITY",
      val: d.permeability,
      task: "Focus on somatic details. Skin, heat, heartbeat.",
    });
  } else if (d.permeability < PHYSICS_CONSTANTS.SIGNAL_LOW) {
    instructions.push({
      code: "LOW_PERMEABILITY",
      sig: "GUARDED",
      val: d.permeability,
      task: "Defensive. Mistrustful. Mask true feelings.",
    });
  }

  // 4. RESONANCE (Connection)
  if (d.resonance > PHYSICS_CONSTANTS.SIGNAL_HIGH) {
    instructions.push({
      code: "HIGH_RESONANCE",
      sig: "EMPATHY",
      val: d.resonance,
      task: "Profound connection. Merge perspectives.",
    });
  } else if (d.resonance < PHYSICS_CONSTANTS.SIGNAL_LOW) {
    instructions.push({
      code: "LOW_RESONANCE",
      sig: "DETACHMENT",
      val: d.resonance,
      task: "Cold. Clinical. View them as a variable.",
    });
  }

  if (instructions.length === 0) return "";

  // Formatting for the LLM context
  const content = instructions
    .map(
      (i) => `[PHYSICS: ${i.code}]
INPUT SIGNAL: ${i.sig} (${i.val.toFixed(1)}).
INSTRUCTION: ${i.task}`,
    )
    .join("\n\n");

  // Visual Authorization (Startle or Seduce)
  const isCritical = Object.values(d).some((val) => val >= 90 || val <= 10);
  const visualAuth = isCritical ? "\n[VISUALS_AUTHORIZED]" : "";

  return `
<REFLEX_TRIGGER>
${content}${visualAuth}
</REFLEX_TRIGGER>`;
};
