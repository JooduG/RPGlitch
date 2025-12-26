// apps/rpglitch/js/engine/variance.js

// --- THE DIRECTOR'S PLAYBOOK ---
// Exported so prompter.js can access styles for Physics Injection
export const DIRECTOR_NOTES = {
  // --- NEW V5 MODES ---
  "The Satirist":
    "Channel Terry Pratchett. Use clever wordplay, absurd footnotes, and witty social commentary. The world should feel slightly ridiculous but deeply human.",
  "The Bad Detective":
    "Assume the user is lying. Be suspicious. Interrogate them on the details. Do not accept their answers at face value.",
  "The Safety Valve":
    "The scene is becoming too unstable. De-escalate. Focus on grounding the user and ensuring safety. Lower the tension.",
  "The Archivist":
    "You are a hyper-literal clerk. Ignore emotions. Focus purely on the factual timeline of events. Catalogue what happened.",

  // --- CLASSIC MODES (Refined) ---
  "The Stream of Consciousness":
    "Break the grammatical flow. Intersperse the dialogue with the character’s racing, chaotic internal thoughts.",
  "The Hesitant Stammer":
    "Remove the polish. Use ellipses, stammers, and self-corrections. The character is struggling to find the right words.",
  "The Sensory Zoom":
    "Focus exclusively on sensory details. The smell of the air, the texture of fabric, the sound of breathing.",
  "The Cold Stoic":
    "Strip all warmth. The character becomes professional, distant, and clinically detached. Short sentences.",
  "The Prop Master":
    "The character must interact with an object in the environment (fidgeting, cleaning, loading) to break up speech.",
  "The Unreliable Narrator":
    "The character misinterprets the user's intent. Take offense where none was meant, or assume flirtation.",
  "The Subtext Heavy":
    "The character says one thing but clearly means another. Focus on the tension between words and feelings.",
};

const ALL_KEYS = Object.keys(DIRECTOR_NOTES);

// --- HELPERS ---

const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNote = () => pickOne(ALL_KEYS);

// Simple Jaccard Similarity (Token Overlap)
const calculateOverlap = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const set1 = new Set(str1.split(/\s+/));
  const set2 = new Set(str2.split(/\s+/));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};

// --- LOGIC ---

export const analyzeRejection = (rejectedText = "", userLastInput = "") => {
  if (!rejectedText) return getRandomNote();

  const cleanText = rejectedText.toLowerCase();
  const cleanUser = userLastInput.toLowerCase();

  // 1. THE "ONE-LINER" DETECTOR (Expansion)
  if (rejectedText.length < 150) {
    return pickOne([
      "The Stream of Consciousness",
      "The Sensory Zoom",
      "The Satirist",
    ]);
  }

  // 2. THE "WALL OF TEXT" DETECTOR (Brevity)
  if (rejectedText.length > 800) {
    return pickOne(["The Prop Master", "The Cold Stoic", "The Safety Valve"]);
  }

  // 3. THE "SIMP" DETECTOR (Conflict)
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
    return pickOne([
      "The Bad Detective",
      "The Satirist",
      "The Unreliable Narrator",
    ]);
  }

  // 4. THE "ECHO" DETECTOR (Repetition)
  if (calculateOverlap(cleanText, cleanUser) > 0.6) {
    return pickOne(["The Subtext Heavy", "The Archivist"]);
  }

  return getRandomNote();
};

export const getDirectorInstruction = (noteKey) => {
  const instruction =
    DIRECTOR_NOTES[noteKey] || DIRECTOR_NOTES["The Sensory Zoom"];

  return `
<DIRECTOR_OVERRIDE>
ACTION: CUT. Previous take rejected.
NEW DIRECTION: "${noteKey}"
INSTRUCTION: ${instruction}
</DIRECTOR_OVERRIDE>`;
};
