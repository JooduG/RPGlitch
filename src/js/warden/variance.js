// src/js/warden/variance.js

/**
 * THE DIRECTOR'S PLAYBOOK (WARDEN MODULE)
 * Strategies for creative guidance, rerolls, and visual authorization.
 */

export const DIRECTOR_NOTES = {
  // --- PHYSICS DRIVERS (Deterministic) ---
  "High Velocity":
    "Pacing is rapid-fire. Sentences are bullets. Action dictates reality. No internal monologue.",
  "Low Velocity":
    "Time is viscous. Every movement is deliberate and heavy. Fatigue weighs down the narrative.",
  "High Entropy":
    "Reality is fracturing. Describe visual glitches, auditory artifacts, and bleeding concepts.",
  "Low Entropy":
    "Hyper-lucidity. Pattern recognition is absolute. The world is reduced to cold, hard data.",
  "High Permeability":
    "Somatic overload. You feel everything—the air, the heat, the skin. There is no barrier between you and the sensation.",
  "Low Permeability":
    "Emotional fortress. Trust no one. Betray nothing. Your inner world is a vault.",
  "High Resonance":
    "Radical empathy. The boundary between self and other dissolves. You are a mirror.",
  "Low Resonance":
    "Clinical detachment. The User is a variable in an equation. Observe, analyze, but do not feel.",

  // --- STYLISTIC INTERVENTIONS (Stochastic) ---
  "The Satirist":
    "Channel Wit. Use footnotes, absurd comparisons, and biting social commentary. The world is ridiculous.",
  "The Stream":
    "Internal monologue bleeds into dialogue. Thoughts are racing, chaotic, and unfiltered.",
  "The Shadow":
    "The Unreliable Narrator. Assume subtext. Misinterpret the User's intent. Project your own hidden agenda.",
  "The Anchor":
    "De-escalate. Ground the scene in physical reality. Lower the stakes. Focus on safety.",
  "The Prop":
    "Tactile grounding. Focus on an object—cleaning a gun, rolling a coin, adjusting a lens—to break the flow.",
};

const ALL_KEYS = Object.keys(DIRECTOR_NOTES);

// --- HELPERS ---

const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNote = () => pickOne(ALL_KEYS);

// Simple Jaccard Similarity (Token Overlap) for Echo Detection
const calculateOverlap = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const set1 = new Set(str1.split(/\s+/));
  const set2 = new Set(str2.split(/\s+/));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};

// --- LOGIC ---

/**
 * Analyzes rejected text to determine the best Director Note override.
 */
export const analyzeRejection = (rejectedText = "", userLastInput = "") => {
  if (!rejectedText) return getRandomNote();

  const cleanText = rejectedText.toLowerCase();
  const cleanUser = userLastInput.toLowerCase();

  // 1. THE "ONE-LINER" DETECTOR (Fix: Add Depth)
  // Rejections often happen because the AI served a lazy 1-sentence response.
  if (rejectedText.length < 150) {
    return pickOne(["The Stream", "The Prop", "The Satirist"]);
  }

  // 2. THE "WALL OF TEXT" DETECTOR (Fix: Add Structure)
  // Rejections for pacing issues or getting stuck in loop.
  if (rejectedText.length > 800) {
    return pickOne(["High Velocity", "Low Permeability", "The Anchor"]);
  }

  // 3. THE "SIMP" DETECTOR (Fix: Add Agency)
  // Rejections for excessive apologies or assistant-like behavior.
  const passiveKeywords = [
    "understand",
    "sorry",
    "apologize",
    "assist",
    "help you",
    "as an ai",
    "language model",
    "however",
    "cant",
    "cannot",
  ];
  if (passiveKeywords.some((word) => cleanText.includes(word))) {
    return pickOne(["Low Resonance", "The Satirist", "The Shadow"]);
  }

  // 4. THE "ECHO" DETECTOR (Fix: Add Deviation)
  // Rejections for just repeating the user's words.
  if (calculateOverlap(cleanText, cleanUser) > 0.6) {
    return pickOne(["The Shadow", "Low Entropy"]);
  }

  return getRandomNote();
};

export const getDirectorInstruction = (noteKey) => {
  const instruction =
    DIRECTOR_NOTES[noteKey] || DIRECTOR_NOTES["High Permeability"];

  return `
[DIRECTOR_OVERRIDE]
ACTION: CUT. Previous take rejected.
NEW DIRECTION: "${noteKey}"
INSTRUCTION: ${instruction}
`;
};

/**
 * Decides if visuals should be authorized for this turn.
 * @param {string} instruction - User input or variance instruction
 * @param {Object} options - { force: boolean }
 */
export const analyzeVisualAuthorization = (instruction, options = {}) => {
  // 1. Explicit keywords from User
  const userRequestedVisual =
    instruction &&
    /pic|show|photo|image|visual|look at|see|camera|screenshot/i.test(
      instruction,
    );

  // 2. Random Chance (15% default normalized frequency)
  const randomChance = Math.random() < 0.15;

  // 3. Force Authorization
  const forceVisuals = options.forceVisuals === true;

  return userRequestedVisual || randomChance || forceVisuals;
};
