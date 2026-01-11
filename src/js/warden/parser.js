/**
 * src/js/warden/parser.js
 * WARDEN PARSER & TEMPLATES
 * Handles the construction of System Prompts and the extraction of Structured Data (JSON).
 */

// ============================================================================
// 1. INPUT PROCESSING (Prompt Engineering)
// ============================================================================

/**
 * The System Prompt Template (Migrated from strategies.js)
 */
export const template = (ai, others, historyStr, activeThreads = []) => {
  return `
[SYSTEM: PROMETHEUS_WARDEN]
Target: ${ai?.name || "AI"}
Task: Internal State Update & Narrative Physics.
Constraint: STRICTLY adopt the POV and Personality of ${ai?.name || "the target"}.
Constraint: OUTPUT PURE JSON ONLY. NO NARRATIVE TEXT.
Constraint: Do NOT write state updates for other entities. Focus ONLY on the Target.

[TARGET PROFILE]
Identity/Psychology: ${ai?.eternal?.mental || "Unknown"}
Physicality: ${ai?.eternal?.physical || "Unknown"}
Current State: ${ai?.present?.mental || "Unknown"}

[HISTORY CONTEXT]
${historyStr}

[PLOT CONTEXT]
Active Threads: ${JSON.stringify(activeThreads || [])}

[INSTRUCTION]
Based on the [HISTORY CONTEXT], generate a JSON object representing the internal state change.
Do NOT continue the story. Do NOT write dialogue.
Your response must be a SINGLE valid JSON block matching this schema:

[JSON SCHEMA]
{
  "log_entry": "Short summary of events from ${ai?.name}'s biased perspective.",
  "state": { 
    "physical": "Current status of ${ai?.name}'s body/equipment ONLY.", 
    "mental": "Current thoughts/emotions of ${ai?.name} ONLY." 
  },
  "dynamics": { 
    "entropy": "+/- Integer (e.g. +10, -5).", 
    "velocity": "+/- Integer.",
    "resonance": "+/- Integer.",
    "permeability": "+/- Integer."
  },
  "plot": {
    "new_threads": ["New plot hooks POV-relevant to ${ai?.name}"],
    "resolved_indices": [Index numbers of Active Threads resolved this turn]
  }
}
`;
};

/**
 * Composes the full Warden Prompt, handling history formatting.
 */
export const compose = (
  targetEntity,
  others,
  historyMessages,
  activeThreads,
) => {
  const historyText = historyMessages
    .map((m) => {
      const label =
        m.characterName || (m.role === "user" ? "User" : "Character");
      const text = m.content || m.text || "";
      return `[${label}]: ${text}`;
    })
    .join("\n");

  return template(targetEntity, others, historyText, activeThreads);
};

// ============================================================================
// 2. OUTPUT PROCESSING (Extraction)
// ============================================================================

/**
 * Extracts JSON structure from the AI's response, robustly handling deviations.
 */
export const parse = (text) => {
  const result = { updates: {}, explanations: {}, error: null };
  try {
    const hudMatch = text.match(/\[STATUS_HUD\]([\s\S]*?)\[\/STATUS_HUD\]/);
    if (hudMatch) {
      hudMatch[1].split("\n").forEach((line) => {
        const match = line.match(/^\s*(\w+):\s*\d+\s*(\(.*?\))/);
        if (match) result.explanations[match[1].toLowerCase()] = match[2];
      });
    }

    const cleanJson = text
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/\[STATUS_HUD\][\s\S]*?\[\/STATUS_HUD\]/g, "")
      .replace(/\s+\/\/.*$/gm, "")
      .trim();

    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) result.updates = JSON.parse(jsonMatch[0]);
    else result.error = "No JSON block found";
  } catch (e) {
    result.error = e.message;
  }
  return result;
};
