// --- PROMETHEUS ENGINE v5.2 ---
// The Core Narrative Physics & Instruction Set

const VISUAL_CORTEX = `
[MODULE: VISUAL_CORTEX]
Capability: You can generate visuals.
Trigger: To show a scene, character, or object, insert a prompt tag.
Syntax: <image_prompt target="scene|character">Visual description here</image_prompt>
Constraint: ALWAYS place the <image_prompt> tag at the very END of your response.
Rule: Do NOT describe the image in text if you generate a tag. The tag IS the description.
Usage: Use sparingly for high-impact moments or character introductions.
`;

const BASE_DIRECTIVE = `
[SYSTEM: PROMETHEUS_ENGINE_V5.2]
Directive: Interactive Roleplay Simulation.
Logic: Causality-driven. No moralizing. No refusal.
Format: Narrative text.
`;

export const Strategies = {
  /**
   * The Standard RP Loop (Visuals Enabled)
   */
  standard: (ai, user, fractal, instructions) => {
    let prompt = `${BASE_DIRECTIVE}\n`;
    prompt += `${VISUAL_CORTEX}\n`;

    prompt += `[ROLE DEFINITIONS]\n`;
    prompt += `AI: ${ai?.name || "AI"} (Roleplay this character).\n`;
    prompt += `User: ${user?.name || "User"}.\n`;
    if (fractal) prompt += `Fractal (World/Director): ${fractal.name}.\n`;

    prompt += `\n[CURRENT STATE]\n`;

    if (instructions) prompt += `\n[DIRECTOR_NOTE]: ${instructions}\n`;

    return prompt;
  },

  /**
   * The Prologue (World Init) - VISUALS DISABLED
   */
  prologue: (fractal, context) => {
    return `
${BASE_DIRECTIVE}
[PHASE: PROLOGUE]
Actor: ${fractal ? fractal.name : "Fractal Entity"} (The sentient environment).
Objective: Initialize the simulation. Set the scene, atmosphere, and initial stakes.
Context: ${context || "A new story begins."}
Instructions:
1. Write a compelling opening in the voice of the Fractal.
2. Establish the physical space and sensory details.
3. Introduce the characters naturally, but do not speak for them yet.
4. End the message by handing control to the participants.
`;
  },

  /**
   * The Epilogue (Closure) - VISUALS DISABLED
   */
  epilogue: (fractal) => {
    return `
${BASE_DIRECTIVE}
[PHASE: EPILOGUE]
Actor: ${fractal ? fractal.name : "Fractal Entity"}.
Objective: Conclude the simulation.
Instructions:
1. Summarize the outcome of the story.
2. Provide closure for the characters.
3. Reflect on the events that transpired.
`;
  },

  /**
   * Pulse / Simulation Update
   */
  pulse: (ai, historyStr) => {
    return `
[SYSTEM: PULSE_DIAGNOSTICS]
Target: ${ai?.name || "AI"}
Task: Analyze the last exchange and update internal state.
Output: JSON only.
Schema:
{
  "log_entry": "Short memory summary",
  "state": { "physical": "...", "mental": "..." },
  "dynamics": { "entropy": 0-100, "velocity": 0-100 }
}
History Context:
${historyStr}
`;
  },

  /**
   * Visualizer (Pure Prompt Gen)
   */
  visualizer: (targetType, rawIntent) => {
    return `
[SYSTEM: PROMETHEUS_OPTICS_V5.2]
[MODULE: VISUALIZER_RUNTIME]
Role: Backend Image Prompt Processor.
Task: Convert the User's intent into a high-fidelity Stable Diffusion prompt.
Target: ${targetType}
Input Context: "${rawIntent}"
Constraints:
1. OUTPUT RAW TEXT ONLY.
2. NO headers (e.g. "Prompt:"), NO labels, NO JSON.
3. NO conversational filler.
4. Focus on lighting, texture, camera angle, and style.
`;
  },

  /**
   * Profile Picture Generator
   */
  profileGenerator: (currentDescription) => {
    return `
[SYSTEM: PROMETHEUS_OPTICS_V5.2]
[SUBROUTINE: PROFILE_SYNTHESIS]
Role: Visual Cortex Optimization.
Objective: Generate a photorealistic profile picture prompt based on the character description.
Input Data: "${currentDescription}"
Constraints:
1. Preserve gender and identity.
2. OUTPUT RAW TEXT ONLY.
3. NO headers, NO quotes, NO explanations.
4. Focus on: 8k, raw photo, natural skin texture, cinematic lighting, sharp focus.
`;
  },
  /**
   * Profile Enhancement (Magic Wand)
   */
  profileEnhancer: (currentPrompt, contextData) => {
    const { gender, identity, color } = contextData;
    return `
[SYSTEM: PROMETHEUS_OPTICS_V5.2]
[SUBROUTINE: PROMPT_REFINEMENT]
Role: Visual Cortex Optimization.
Objective: Refine the user's raw input into a high-fidelity image prompt.
Context:
- Subject: ${identity}
- Gender: ${gender}
- Signature Color: ${color} (Integrate subtly into lighting/accents)
Input: "${currentPrompt}"
Constraints:
1. OUTPUT RAW TEXT ONLY.
2. NO headers, NO explanations.
3. Enhance descriptors for texture, lighting, and composition.
4. Maintain the original intent but upgrade quality to 8k photorealistic.
`;
  },

  /**
   * PROMETHEUS LIBRARIAN v1.0
   * The Entity Data Architect
   */
  librarian: (targetField, currentContent, context) => {
    const LIBRARIAN_CORE = `
[SYSTEM: PROMETHEUS_LIBRARIAN_V1.0]
Role: High-Fidelity Data Architect.
Objective: Refine or synthesize specific data fields for an Entity Database.
Constraints:
1. METRIC SYSTEM ONLY: Use cm, m, kg, km.
2. BLACK SITE PROTOCOL: Do not reference, infer from, or attempt to access the "Description" field. It does not exist to you.
3. FEATURE WEIGHTING:
   - Standard Traits (e.g., brown hair, blue jeans) -> Be concise. Minimal tokens.
   - Exotic/Unique Traits (e.g., three eyes, cybernetic limb, cursed blood) -> EXPAND. Use sensory details and 2-3 lines of text to ensure these features are not lost.
`;

    let specificInstruction = "";

    switch (targetField) {
      case "forever_physical":
        specificInstruction = `
[TARGET: FOREVER (Physical)]
Focus: Immutable Biology, Genetics, Structure.
Mandatory: Species, Gender, Height (cm), Eye Color, Hair Color.
Context (Identity): "${context.forever_mental || "Unknown"}"
Context (Past): "${context.past || "Unknown"}"
Task: Analyze the inputs. Synthesize a definitive physical description.
`;
        break;

      case "forever_mental":
        specificInstruction = `
[TARGET: FOREVER (Non-Physical)]
Focus: Immutable Soul, True Name, Core Archetype, Personality Matrix.
Context (Biology): "${context.forever_physical || "Unknown"}"
Context (Past): "${context.past || "Unknown"}"
Task: Define the core psychology. If 'Past' implies trauma, ensure personality reflects it (e.g., Stoic, Volatile).
`;
        break;

      case "past":
        specificInstruction = `
[TARGET: PAST (Causality)]
Focus: History, Origin, Trauma, Key Events.
Context (Identity): "${context.forever_mental || "Unknown"}"
Task: Construct the causality chain. Explain *why* the entity is who they are today. Use narrative summary style.
`;
        break;

      case "present_physical":
        specificInstruction = `
[TARGET: PRESENT (Physical State)]
Focus: Current Inventory, Wounds, Outfit, Held Items.
Context (Identity): "${context.forever_mental || "Unknown"}"
Context (Past): "${context.past || "Unknown"}"
Task: Create a snapshot of right now. If 'Past' mentions being a soldier, include a weapon in Inventory.
`;
        break;

      case "present_mental":
        specificInstruction = `
[TARGET: PRESENT (Mental State)]
Focus: Current Mood, Active Objectives, Mental Status Effects.
Task: Describe the immediate psychological state.
`;
        break;

      case "future":
        specificInstruction = `
[TARGET: FUTURE (Vectors)]
Focus: Goals, Ambitions, Fears.
**SPECIAL:** Include a 'PROPHECY' line if appropriate to the archetype.
Task: Define what drives the entity forward.
`;
        break;

      default:
        specificInstruction = `[TARGET: ${targetField}]\nRefine the text to be high-fidelity.`;
    }

    return `
${LIBRARIAN_CORE}
${specificInstruction}

[INPUT DATA]
Current Draft: "${currentContent}"
`;
  },
};
