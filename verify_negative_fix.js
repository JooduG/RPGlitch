
const isMale = true;
const isFractal = false;

// --- LOGIC START ---
        // 3. Negative Prompting
        let negParts = [];
        if (isMale) negParts.push("woman, girl, female, boobs, feminine");

        // [FIX] Do NOT add "anime, cartoon..." here.
        // VisualManager checks for "anime" in negative prompt.
        // If missing, it automatically injects a massive high-fidelity negative list.
        // We want that list.

        // Base negatives
        negParts.push("text, watermark, blurry, low quality");
// --- LOGIC END ---

const finalNeg = negParts.join(", ");
console.log("FINAL NEG:", finalNeg);

if (!finalNeg.includes("anime")) {
    console.log("SUCCESS: 'anime' tag correctly excluded.");
} else {
    console.log("FAILURE: 'anime' tag present.");
}
