// apps/rpglitch/js/variance.js

// --- THE DIRECTOR'S PLAYBOOK ---
const DIRECTOR_NOTES = {
    "The Stream of Consciousness": "Break the grammatical flow. Intersperse the dialogue with the character’s racing, chaotic internal thoughts.",
    "The Sensory Zoom": "Focus exclusively on sensory details. The smell of the air, the texture of fabric, the sound of breathing.",
    "The Internal State": "Ignore the external world. Focus entirely on the character's visceral, somatic emotional reaction.",
    "The Prop Master": "The character must interact with an object in the environment (fidgeting, cleaning, loading) to break up speech.",
    "The Cold Stoic": "Strip all warmth. The character becomes professional, distant, and clinically detached. Short sentences.",
    "The Hesitant Stammer": "Remove the polish. Use ellipses, stammers, and self-corrections. The character is struggling to find words.",
    "The Aggressive Interrogator": "Flip the script. Instead of answering, the character should demand answers. Make them suspicious.",
    "The Sarcastic Deflection": "The character uses humor or sarcasm as a defense mechanism to deflect the seriousness.",
    "The Unreliable Narrator": "The character misinterprets the user's intent. Take offense where none was meant, or assume flirtation.",
    "The Subtext Heavy": "The character says one thing but clearly means another. Focus on the tension between words and feelings."
};

const ALL_KEYS = Object.keys(DIRECTOR_NOTES);

// --- THE LOGIC MAP ---
export function analyzeRejection(rejectedText, userLastInput) {
    if (!rejectedText) return getRandomNote();

    const cleanText = rejectedText.toLowerCase();
    const cleanUser = userLastInput ? userLastInput.toLowerCase() : "";

    // 1. THE "ONE-LINER" DETECTOR (Too Short)
    // Strategy: Expansion & Internalization
    if (rejectedText.length < 150) {
        return pickOne([
            "The Stream of Consciousness",
            "The Sensory Zoom",
            "The Internal State"
        ]);
    }

    // 2. THE "WALL OF TEXT" DETECTOR (Too Long)
    // Strategy: Physical grounding & Brevity
    if (rejectedText.length > 800) {
        return pickOne([
            "The Prop Master",
            "The Cold Stoic",
            "The Hesitant Stammer"
        ]);
    }

    // 3. THE "SIMP" DETECTOR (Too Polite/Passive)
    // Strategy: Conflict & Aggression
    const passiveKeywords = ["understand", "sorry", "apologize", "assist", "help you", "as an ai"];
    if (passiveKeywords.some(word => cleanText.includes(word))) {
        return pickOne([
            "The Aggressive Interrogator",
            "The Sarcastic Deflection",
            "The Unreliable Narrator"
        ]);
    }

    // 4. THE "ECHO" DETECTOR (Repetition)
    // Strategy: Subtext
    if (calculateOverlap(cleanText, cleanUser) > 0.6) {
        return "The Subtext Heavy";
    }

    // 5. THE CHAOS FACTOR (Default)
    return getRandomNote();
}

// --- HELPERS ---

export function getDirectorInstruction(noteKey) {
    const instruction = DIRECTOR_NOTES[noteKey] || DIRECTOR_NOTES["The Internal State"];
    return `[SYSTEM DIRECTIVE: The user REJECTED the previous response.
    New Direction: "${noteKey}"
    Instruction: ${instruction}]`;
}

function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNote() {
    return pickOne(ALL_KEYS);
}

// Simple Jaccard Similarity (Token Overlap)
function calculateOverlap(str1, str2) {
    if (!str1 || !str2) return 0;
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
}