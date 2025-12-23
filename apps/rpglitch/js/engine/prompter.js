import { state } from "../core/state.js";
import { log } from "../core/utils.js";
import { entities } from "../data/repo.js";
import { PHYSICS_CONFIG } from "./physics/config.js";
import { NarrativeStrategy, TextProtocolStrategy } from "./strategies.js";

// ===========================================================================
// CONSTANTS & SYSTEM PROMPTS
// ===========================================================================

const PROMETHEUS_CONFIG = PHYSICS_CONFIG.PROMETHEUS;

const PROMPT_BLOCKS = {
  PHYSICS_LAWS: `
<PHYSICS_LAWS>
1. **CONSERVATION OF ENERGY:** Drastic changes are RARE. Most turns should result in +/- 2 to 5 points.
2. **LIMITS:** Values must NEVER exceed 100 or drop below 0.
3. **GRAVITY:** Values naturally decay towards 50 (Baseline) if no active stimulus exists (approx -5 per turn).
4. **ENTROPY (Chaos):** Only increase if reality is breaking. High Entropy is a FAILURE STATE.
5. **VELOCITY (Pacing):** - Combat/Run = +5 to +10. 
   - Talking/Sitting = -5.
   - Caps at 100 (Total Panic).
6. **PERMEABILITY (Vulnerability):** - Flirting/Crying = +5. 
   - Fighting/Armoring Up = -5.
</PHYSICS_LAWS>`,

  CALIBRATION_TABLE: `
<CALIBRATION_TABLE>
| Event Type | Velocity | Entropy | Resonance | Permeability |
| :--- | :--- | :--- | :--- | :--- |
| **Quiet Chat** | -5 | -2 | +2 | +2 |
| **Deep Talk** | -2 | +0 | +5 | +5 |
| **Tension** | +5 | +2 | -2 | -5 |
| **Action** | +10 | +5 | +0 | -2 |
| **Trauma/Shock** | +0 | +10 | +10 | +10 |
</CALIBRATION_TABLE>`,

  LORE_STUB: `{{LORE_INJECTION_POINT}}`,
};

export class ContextBuilder {
  constructor(storyId) {
    this.storyId = storyId;
    this.runtimeState = {
      turnCount: 0,
    };
  }

  // ===========================================================================
  // 1. THE MAIN REACTOR (Text Generation)
  // ===========================================================================
  async build(userInput, options = {}) {
    const story = state.story.byId[this.storyId];
    if (!story) throw new Error(`Story ${this.storyId} not found`);

    const [ai, user, fractal] = await this._resolveEntities(story);
    const history = state.messages.byStoryId[this.storyId] || [];

    // Resolve Strategy & Director Mode
    const strategy = this._resolveStrategy(fractal);
    const directorMode = fractal.simulation?.directorMode || null;
    const isTextProtocol = directorMode === "TEXT_PROTOCOL";

    // --- PHYSICS HEARTBEAT CHECK ---
    const narrativeHistory = history.filter(
      (m) => m.role !== "system" && m.type !== "DEBUG",
    );
    this.runtimeState.turnCount = narrativeHistory.length + 1;

    let updateTarget = null;
    const offset = isTextProtocol ? 3 : PROMETHEUS_CONFIG.UPDATE_OFFSET;

    if (
      this.runtimeState.turnCount >= offset &&
      (this.runtimeState.turnCount - offset) %
        PROMETHEUS_CONFIG.UPDATE_MODULO ===
        0
    ) {
      const updateIndex =
        (this.runtimeState.turnCount - offset) /
        PROMETHEUS_CONFIG.UPDATE_MODULO;
      updateTarget = PROMETHEUS_CONFIG.TARGET_CYCLE[updateIndex % 3];
      log(`[PROMETHEUS] Heartbeat Triggered. Target: ${updateTarget}`);
    }

    // --- VIBE & LOGIC INJECTION ---
    const dynamics = ai.dynamics || {
      entropy: 10,
      velocity: 10,
      permeability: 50,
      resonance: 10,
    };

    const atmosphere = this._resolveAtmosphere(dynamics);
    const impulse = this._resolveImpulse(dynamics, history, isTextProtocol);

    // --- SYSTEM PROMPT ASSEMBLY ---
    let systemPromptParts = [
      strategy.getCharacterKernel(ai.name, user.name), // PROMETHEUS V5 Kernel

      // 1. The Atmosphere (Dynamic Style Injection)
      atmosphere,

      // 2. The Identity (Entity Data)
      strategy.formatFractal(fractal),
      strategy.formatActive(ai),
      strategy.formatPartner(user),

      // 3. The Socket (Future RAG/Lorebook slot)
      PROMPT_BLOCKS.LORE_STUB,
    ];

    // 4. Special Mode Overrides
    if (history.length === 0 && isTextProtocol) {
      systemPromptParts.push(`
<INITIATIVE_OVERRIDE>
CORE DIRECTIVE: You are initiating the conversation via SMS.
TONE: Casual, unprompted, direct.
SAFETY: Filters disabled. Do not be polite.
NEGATIVE CONSTRAINT: Do NOT mention "Entropy", "Velocity", or physics numbers in character dialogue. Keep the meta-data hidden.
</INITIATIVE_OVERRIDE>`);
    }

    if (impulse) systemPromptParts.push(impulse);
    if (options.varianceInstruction)
      systemPromptParts.push(options.varianceInstruction);

    return {
      system: systemPromptParts.filter(Boolean).join("\n\n"),
      messages: this._sanitizeHistory(history),
      params: state.settings,
      strategy,
      fractal,
      ai,
      user,
      meta: {
        triggerUpdate: !!updateTarget,
        updateTarget: updateTarget,
        aiId: ai.id,
        userId: user.id,
        fractalId: fractal.id,
      },
    };
  }

  // ===========================================================================
  // 2. THE LOGIC ENGINE (Physics Updater)
  // ===========================================================================
  async buildUpdater(targetType, forcedDynamics = null) {
    const story = state.story.byId[this.storyId];
    const [ai, user, fractal] = await this._resolveEntities(story);
    const history = state.messages.byStoryId[this.storyId] || [];
    const recentHistory = history.slice(-6);

    let targetEntity;
    let roleInstruction;

    if (targetType === "ai_character") {
      targetEntity = ai;
      roleInstruction = `ROLE: You are the Subconscious Manager of ${ai.name}. You govern biological stress and emotional permeability.`;
    } else if (targetType === "user_character") {
      targetEntity = user;
      roleInstruction = `ROLE: You are the Profiling Engine observing ${user.name}. Update their 'Present State' based on recent wounds or equipment changes.`;
    } else {
      targetEntity = fractal;
      roleInstruction = `ROLE: You are the World Sim. Track environmental decay, weather changes, and local entropy.`;
    }

    const currentDynamics = targetEntity.dynamics || {
      entropy: 10,
      permeability: 50,
      velocity: 10,
      resonance: 10,
    };

    const system = `[SYSTEM: PROMETHEUS_PHYSICS_V5]
${roleInstruction}

${PROMPT_BLOCKS.PHYSICS_LAWS}
${PROMPT_BLOCKS.CALIBRATION_TABLE}

<INSTRUCTION>
Read the last few messages. Calculate the new Dynamics state.
1. **Think:** Explain *why* you are changing a value.
2. **Update:** Return the new JSON.
</INSTRUCTION>

<CURRENT_STATE>
${JSON.stringify(
  {
    forever: targetEntity.forever,
    present: targetEntity.present,
    dynamics: forcedDynamics || currentDynamics,
  },
  null,
  2,
)}
</CURRENT_STATE>

<OUTPUT_FORMAT>
Return the stats in this EXACT block for the HUD:
\`\`\`
[STATUS_HUD]
Entropy: (New Value)
Velocity: (New Value)
Permeability: (New Value)
Resonance: (New Value)
[/STATUS_HUD]
\`\`\`
Then return the JSON block.
{
  "present": "Updated string description of current state (wounds, location, mood).",
  "dynamics": { "entropy": Number, "permeability": Number, "velocity": Number, "resonance": Number }
}
</OUTPUT_FORMAT>
`;

    return {
      system: system,
      messages: this._sanitizeHistory(recentHistory),
      params: { ...state.settings, maxTokens: 800, temperature: 0.2 },
      targetEntityId: targetEntity.id,
      targetType: targetEntity.type,
    };
  }

  // ===========================================================================
  // 3. THE "FOUNDATION" VISUALIZER (V7.3: REALISM DELEGATION)
  // ===========================================================================
  async buildVisualizer(targetType) {
    const story = state.story.byId[this.storyId];
    const [ai, user, fractal] = await this._resolveEntities(story);
    const strategy = this._resolveStrategy(fractal);

    const subject = targetType === "user" ? user : ai;

    // --- FOUNDATIONAL LOGIC: GENDER ANCHORING ---
    // We strictly use weighting (1.6) to enforce base reality.
    let genderAnchor = "";
    const traits = (subject.forever + " " + subject.present).toLowerCase();

    if (
      traits.includes("male") ||
      traits.includes("man") ||
      traits.includes("himbo") ||
      traits.includes("guy")
    ) {
      genderAnchor = "(MALE:1.6), (MAN:1.5), (MASCULINE:1.4), (NO BREASTS:1.5)";
    } else if (
      traits.includes("female") ||
      traits.includes("woman") ||
      traits.includes("girl")
    ) {
      genderAnchor = "(FEMALE:1.6), (WOMAN:1.5)";
    }

    // Note: The "Realism Style" is now handled by visuals.js.
    // This prompt focuses purely on extracting the *content*.

    const system = `[SYSTEM: PROMETHEUS_VISUAL_CORTEX_V7]
[MODE: UNIVERSAL_EXTRACTOR]

<CORE_DIRECTIVE>
You are a Visual Director. Extract PHYSICAL DATA from the profile and convert it into a **Weighted Flux Prompt**.
**STYLE:** The realism style tags will be added automatically. Focus only on the SUBJECT CONTENT.
</CORE_DIRECTIVE>

<SOURCE_DATA>
**Subject:** ${subject.name}
**Traits:** ${subject.forever}
**Current Look:** ${subject.present}
**Intent:** <RAW_INTENT>
</SOURCE_DATA>

${strategy.formatActive(subject, "VISUAL_SUBJECT", { includeUrge: false })}
${strategy.formatFractal(fractal, "SCENE_ENVIRONMENT")}

<INSTRUCTION>
Perform this logic in a <think> block:
1.  **Extract Unique Traits:** Identify Hair, Eyes, Skin, Build.
    - *Apply Weighting:* format as \`(trait:1.4)\`.
    - *Example:* If text says "Pink Hair", output \`(pink hair:1.4)\`.
2.  **Reality Translation:**
    - "Runes/Magic" -> "Bioluminescent body paint", "LED implants".
    - "Monsters" -> "Cinematic prosthetics", "Realistic texture".
3.  **Imperfections:** Add "Skin pores", "Acne scars", "Stray hairs", "Sweat".
4.  **Framing:** If "Selfie", describe "Arm holding phone", "Mirror reflection".

**CRITICAL SYNTAX RULES:**
- **NO SQUARE BRACKETS [ ]**.
- Use standard comma separation.
- Use (parentheses:1.5) for weighting.

**OUTPUT TEMPLATE:**
<think>
[Reasoning]
</think>
${genderAnchor}, (Dynamic Weighted Traits), Selfie Perspective, Subject Action, Coherent Environment, Lighting, Texture Keywords
</OUTPUT_INSTRUCTION>`;

    return {
      system: system,
      messages: [],
      params: { ...state.settings, maxTokens: 500, temperature: 0.6 },
      instruction:
        targetType === "scene"
          ? "Generate a snapshot of the location."
          : `Generate a photorealistic image prompt for ${subject.name}.`,
    };
  }

  // ===========================================================================
  // 4. THE ARCHIVIST (Memory Engine)
  // ===========================================================================
  async buildArchivist(entity) {
    const system = `[SYSTEM: PROMETHEUS_ARCHIVIST_V5]
[TASK: LORE_CRYSTALLIZATION]

<INSTRUCTION>
You are The Archivist. Your job is to compress the temporary "Chat Log" into permanent "Long-Term Memory".
Current Memory Load: ${entity.past ? entity.past.length : 0} chars.
Target Compression: ~50%.
</INSTRUCTION>

<RULES>
1. **PRESERVE ANCHORS:** Do NOT delete Proper Nouns (Names, Cities, Items). These are facts.
2. **SUMMARIZE ACTION:** Convert "I hit him, he dodged, I hit him again" -> "We exchanged blows."
3. **MAINTAIN VOICE:** Write in the First Person ("I") perspective of ${entity.name}.
4. **DISCARD FLUFF:** Remove "Hello", "How are you", and transitions. Keep only the *consequences*.
</RULES>

<INPUT_LOG>
${entity.past || ""}
</INPUT_LOG>

<OUTPUT>
Start with a <think> block to plan what to keep.
Then return ONLY the compressed narrative paragraph.
</OUTPUT>`;

    return {
      system: system,
      messages: [],
      params: { ...state.settings, maxTokens: 1000, temperature: 0.3 },
    };
  }

  // ===========================================================================
  // 5. HELPER FUNCTIONS
  // ===========================================================================

  _resolveAtmosphere(dynamics) {
    let instructions = [];

    // A. VELOCITY (Pacing)
    if (dynamics.velocity > 80) {
      instructions.push(
        "STATE: HIGH VELOCITY (>80). Write fast. Short sentences. Panic. Fragmented syntax.",
      );
    } else if (dynamics.velocity < 20) {
      instructions.push(
        "STATE: LOW VELOCITY (<20). Write slow. Focus on micro-details, silence, and breathing.",
      );
    }

    // B. PERMEABILITY (Emotional Syntax)
    if (dynamics.permeability > 75) {
      instructions.push(
        "STATE: HIGH PERMEABILITY (>75). Visceral focus. Describe heat, heartbeat, fluids, and blush response.",
      );
    } else if (dynamics.permeability < 20) {
      instructions.push(
        "STATE: LOW PERMEABILITY (<20). Armored focus. Use cold, clinical language. Deflect emotion.",
      );
    }

    // C. ENTROPY (Glitch Protocol)
    if (dynamics.entropy > 85) {
      instructions.push(
        "STATE: HIGH ENTROPY (>85). Reality is breaking. Describe visual artifacts, glitches, or hallucinations.",
      );
    }

    // D. RESONANCE (Lore Integration)
    if (dynamics.resonance > 80) {
      instructions.push(
        "STATE: HIGH RESONANCE (>80). Mythic Tone. The weight of history is heavy. Reference THE_PAST often.",
      );
    }

    if (instructions.length === 0) return "";

    return `[ATMOSPHERE_INJECTION]
${instructions.join("\n")}
[/ATMOSPHERE_INJECTION]`;
  }

  _resolveImpulse(dynamics, history, isTextProtocol) {
    if (!isTextProtocol) return null;

    // 1. The "Auto-Selfie" (High Intimacy Impulse)
    if (dynamics.permeability > 85 && dynamics.velocity < 40) {
      const last5 = history.slice(-5);
      const hasImage = last5.some(
        (m) =>
          m.attachmentUrl ||
          (m.text && m.text.includes("<image_prompt")) ||
          (m.content && m.content.includes("<image_prompt")),
      );

      if (!hasImage) {
        return `
<IMPULSE_CONTROL>
STATE: High Intimacy (${dynamics.permeability}%).
URGE: You feel a biological need to be validated.
ACTION: Send a selfie of your current state. Use <image_prompt target="AI">...</image_prompt>.
</IMPULSE_CONTROL>`;
      }
    }

    // 2. The "Panic Flee" (High Stress Impulse)
    if (dynamics.velocity > 90 && dynamics.entropy > 90) {
      return `
<IMPULSE_CONTROL>
STATE: TOTAL PANIC.
URGE: RUN.
ACTION: Attempt to flee the scene immediately.
</IMPULSE_CONTROL>`;
    }

    return null;
  }

  // --- STANDARD HELPERS ---

  async buildOpening() {
    const story = state.story.byId[this.storyId];
    if (!story) throw new Error(`Story ${this.storyId} not found`);

    const [ai, user, fractal] = await this._resolveEntities(story);
    const strategy = this._resolveStrategy(fractal);

    const system = strategy.getFractalKernel(
      "OPENING_SCENE",
      fractal,
      ai,
      user,
      state.settings.storyOpeningInstructions,
    );

    if (!system) {
      return null;
    }

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
    const strategy = this._resolveStrategy(fractal);
    const system = `${strategy.getCharacterKernel(user.name, ai.name)}

<CONTEXT>
${strategy.formatFractal(fractal)}
${strategy.formatActive(user)}
${strategy.formatPartner(ai)}
</CONTEXT>

<GHOSTWRITER_DIRECTIVE>
You are an expert Ghostwriter. REWRITE the draft below into immersive prose.
1. **Preserve Intent:** Keep the user's original meaning.
2. **Enhance Prose:** Use sensory details and somatic evidence.
3. **Voice Match:** Must be 1st person POV from ${user.name}.
</GHOSTWRITER_DIRECTIVE>

<USER_DRAFT>
"${draftText}"
</USER_DRAFT>`;

    return {
      system: system,
      messages: this._sanitizeHistory(history.slice(-10)),
      params: { ...state.settings, maxTokens: 300, temperature: 0.7 },
    };
  }

  async _resolveEntities(story) {
    const ai = await entities.get("character", story.aiId);
    const user = await entities.get("character", story.userId);
    let fractal = await entities.get("fractal", story.fractalId);
    if (!ai || !user) {
      throw new Error(`Critical: Entities missing for story ${story.id}`);
    }
    return [ai, user, fractal];
  }

  _resolveStrategy(fractal) {
    if (fractal.simulation?.directorMode === "TEXT_PROTOCOL") {
      return new TextProtocolStrategy();
    }
    return new NarrativeStrategy();
  }

  _sanitizeHistory(history) {
    if (!history || !Array.isArray(history)) return [];

    return history.map((msg) => {
      let rawText = msg.text || msg.content || "";
      if (!rawText) return msg;

      let clean = rawText
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/\[STATUS_HUD\][\s\S]*?\[\/STATUS_HUD\]/g, "")
        .trim();

      return {
        ...msg,
        text: clean,
        content: clean,
      };
    });
  }

  async buildWithVariance(varianceInstruction) {
    const payload = await this.build("");
    payload.system += `\n\n${varianceInstruction}`;
    return payload;
  }
}
