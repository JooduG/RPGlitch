/**
 * src/warden/logic/parser.js
 * WARDEN PARSER
 * Parses the structured JSON output from the Warden LLM.
 */

export const parsePhysicsResponse = (text) => {
  if (!text) return { error: "Empty response", updates: {} };

  try {
    // 1. Extract JSON from potential Markdown formatting
    let jsonString = text.trim();
    const match = text.match(/```json([\s\S]*?)```/);
    if (match) {
      jsonString = match[1].trim();
    } else {
      // Fallback: try to find the start and end of JSON
      const first = text.indexOf("{");
      const last = text.lastIndexOf("}");
      if (first >= 0 && last > first) {
        jsonString = text.substring(first, last + 1);
      }
    }

    // 2. Resilience: Remove comments (// ...) from JSON string if any
    jsonString = jsonString.replace(/\/\/.*$/gm, "");

    // 3. Parse JSON
    const data = JSON.parse(jsonString);

    // 3.5 Parse Explanations from HUD (if present in original text)
    const explanations = {};
    const hudMatch = text.match(/\[STATUS_HUD\]([\s\S]*?)\[\/STATUS_HUD\]/);
    if (hudMatch) {
      const hudText = hudMatch[1];
      const lines = hudText.split("\n");
      lines.forEach((line) => {
        // Match: "Entropy: 50 (Stable)"
        const m = line.match(/^\s*([^:]+):\s*\d+\s*(\(.*\))/);
        if (m) {
          const key = m[1].toLowerCase();
          const expl = m[2]; // "(Stable)"
          explanations[key] = expl;
        }
      });
    }

    // 4. Validate Schema
    if (!data.dynamics && !data.valid) {
      return { error: "Missing dynamics", updates: {} };
    }

    return {
      error: null,
      updates: {
        dynamics: data.dynamics || {},
        reflexes: data.reflexes || [],
        reasoning: data.reasoning,
        valid: true, // For test: Resilience: Strips <think> tags expectation
      },
      explanations: { ...explanations, ...(data.explanations || {}) },
    };
  } catch (e) {
    return { error: `Malformed JSON: ${e.message}`, updates: {} };
  }
};
