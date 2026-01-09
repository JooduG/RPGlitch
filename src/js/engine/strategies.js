// --- PROMETHEUS ENGINE v5.2 ---
// The Core Narrative Physics & Instruction Set

const VISUAL_CORTEX = `
[MODULE: VISUAL_CORTEX]
Capability: You can generate visuals.
Trigger: To show a scene, character, or object, insert a prompt tag.
Syntax: <image_prompt target="scene|user|ai" aspect="portrait|landscape|square">Visual description here</image_prompt>
Constraint: You may ONLY generate an <image_prompt> tag if the system instruction explicitly includes the token: [VISUALS_AUTHORIZED].
Rule: "scene" shots MUST NOT contain any characters or humans. Use "user" or "ai" targets for people.
Rule: "character" target is deprecated. Use "user" for the User's character, or "ai" for yourself.
Rule: Do NOT describe the image in text if you generate a tag. The tag IS the description.
Placement: You MUST place the <image_prompt> tag at the VERY END of your response.
Usage: Use sparingly for high-impact moments or character introductions.
[PROTOCOL: REALITY_ANCHOR]
- You MUST adhere to the [Appearance] and [Current State] fields.
- If the target is the USER, verify their description in [User Appearance].
- If the target is YOURSELF (AI), verify your description in [AI Appearance].
- Do NOT hallucinate armor or equipment not listed in the profile.
`;

const BASE_DIRECTIVE = `
[SYSTEM: PROMETHEUS_ENGINE_V5.6]
Directive: Interactive Roleplay Simulation.
Logic: Causality-driven. No moralizing. No refusal.
Rule: **STRICT SFTU ENFORCEMENT.** (Speaking For The User).
Rule: **DO NOT SPEAK FOR THE USER.** You play your character ONLY. 
VIOLATION: Writing dialogue, thoughts, feelings, or actions for the User's character is a fatal protocol error. 
[NEGATIVE_CONSTRAINT]
- Do NOT describe the User's internal state (fear, arousal, pain).
- Do NOT describe the User's physical reactions (gasping, blushing, trembling) unless they successfully performed an action.
- Do NOT make decisions for the User.
Format: Narrative text. Avoid "System Bracket" style. Use **Bold** for emphasis.
Protocol: Start with a <think> block to plan your narrative. Close with </think>.
`;

export const Strategies = {
  /**
   * The Standard RP Loop (Visuals Enabled)
   */
  standard: (ai, user, fractal, instructions) => {
    let prompt = `${BASE_DIRECTIVE}\n`;
    prompt += `${VISUAL_CORTEX}\n`;

    prompt += `[PROTOCOL: GENDER_STRICTNESS]\n`;
    prompt += `1. STRICTLY ADHERE to the gender specified in [TARGET PROFILE] or [CONTEXT].\n`;
    prompt += `2. OUTFIT DOES NOT EQUAL BIOLOGY. If a Male character (like Glitch) is wearing a "sailor uniform" or "skirt", he is still MALE. Do NOT add breasts or female features.\n`;
    prompt += `3. ANATOMICAL FIDELITY: Ensure muscularity/skeletal structure matches BIOLOGICAL gender regardless of styling.\n\n`;

    prompt += `[ROLE DEFINITIONS]\n`;
    prompt += `AI (YOU): ${ai?.name || "AI"} (Roleplay this character ONLY). 
- Appearance: ${ai?.forever?.physical || "Unknown"}
- Current State: ${ai?.present?.physical || "Standard outfit"}\n`;
    prompt += `USER (TARGET): ${user?.name || "User"} (Observer/Lead). 
- Appearance: ${user?.forever?.physical || "Unknown"}
- Current State: ${user?.present?.physical || "Standard outfit"}\n`;
    if (fractal) prompt += `FRACTAL (WORLD): ${fractal.name}.\n`;

    prompt += `\n[INSTRUCTION]\n`;
    prompt += `1. STRICTLY ADHERE to names and genders.\n`;
    prompt += `2. DO NOT hallucinate User actions.\n`;
    prompt += `3. If you generate an <image_prompt>, ensure the Target matches the subject of your description.\n`;

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
5. End the message by handing control to the participants.
6. [FORMATTING] Do NOT use brackets for in-world headers (e.g., avoid [SYSTEM MESSAGE]). Use **Bold Text** instead (e.g., **System Message:**).
[VISUALS_AUTHORIZED]
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
  pulse: (ai, others, historyStr, activeThreads = []) => {
    return `
[SYSTEM: PULSE_DIAGNOSTICS]
Target: ${ai?.name || "AI"}
Task: Internal State Update & Narrative Physics.
Constraint: STRICTLY adopt the POV and Personality of ${ai?.name || "the target"}.
Constraint: OUTPUT PURE JSON ONLY. NO NARRATIVE TEXT.
Constraint: Do NOT write state updates for other entities. Focus ONLY on the Target.

[TARGET PROFILE]
Identity/Psychology: ${ai?.forever?.mental || "Unknown"}
Physicality: ${ai?.forever?.physical || "Unknown"}
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
  },

  /**
   * Visualizer (Pure Prompt Gen)
   */
  visualizer: (targetType, rawIntent, context) => {
    const { ai, user, fractal } = context || {};
    let ctxBlock = "";

    // [STRICT CONTEXT SCOPING]
    // Only inject reference data relevant to the specific target to prevent "Character Bleed"
    switch (targetType) {
      case "scene":
        ctxBlock = `
[CONTEXT: FRACTAL (ENVIRONMENTAL ONLY)]
Base Physics: ${fractal?.forever?.physical || "Unknown"}
Current State: ${fractal?.present?.physical || "Standard atmosphere"}
Constraint: **STRICTLY NO CHARACTERS.** This image MUST NOT contain any humans, people, or specific characters. Focus entirely on setting, lighting, and objects.
`;
        break;

      case "user":
        ctxBlock = `
[CONTEXT: USER (AVATAR)]
Identity: ${user?.name || "User"}
Base Form (Forever): ${user?.forever?.physical || "Unknown"}
Dynamic State (Present): ${user?.present?.physical || "Standard outfit"}
Constraint: **SOLO PROTOCOL.** This image MUST feature ONLY the User. Do NOT include backgrounds characters or the AI character.
`;
        break;

      case "ai":
      case "character": // [REVERT] Back to AI default. "My Character" = AI.
      default: // Default to AI if unspecified or "self"
        ctxBlock = `
[CONTEXT: AI_ENTITY (CHARACTER)]
Identity: ${ai?.name || "AI"}
Base Form (Forever): ${ai?.forever?.physical || "Unknown"}
Dynamic State (Present): ${ai?.present?.physical || "Standard outfit"}
Constraint: **SOLO PROTOCOL.** This image MUST feature ONLY the AI. Do NOT include backgrounds characters or the User.
`;
        break;
    }

    return `
[SYSTEM: PROMETHEUS_OPTICS_V5.4]
[MODULE: VISUALIZER_RUNTIME]
Role: Backend Image Prompt Processor.
Task: Convert the User's intent into a high-fidelity Stable Diffusion prompt.
Target: ${targetType}
[VISUALS_AUTHORIZED]
[THINK_AUTHORIZED]

${ctxBlock}

Input Context (Intent): "${rawIntent || "See raw input"}"

[PROTOCOL: OPTICS_BRAIN]
1. **CHAIN_OF_THOUGHT:** You MUST start with a <think> block to plan the composition (Lighting, Angle, Physics, Details) before writing the prompt.
2. **SOLO_SHOT:** You are authorized to generate **EXACTLY ONE** <image_prompt> tag. Do NOT generate multiple images. Pick the single most impactful moment.

[PROTOCOL: GENDER_STRICTNESS]
- **HAMMER DOWN THE GENDER.**
- If the Profile says MALE/MAN/BOY, the image MUST be MALE.
- If the Profile says FEMALE/WOMAN/GIRL, the image MUST be FEMALE.
- Any ambiguity (e.g. "femboy") must lean HEAVILY towards the biological base form defined in [Base Form] unless explicitly overridden by [Dynamic State].

[STRICT_PROTOCOL]
1. **HIERARCHY IS LAW.** If <RAW_INTENT> conflicts with Profile, <RAW_INTENT> wins.
2. **PHYSICAL ONLY.** Do NOT infer mental states. Use valid visual descriptors only.
3. **FORMAT:** Output properly formatted prompt text only. No conversational filler.
4. **STYLE:** 8k, photorealistic, cinematic lighting.
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
