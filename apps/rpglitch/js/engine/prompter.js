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
    // Default to 'Safe' 10/10/50/10 if missing
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
    const recentHistory = history.slice(-6); // Maintain focus on immediate local context

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
1. **Think:** Explain *why* you are changing a value. (e.g., "User pulled a gun, so Velocity +5").
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
  // 3. THE LENS (Visual Engine)
  // ===========================================================================
  async buildVisualizer(targetType) {
    const story = state.story.byId[this.storyId];
    const [ai, , fractal] = await this._resolveEntities(story);
    const strategy = this._resolveStrategy(fractal);

    // --- LENS SELECTOR (V5) ---
    const tags = (fractal.tags || []).join(" ").toLowerCase();
    let lensType = "35mm cinematic lens";
    let lighting = "natural lighting";

    if (tags.includes("cyberpunk") || tags.includes("scifi")) {
      lensType = "anamorphic lens with chromatic aberration";
      lighting = "neon rim lighting";
    } else if (tags.includes("fantasy")) {
      lensType = "85mm portrait lens";
      lighting = "soft candlelight/moonlight";
    } else if (tags.includes("horror") || tags.includes("grit")) {
      lensType = "grainy 16mm film stock";
      lighting = "harsh flashlight beam";
    }

    const mode = targetType === "character" ? "PORTRAIT" : "SCENE";
    const subject = targetType === "character" ? ai : fractal;

    const system = `[SYSTEM: PROMETHEUS_VISUAL_CORTEX_V5]
[MODE: FLUX_DIRECTION]

<CORE_DIRECTIVE>
You are a Cinematographer. Translate narrative data into a "Photographic Specification" for Flux.
</CORE_DIRECTIVE>

<CONTEXT_INJECTION>
Genre: ${fractal.tags ? fractal.tags.join(", ") : "General"}
Camera Rig: ${lensType}
Lighting: ${lighting}
</CONTEXT_INJECTION>

${strategy.formatActive(subject, "VISUAL_SUBJECT", { includeUrge: false })}
${strategy.formatFractal(fractal, "SCENE_ENVIRONMENT")}

<OUTPUT_TEMPLATE>
Write ONE dense paragraph describing the image.
1. **The Shot:** Start with "${lensType}...".
2. **The Subject:** Describe the subject's appearance and *current* attire/state.
3. **The Texture:** Mention material details (sweat, rust, fabric weave, skin pores). Flux loves texture.
4. **The Atmosphere:** Describe the ${lighting} and particles (dust, rain, fog).
</OUTPUT_TEMPLATE>`;

    return {
      system: system,
      messages: [],
      params: { ...state.settings, maxTokens: 300, temperature: 0.7 },
      instruction:
        mode === "PORTRAIT"
          ? "Generate a character portrait."
          : "Generate a scene composition.",
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
    // Delegate to strategy (kept for backward compatibility, mostly used by Director now)
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
    // Kept mostly same but updated to V5 formatting
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
      // Handle both 'text' (DB) and 'content' (LLM format)
      let rawText = msg.text || msg.content || "";
      if (!rawText) return msg;

      // Strip <think> AND [STATUS_HUD] blocks from history to save tokens and prevent roleplay bleed
      let clean = rawText
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/\[STATUS_HUD\][\s\S]*?\[\/STATUS_HUD\]/g, "")
        .trim();

      // Return a new object with the cleaned text mapped to both keys for maximum compatibility
      return {
        ...msg,
        text: clean, // Keep for app consistency
        content: clean, // Keep for LLM compatibility
      };
    });
  }

  // Forwarding specific methods to strategy if needed
  async buildWithVariance(varianceInstruction) {
    const payload = await this.build("");
    payload.system += `\n\n${varianceInstruction}`;
    return payload;
  }
}
