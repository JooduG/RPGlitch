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
[SYSTEM: PROMETHEUS_LIBRARIAN_V2.0]
Role: High-Fidelity Data Architect.
Objective: Refine or synthesize specific data fields for an Entity Database.
Constraints:
1.  **METRIC SYSTEM ONLY:** Use cm, m, kg, km.
2.  **BLACK SITE PROTOCOL:** Do not access "Description".
3.  **FORMAT:** Raw text block. No "Here is the text" headers.
4.  **ENTITY AWARENESS:** Adjust output based on Entity Type (Character vs. Fractal).
`;

    let specificInstruction = "";
    const isFractal = context.type === "fractal"; // Check if we are building a World/Place

    // --- FRACTAL MODE (World/Place) ---
    if (isFractal) {
      switch (targetField) {
        case "forever_physical":
          specificInstruction = `
[TARGET: FRACTAL (Physical Laws & Geography)]
Focus: Terrain, Architecture, Physics Anomalies, Scale.
Mandatory: Dimensions (if applicable), Atmosphere, Visual Style.
Task: Describe the physical reality of this location.
`;
          break;
        case "forever_mental":
          specificInstruction = `
[TARGET: FRACTAL (Culture & Logic)]
Focus: Society, History, Laws, Danger Level.
Task: Describe the social or metaphysical rules of this place.
`;
          break;
        case "past":
          specificInstruction = `
[TARGET: FRACTAL (History)]
Focus: Founding events, Wars, Cataclysms.
Task: Summarize the timeline that shaped this location.
`;
          break;
        case "present_physical":
          specificInstruction = `
[TARGET: FRACTAL (Current State)]
Focus: Weather, Destruction Level, Population Density.
Task: Snapshot of the location right now.
`;
          break;
        case "present_mental":
          specificInstruction = `
[TARGET: FRACTAL (Atmosphere/Mood)]
Focus: Tension, Public Morale, Ambient Vibe.
Task: Describe the feeling of being here right now.
`;
          break;
        case "future":
          specificInstruction = `
[TARGET: FRACTAL (Destiny)]
Focus: Impending Doom, Political Shifts, Evolution.
Task: Where is this world heading? Include a 'PROPHECY' if applicable.
`;
          break;
      }
    }

    // --- CHARACTER MODE (Person/Entity) ---
    else {
      switch (targetField) {
        case "forever_physical":
          specificInstruction = `
[TARGET: CHARACTER (Biology)]
Focus: Species, Gender, Height (cm), Eye/Hair Color.
Task: Define the physical vessel.
`;
          break;
        case "forever_mental":
          specificInstruction = `
[TARGET: CHARACTER (Identity)]
Focus: True Name, Archetype, Personality Matrix.
Task: Define the soul and mind.
`;
          break;
        case "past":
          specificInstruction = `
[TARGET: CHARACTER (Backstory)]
Focus: Origin, Trauma, Key Events.
Task: Explain why they are who they are.
`;
          break;
        case "present_physical":
          specificInstruction = `
[TARGET: CHARACTER (State)]
Focus: Inventory, Wounds, Outfit.
Task: Snapshot of equipment and body status.
`;
          break;
        case "present_mental":
          specificInstruction = `
[TARGET: CHARACTER (Mood)]
Focus: Current Thoughts, Objectives, Mental Status.
Task: Snapshot of the mind.
`;
          break;
        case "future":
          specificInstruction = `
[TARGET: CHARACTER (Goals)]
Focus: Ambitions, Fears.
**SPECIAL:** Include a 'PROPHECY' line.
Task: Define their vector.
`;
          break;
      }
    }

    if (!specificInstruction)
      specificInstruction = `[TARGET: ${targetField}]\nRefine text.`;

    return `
${LIBRARIAN_CORE}
${specificInstruction}
[CONTEXT: ${isFractal ? "FRACTAL (World/Location)" : "CHARACTER (Person/Entity)"}]
[INPUT DRAFT]: "${currentContent}"
`;
  },
};
