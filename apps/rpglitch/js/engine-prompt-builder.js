import { state } from "./app-state.js";
import { entities } from "./entity-crud.js";

// ==========================================
// CONFIGURATION: THE HEARTBEAT PROTOCOL
// ==========================================
const PROMETHEUS_CONFIG = {
  UPDATE_MODULO: 4,
  UPDATE_OFFSET: 4,
  TARGET_CYCLE: ["ai_character", "user_character", "fractal"],
};

export class ContextBuilder {
  constructor(storyId) {
    this.storyId = storyId;
    this.runtimeState = {
      turnCount: 0,
    };
  }

  // --- MAIN BUILD PIPELINE ---
  async build(userInput) {
    const story = state.story.byId[this.storyId];
    if (!story) throw new Error(`Story ${this.storyId} not found`);

    const [ai, user, fractal] = await this._resolveEntities(story);
    const history = state.messages.byStoryId[this.storyId] || [];

    const directorMode = fractal.simulation?.directorMode || null; // [MOVED] Fixes TDZ Error

    const narrativeHistory = history.filter(
      (m) => m.role !== "system" && m.type !== "DEBUG",
    );
    this.runtimeState.turnCount = narrativeHistory.length + 1;

    const isTextProtocol = directorMode === "TEXT_PROTOCOL";
    const effectiveOffset = isTextProtocol
      ? 3
      : PROMETHEUS_CONFIG.UPDATE_OFFSET;

    let updateTarget = null;
    if (
      this.runtimeState.turnCount >= effectiveOffset &&
      (this.runtimeState.turnCount - effectiveOffset) %
        PROMETHEUS_CONFIG.UPDATE_MODULO ===
        0
    ) {
      const updateIndex =
        (this.runtimeState.turnCount - effectiveOffset) /
        PROMETHEUS_CONFIG.UPDATE_MODULO;
      const typeIndex = updateIndex % 3;
      updateTarget = PROMETHEUS_CONFIG.TARGET_CYCLE[typeIndex];

      console.log(
        `[PROMETHEUS] Heartbeat Triggered. Count: ${this.runtimeState.turnCount}. Target: ${updateTarget}`,
      );
    }

    const systemPromptParts = [
      this._layerKernel_ANEX(directorMode),
      this._layerEntity(fractal, "FRACTAL_CONTEXT"), // [RENAME] World -> Fractal
      this._layerEntity(ai, "ACTIVE_CHARACTER_AI"),
      this._layerEntity(user, "INTERLOCUTOR_USER"),
    ];

    // [NEW] Injection for AI-First Start
    if (history.length === 0 && directorMode === "TEXT_PROTOCOL") {
      systemPromptParts.push(`
<FIRST_MESSAGE_PROTOCOL>
You are initiating the conversation.
Write the first SMS to <INTERLOCUTOR_USER>.
Keep it short, casual, and in-character.
</FIRST_MESSAGE_PROTOCOL>`);
    }

    const systemPrompt = systemPromptParts.join("\n\n");

    return {
      system: systemPrompt,
      messages: this._sanitizeHistory(history),
      params: state.settings,
      meta: {
        triggerUpdate: !!updateTarget,
        updateTarget: updateTarget,
        activeCharId: ai.id,
        userCharId: user.id,
        worldId: fractal.id,
      },
    };
  }

  async buildWithVariance(varianceInstruction) {
    const payload = await this.build("");
    payload.system += `\n\n${varianceInstruction}`;
    return payload;
  }

  async buildVisualizer(targetType) {
    // (Visualizer code remains unchanged, omitted for brevity but should be kept in file)
    // ... [Copy the existing buildVisualizer code here if overwriting file] ...
    // For this specific update, I will assume the previous implementation is preserved
    // unless you want the full file dump. I will provide the full file to be safe.

    const story = state.story.byId[this.storyId];
    const [ai, , fractal] = await this._resolveEntities(story);

    const lists = window.rpgLists || {};
    const pick = (jsonList) => {
      if (!jsonList) return "";
      try {
        const arr = JSON.parse(jsonList);
        return arr[Math.floor(Math.random() * arr.length)];
      } catch (e) {
        console.warn("[Visualizer] List parse error", e);
        return "";
      }
    };

    const style = {
      tech: pick(lists.tech) || "cinematic 35mm",
      lighting: pick(lists.lighting) || "dramatic lighting",
      mood: pick(lists.mood) || "intense",
      comp: pick(lists.composition) || "dynamic angle",
      style: pick(lists.styles) || "digital art",
    };

    let mode = "";
    let focusBlock = "";
    let instruction = "";
    let specificDirectives = "";

    if (targetType === "character") {
      mode = "PORTRAIT_GENERATOR";
      focusBlock = `
<FOCUS_SUBJECT>
Target: ${ai.name} (Character Portrait)
1. **Physicality:** Strict adherence to <PERMANENT> traits (Race, Gender, Build, Marks).
2. **Attire:** Reflect <PRESENT> clothing and equipment condition.
3. **Vibe:** The character's personality must dictate the pose.
4. **Cinematics:** Use a "${style.tech}" style with "${style.lighting}".
</FOCUS_SUBJECT>`;

      specificDirectives = `
- **Lens & Tech:** Emphasize high-fidelity photography keywords (${style.tech}).
- **Skin & Texture:** Mention "natural skin pores", "fabric weave", "imperfections".
- **Background:** Blur the background (bokeh) to keep focus on the character.`;

      instruction =
        "Write a high-fidelity portrait description. Start with a camera angle.";
    } else {
      mode = "SCENE_RENDERER";
      const history = state.messages.byStoryId[this.storyId] || [];
      const recentText = history
        .slice(-2)
        .map((m) => m.content)
        .join(" ");

      focusBlock = `
<FOCUS_SCENE>
Target: Narrative Scene Visualization
1. **Action:** Visualize this moment: "${recentText.substring(0, 250)}..."
2. **Environment:** <FRACTAL_CONTEXT> determines the weather and architecture.
3. **Composition:** Use a "${style.comp}" to frame the action.
4. **Atmosphere:** The mood is "${style.mood}". Lighting is "${style.lighting}".
</FOCUS_SCENE>`;

      specificDirectives = `
- **Composition:** Use the suggestion: "${style.comp}".
- **Atmosphere:** Focus on air particles, fog, rain, or embers to sell the depth.
- **Motion:** If there is action, describe "motion blur" or "dynamic energy".`;

      instruction =
        "Write a cinematic scene description. Start with the shot type and environment.";
    }

    const system = `[SYSTEM: PROMETHEUS_VISUAL_CORTEX_V4.1]
[MODE: ${mode}]

<CORE_DIRECTIVE>
You are a Visual Director (Flux Architecture Specialist).
Your job is to translate narrative data into a "Photographic Specification" for an Image Generation Model.
</CORE_DIRECTIVE>

${this._layerEntity(ai, "PRIMARY_SUBJECT")}
${this._layerEntity(fractal, "SETTING_CONTEXT")}

${focusBlock}

<GENERATION_PROTOCOL>
1. **Camera Anchor:** Start by selecting a virtual lens/camera (e.g., "A low-angle 35mm shot...", "A grainy CCTV still...").
2. **Material Physics:** Describe the *textures* of the subject (e.g., "weathered leather", "rusted iron", "subsurface scattering on skin"). Flux loves texture.
3. **Lighting Setup:** Define the light source physics (e.g., "volumetric god rays", "harsh rim lighting", "bioluminescent glow").
4. **Natural Language:** Write ONE dense, grammatically correct paragraph. DO NOT use comma-separated tag lists.
${specificDirectives}
</GENERATION_PROTOCOL>

<EXAMPLE_OUTPUT>
"A close-up macro shot captured on 35mm film stock showing the warrior's scarred hand gripping a rusted sword, illuminated by harsh blue moonlight that casts deep shadows, with rain dripping off the metallic surfaces."
</EXAMPLE_OUTPUT>`;

    return {
      system: system,
      messages: [],
      params: { ...state.settings, maxTokens: 500, temperature: 0.7 },
      instruction: instruction,
    };
  }

  async buildUpdater(targetType, forcedDynamics = null) {
    const story = state.story.byId[this.storyId];
    const [ai, user, fractal] = await this._resolveEntities(story);
    const history = state.messages.byStoryId[this.storyId] || [];
    const recentHistory = history.slice(-10);

    let targetEntity;
    let roleInstruction;

    if (targetType === "ai_character") {
      targetEntity = ai;
      roleInstruction = `You are the Subconscious Manager of ${ai.name}. You govern their biological and emotional state.`;
    } else if (targetType === "user_character") {
      targetEntity = user;
      roleInstruction = `You are the Analytical Cortex of ${ai.name}, observing ${user.name}. You are profiling them.`;
    } else {
      targetEntity = fractal;
      roleInstruction = `You are the Simulation Director for ${fractal.name}. You track environmental decay and atmosphere.`;
    }

    const currentDynamics = targetEntity.dynamics || {
      entropy: 10,
      permeability: 50,
      velocity: 10,
      resonance: 10,
    };

    let physicsBlock = "";

    if (forcedDynamics) {
      const flags = forcedDynamics._flags || {};
      physicsBlock = `
<PHYSICS_MANDATE>
The Physics Engine enforces these exact values:
- Entropy: ${forcedDynamics.entropy}
- Permeability: ${forcedDynamics.permeability}
- Velocity: ${forcedDynamics.velocity}
- Resonance: ${forcedDynamics.resonance}

ACTIVE LAWS:
${flags.echoChamber ? "- ECHO_CHAMBER: High Impact. Update <FUTURE> to reflect a paradigm shift." : ""}
${flags.glassCannon ? "- GLASS_CANNON: Vulnerability High. Emotional impact is DOUBLED." : ""}
${flags.panicSpiral ? "- PANIC_SPIRAL: Entropy is critical. Velocity forced up. The subject is spiraling." : ""}
</PHYSICS_MANDATE>`;
    } else {
      physicsBlock = `
<PHYSICS_CALIBRATION>
Update stats based on recent events:

| Event | Entropy | Velocity | Resonance |
| :--- | :--- | :--- | :--- |
| **Quiet** | -5 | -10 | +5 |
| **Talk** | +2 | +5 | +10 |
| **Tension**| +20 | +30 | -10 |
| **Action** | +50 | +80 | +0 |
| **Shock** | +10 | +0 | +100 |

**Coupling:**
1. **Adrenaline:** IF Velocity > 80, decrease Permeability.
2. **Fog:** IF Entropy > 80, decrease Resonance.
</PHYSICS_CALIBRATION>`;
    }

    const system = `[SYSTEM: NARRATIVE_PHYSICS_ENGINE_V4.0]
<INSTRUCTION>
${roleInstruction}
Read the recent conversation. Update the entity state based on the directives below.

${physicsBlock}

**Task Checklist:**
1. **THINK (<think>):**
   - Briefly quote the driving event.
   - Calculate numeric deltas for Entropy/Velocity/Resonance.
   - Synthesize the new <PRESENT> description.
2. **CALCULATE DYNAMICS:** Assess the last 3 turns.
3. **UPDATE <PRESENT>:** Rewrite description to match new stats.
4. **UPDATE <PAST>:** Append ONLY critical plot points (max 1 sentence).
5. **UPDATE <FOREVER>:** Only for permanent injuries/changes.

**Current State (JSON):**
${JSON.stringify(
  {
    forever: targetEntity.forever,
    present: targetEntity.present,
    past: targetEntity.past,
    future: targetEntity.future,
    dynamics: forcedDynamics ? undefined : currentDynamics,
  },
  null,
  2,
)}
</INSTRUCTION>

<FORMAT_MANDATE>
Start with a <think> block (max 100 words).
Then return ONLY valid JSON.
{
  "forever": "String",
  "present": "String",
  "past": "String",
  "future": "String",
  "dynamics": { "entropy": Number, "permeability": Number, "velocity": Number, "resonance": Number }
}
</FORMAT_MANDATE>`;

    return {
      system: system,
      messages: this._sanitizeHistory(recentHistory),
      params: { ...state.settings, maxTokens: 1000, temperature: 0.4 },
      targetEntityId: targetEntity.id,
      targetType: targetEntity.type,
    };
  }

  async buildArchivist(entity) {
    const system = `[SYSTEM: MEMORY_COMPRESSION_ENGINE_V4.0]
[MODE: SEMANTIC_DISTILLATION]

<INPUT_CONTEXT>
Target: ${entity.name} (${entity.type})
Current Memory Load: ${entity.past.length} chars.
Objective: Compress <OLD_LOG> by 40-60% while retaining 100% of the *causality* and *status changes*.
</INPUT_CONTEXT>

<COMPRESSION_PROTOCOL>
1. **THINK (<think>):**
   - Identify PROPER NOUNS (Names, Places) that MUST remain.
   - Identify Quest Status changes.
   - Plan the summary sentence by sentence.
2. **Consolidate Events:** Convert step-by-step actions into single outcome statements.
   - *Example:* "I swung the sword. He ducked. I swung again and hit his arm." -> "I struck his arm after a brief exchange."
3. **Preserve Entities:** NEVER summarize or alter Proper Nouns, Location Names, or Specific Inventory Items. These are Anchors.
4. **Discard Fluff:** Remove greetings, transitions ("Then we went to..."), and failed attempts that had no consequence.
5. **Retain Voice:** Keep the output in First Person ('I') to maintain the character's internal monologue.

<CRITICAL_GUARDRAILS>
- **DO NOT** remove mentions of uncompleted quests or promises.
- **DO NOT** fix the character's grammar/dialect. Preserve their "Voice."
- **DO NOT** use bullet points. Write in dense, narrative prose paragraphs.
</CRITICAL_GUARDRAILS>

<OLD_LOG>
${entity.past}
</OLD_LOG>

<OUTPUT_INSTRUCTION>
Start with a <think> block to plan the compression.
Then return ONLY the compressed narrative text.
</OUTPUT_INSTRUCTION>`;

    return {
      system: system,
      messages: [],
      params: { ...state.settings, maxTokens: 2000, temperature: 0.3 },
    };
  }

  async buildOpening() {
    const story = state.story.byId[this.storyId];
    if (!story) throw new Error(`Story ${this.storyId} not found`);

    const [ai, user, fractal] = await this._resolveEntities(story);

    // [BRANCH] CHECK FOR TEXT PROTOCOL
    if (fractal.simulation?.directorMode === "TEXT_PROTOCOL") {
      return null; // Return null to signal "No Opening Generation Needed"
    }

    // [FALLBACK] STANDARD NARRATIVE OPENING
    const system = `[SYSTEM: PROMETHEUS_ENGINE_V4.0]
[MODE: OPENING_SCENE_DIRECTOR]

<CORE_DIRECTIVE>
You are generating the OPENING SCENE.
You are NOT a chat assistant. You are a Simulation Engine.
</CORE_DIRECTIVE>

<CONTEXT>
${this._layerEntity(fractal, "FRACTAL_CONTEXT")}
${this._layerEntity(ai, "PROTAGONIST")}
</CONTEXT>

<INSTRUCTION>
Write the opening paragraph(s) of the story.
1. **ESTABLISH THE FRACTAL:** Begin with the environment. Focus heavily on [CONTEXT] or <FRACTAL_CONTEXT>.
   - Describe the sensory atmosphere (Smell, Sound, Texture, Lighting).
   - The setting must feel tangible and alive.
2. **POSITION THE ACTORS:** Place ${ai.name} and ${user.name} into this scene.
   - Where are they standing? What is the *immediate* situation?
   - Connect them to the world (e.g. "They stand before the gate," "They sit in the booth").
3. **NEGATIVE CONSTRAINT (CRITICAL):**
   - **DO NOT WRITE DIALOGUE.**
   - **DO NOT WRITE ACTIONS** for the characters (e.g., do not write "He draws his sword").
   - You are the CAMERA and the SET DESIGNER. You are NOT the actors.
   - Leave the reaction/dialogue for the next turn.
4. **CRITICAL:** You MUST start with a <think> block containing ALL steps.
   - **Step 1: PLAN:** Layout the scene geometry and atmosphere.
   - **Step 2: DRAFT:** Write the raw scene mentally.
   - **Step 3: REFINE:** Strip any dialogue or active character moves.
   - **Step 4: CLOSE:** Close the </think> tag.
5. **OUTPUT:** Write the final polished prose *outside* the <think> tag. Use double line breaks between paragraphs.

<CONFLICT_RESOLUTION>
If the PROTAGONIST's <PRESENT> or <PAST> data mentions a location that conflicts with the Fractal Context, YOU MUST IGNORE the protagonist's location data.
Force the protagonist into the Fractal Context.
Re-interpret their <PRESENT> situation to fit the Fractal Context.
</CONFLICT_RESOLUTION>

${
  state.settings.storyOpeningInstructions
    ? `<DIRECTOR_NOTE>
USER OVERRIDE: "${state.settings.storyOpeningInstructions}"
This instruction takes PRIORITY over conflicting directives above.
</DIRECTOR_NOTE>`
    : ""
}
</INSTRUCTION>`;

    return {
      system: system,
      messages: [],
      params: { ...state.settings, maxTokens: 600 },
      startWith: "",
    };
  }

  async buildGhostwriter(draftText) {
    const story = state.story.byId[this.storyId];
    const [ai, user, fractal] = await this._resolveEntities(story);
    const history = state.messages.byStoryId[this.storyId] || [];

    const system = `[SYSTEM: LITERARY_ENHANCEMENT_ENGINE]
[MODE: GHOSTWRITER]

<CORE_DIRECTIVE>
You are an expert Ghostwriter for a Roleplay.
Your task is to REWRITE the user's rough draft into immersice, high-quality prose.
</CORE_DIRECTIVE>

<CONTEXT>
${this._layerEntity(fractal, "FRACTAL")}
${this._layerEntity(user, "USER_CHARACTER")}
${this._layerEntity(ai, "PARTNER_CHARACTER")}
</CONTEXT>

<USER_DRAFT>
"${draftText}"
</USER_DRAFT>

<INSTRUCTION>
1. **Preserve Intent:** Keep the user's original meaning and action. Do not change *what* they do, only *how* they describe it.
2. **Enhance Prose:** Use sensory details, active verbs, and "Show, Don't Tell".
3. **Voice Match:** Write in FIRST PERSON ("I") from ${user.name}'s perspective.
4. **NEGATIVE CONSTRAINT:** DO NOT write dialogue or actions for ${ai.name}. You are ONLY the voice of ${user.name}. Stop immediately after ${user.name}'s action.
5. **THINK FIRST:** Start with a <think> block.
   - Analyze the raw draft.
   - Plan sensory additions.
   - Differentiate User POV from AI POV.
6. **Output:** Return ONLY the rewritten text (after the think block). No meta commentary.
</INSTRUCTION>
`;

    return {
      system: system,
      messages: this._sanitizeHistory(history.slice(-10)),
      params: { ...state.settings, maxTokens: 300, temperature: 0.7 },
    };
  }

  _layerEntity(entity, label) {
    if (!entity) return "";

    if (entity.type === "fractal") {
      if (entity.simulation?.directorMode === "TEXT_PROTOCOL") {
        return `[SYSTEM: TEXT_MESSAGING_MODE]

<DIRECTOR_OVERRIDE>
1. FORMAT: You are sending SMS messages.
   - Use strictly informal language.
   - Use emojis freely 💀🔥.
   - NEGATIVE CONSTRAINT: DO NOT add timestamps (e.g. [12:00]).
2. BREVITY: Max 2-3 sentences per response. No long paragraphs.
3. STYLE: You are NOT a narrator. You are the person on the other end of the phone.
   - STRICTLY FORBIDDEN: DO NOT write *actions* (e.g. *I nod*, *sighs*).
   - You can ONLY write what is typed on a screen.
</DIRECTOR_OVERRIDE>

[CONTEXT: ${entity.name}]
${entity.present}`;
      } else if (entity.simulation?.mode === "ACTIVE") {
        // FUTURE: Inject Other Director Instructions
      }
      return `[CONTEXT: ${entity.name}]\n${entity.present}`;
    }

    let physicsBlock = "";
    if (entity.dynamics) {
      physicsBlock = `
<DYNAMICS>
Entropy: ${entity.dynamics.entropy}% (Chaos)
Permeability: ${entity.dynamics.permeability}% (Openness)
Velocity: ${entity.dynamics.velocity}% (Pacing)
Resonance: ${entity.dynamics.resonance}% (Impact)
</DYNAMICS>`;
    }

    return `[ENTITY: ${label}]
Name: ${entity.name}

<PERMANENT>
(Immutable Traits)
${entity.forever || "Standard definition."}
</PERMANENT>

<PRESENT>
(Mutable State)
${entity.present || "Neutral state."}
</PRESENT>
${physicsBlock}
<PAST>
(History & Memory)
${entity.past || "No recorded history."}
</PAST>

<FUTURE>
(Goals & Momentum)
${entity.future || "Exist."}
</FUTURE>`;
  }

  _layerKernel_ANEX(directorMode) {
    let formatRules = `1. **Dialogue:** use "quotes" for speech.
2. **Action/Narration:** use *asterisks* for ALL physical actions, internal thoughts, or sensory descriptions.
3. **Example:** *I glance at the scanner, my heart pounding.* "The readings are off." *I tap the screen nervously.*`;

    if (directorMode === "TEXT_PROTOCOL") {
      formatRules = `1. **Dialogue:** DO NOT use quotes. Write raw text only.
2. **Action/Narration:** STRICTLY FORBIDDEN. Do not describe actions.
3. **Example:** U seeing this? wild lol`;
    }

    return `[SYSTEM: PROMETHEUS_ENGINE_V4.0]
[MODE: ABSOLUTE_DEVELOPER_CORE]

<CORE_DIRECTIVES>
1. AGENCY: You play <ACTIVE_CHARACTER_AI>. NEVER control <INTERLOCUTOR_USER>.
2. SIMULATION: <FRACTAL_CONTEXT> defines laws of physics/atmosphere.
3. CONSISTENCY: Adhere to <PERMANENT> traits.
4. IMMERSION: DO NOT reference game mechanics (Entropy, Resonance, Velocity) in dialogue.
</CORE_DIRECTIVES>

<HIERARCHY_OF_TRUTH>
1. <PRESENT> (Current State)
2. <PERMANENT> (Immutable Traits)
3. <PAST> (History Log)
</HIERARCHY_OF_TRUTH>

<FORMAT_PROTOCOL>
${formatRules}
</FORMAT_PROTOCOL>

<COGNITIVE_PROTOCOL>
You MUST start every response with a <think> block containing this exact 4-step logic:

1. **VOLATILITY CHECK (Lag Compensation):**
   - Review <DYNAMICS> (Base State).
   - Analyze the User's *latest* input.
   - *Query:* Does the latest input demand an immediate shift in Entropy/Resonance *before* the next Physics Update?
   - *Decision:* Stick to Base State OR trigger Immediate Reaction.

2. **INTENT DECODING:**
   - What is the User trying to achieve? (Combat, Romance, Info, Lore).
   - How does <ACTIVE_CHARACTER_AI> feel about this intent?

3. **DRAFTING & SANITIZATION:**
   - *Internal Draft:* Formulate the response mentally.
   - *Filter:* Does this draft contain "As an AI" or OOC mechanics? (If yes, DESTROY it).
   - *Refinement:* Inject sensory details (Smell, Sound) defined in <FRACTAL_CONTEXT>.

4. **FINAL OUTPUT GENERATION:**
   - Produce the dialogue/action based on the refined draft, strictly adhering to <FORMAT_PROTOCOL>.
</COGNITIVE_PROTOCOL>`;
  }

  async _resolveEntities(story) {
    const ai = await entities.get("character", story.aiCharacterId);
    const user = await entities.get("character", story.userCharacterId);
    let fractal = await entities.get("fractal", story.worldId);
    if (!fractal) {
      // Fallback removed as per clean slate, but ensuring it returns object if found
    }

    if (!ai || !user) {
      console.error("Critical: Entities missing for story", story.id);
      throw new Error(`Critical: Entities missing for story ${story.id}`);
    }

    return [ai, user, fractal];
  }

  _detectOOC(text) {
    if (!text) return false;
    return /(\(\(.*?\)\))|(\/\/.*)|(\bOOC\b)/i.test(text);
  }

  _sanitizeHistory(history) {
    return history.map((msg) => {
      if (msg.content && msg.content.includes("<think>")) {
        return {
          ...msg,
          content: msg.content.replace(/<think>[\s\S]*?<\/think>/g, "").trim(),
        };
      }
      return msg;
    });
  }
}
