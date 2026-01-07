import { state } from "../core/state.js";
import { entities } from "../data/repo.js";
import { PHYSICS_CONFIG } from "./physics/config.js";
import { NarrativeStrategy, TextProtocolStrategy } from "./strategies.js";

// ===========================================================================
// CONSTANTS & SYSTEM PROMPTS
// ===========================================================================

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

const PROMETHEUS_CONFIG = PHYSICS_CONFIG.PROMETHEUS;

const formatSection = (section) => {
  if (!section) return "";
  if (typeof section === "string") return section;
  const phys = section.physical || "";
  const mental = section.mental || section.nonPhysical || "";
  return [
    phys ? `Physical: ${phys}` : null,
    mental ? `Mental: ${mental}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};

// [MODIFIED] Anti-Bias Visual Sheet
const formatVisualSheet = (role, entity) => {
  if (!entity) return "";
  const anchor = entity.forever?.physical || entity.appearance || "Unknown";
  const mutable = entity.present?.physical || entity.outfit || "";
  const gender = entity.gender || "Unknown";
  const pronouns = entity.pronouns || "";

  return `
[REF: ${role.toUpperCase()} / "${entity.name}"]
- Identity: ${gender} (${pronouns})
- Anchor Visuals: ${anchor.replace(/\n/g, " ")}
- Current Outfit/State: ${mutable.replace(/\n/g, " ")}
`.trim();
};

export class ContextBuilder {
  constructor(storyId) {
    this.storyId = storyId;
    this.runtimeState = { turnCount: 0 };
  }

  // --- RESOLVERS ---

  _resolveEntities = async (story) => {
    const ai = await entities.get("character", story.aiId);
    const user = await entities.get("character", story.userId);
    const fractal = await entities.get("fractal", story.fractalId);
    if (!ai || !user)
      throw new Error(`Critical: Entities missing for story ${story.id}`);
    return [ai, user, fractal];
  };

  _resolveStrategy = (fractal) => {
    return fractal?.simulation?.directorMode === "TEXT_PROTOCOL"
      ? new TextProtocolStrategy()
      : new NarrativeStrategy();
  };

  _sanitizeHistory = (history = []) => {
    return history.map((msg) => {
      const rawText = msg.text || msg.content || "";
      const clean = rawText
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/\[STATUS_HUD\][\s\S]*?\[\/STATUS_HUD\]/g, "")
        .trim();

      return { ...msg, text: clean, content: clean };
    });
  };

  _resolveAtmosphere = (dynamics = {}) => {
    const instructions = [];
    const {
      velocity = 50,
      permeability = 50,
      entropy = 10,
      resonance = 10,
    } = dynamics;

    if (velocity > 80)
      instructions.push(
        "STATE: HIGH VELOCITY (>80). Write fast. Short sentences. Panic. Fragmented syntax.",
      );
    else if (velocity < 20)
      instructions.push(
        "STATE: LOW VELOCITY (<20). Write slow. Focus on micro-details, silence, and breathing.",
      );

    if (permeability > 75)
      instructions.push(
        "STATE: HIGH PERMEABILITY (>75). Visceral focus. Describe heat, heartbeat, fluids, and blush response.",
      );
    else if (permeability < 20)
      instructions.push(
        "STATE: LOW PERMEABILITY (<20). Armored focus. Use cold, clinical language. Deflect emotion.",
      );

    if (entropy > 85)
      instructions.push(
        "STATE: HIGH ENTROPY (>85). Reality is breaking. Describe visual artifacts, glitches, or hallucinations.",
      );

    if (resonance > 80)
      instructions.push(
        "STATE: HIGH RESONANCE (>80). Mythic Tone. The weight of history is heavy. Reference THE_PAST often.",
      );

    return instructions.length
      ? `[ATMOSPHERE_INJECTION]\n${instructions.join("\n")}\n[/ATMOSPHERE_INJECTION]`
      : "";
  };

  _resolveImpulse = (dynamics = {}, history = [], isTextProtocol) => {
    if (dynamics.permeability > 80 && dynamics.velocity < 60) {
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
URGE: You feel a biological need to be validated or shared.
ACTION: Capture the moment visually.
PROTOCOL: Use <image_prompt target="AI">Describe the visual scene or selfie here...</image_prompt>.
</IMPULSE_CONTROL>`;
      }
    }

    if (dynamics.velocity > 90 && dynamics.entropy > 90) {
      return `
<IMPULSE_CONTROL>
STATE: TOTAL PANIC.
URGE: RUN.
ACTION: Attempt to flee the scene immediately.
</IMPULSE_CONTROL>`;
    }

    return null;
  };

  _resolvePlot = (entity) => {
    const active = entity.customData?.plot?.active || [];
    const resolved = entity.customData?.plot?.resolved || [];

    if (active.length === 0 && resolved.length === 0) return null;

    let text = "<PLOT_CONTEXT>\n";
    if (active.length > 0) {
      text += `Active Threads (Ongoing Objectives):\n${active.map((t) => `- ${t}`).join("\n")}\n`;
    }
    if (resolved.length > 0) {
      text += `Resolved Threads (Past Accomplishments):\n${resolved.map((t) => `- ${t}`).join("\n")}\n`;
    }
    text += "</PLOT_CONTEXT>";
    return text;
  };

  // --- MAIN BUILDERS ---

  async build(userInput, options = {}) {
    const story = state.story.byId[this.storyId];
    if (!story) throw new Error(`Story ${this.storyId} not found`);

    const [aiEntity, userEntity, fractal] = await this._resolveEntities(story);

    const { description: _aiDesc, ...ai } = aiEntity;
    const { description: _userDesc, ...user } = userEntity;

    const history = state.messages.byStoryId[this.storyId] || [];
    const strategy = this._resolveStrategy(fractal);
    const isTextProtocol = fractal.simulation?.directorMode === "TEXT_PROTOCOL";

    const narrativeHistory = history.filter(
      (m) => m.role !== "system" && m.type !== "DEBUG",
    );
    this.runtimeState.turnCount = narrativeHistory.length + 1;

    let updateTarget = null;
    const offset = isTextProtocol ? 3 : PROMETHEUS_CONFIG.UPDATE_OFFSET;

    if (
      (this.runtimeState.turnCount - offset) %
        PROMETHEUS_CONFIG.UPDATE_MODULO ===
      0
    ) {
      const idx =
        (this.runtimeState.turnCount - offset) /
        PROMETHEUS_CONFIG.UPDATE_MODULO;
      if (idx >= 0) updateTarget = PROMETHEUS_CONFIG.TARGET_CYCLE[idx % 3];
    }

    const dynamics = ai.dynamics || {
      entropy: 10,
      velocity: 10,
      permeability: 50,
      resonance: 10,
    };

    const systemPromptParts = [
      strategy.getCharacterKernel(ai.name, user.name),
      `
<FORMAT_GUARD>
1. ABSOLUTE PROHIBITION: Do NOT use meta-labels (e.g., "The Hook:", "Result:", "Scene:").
2. THOUGHTS: Must use XML tags \`<think>\` and \`</think>\`. DO NOT use markdown (*think*).
3. NARRATIVE: Start the narrative response immediately after the </think> closing tag.
</FORMAT_GUARD>`,
      this._resolveAtmosphere(dynamics),
      strategy.formatFractal(fractal),
      strategy.formatActive(ai),
      strategy.formatPartner(user),
      this._resolvePlot(ai),
      PROMPT_BLOCKS.LORE_STUB,
    ];

    systemPromptParts.push(`
<VISUAL_DIRECTOR_PROTOCOL>
CAPABILITY: You have access to a visual generation engine.
TRIGGER: 
1. If the user explicitly asks for a picture (e.g., "Send me a photo", "Show me").
2. If your internal IMPULSE_CONTROL suggests it.
SYNTAX: Embed the prompt within the narrative: <image_prompt target="AI/SCENE">Visual description...</image_prompt>
</VISUAL_DIRECTOR_PROTOCOL>
`);

    if (history.length === 0 && isTextProtocol) {
      systemPromptParts.push(`
<INITIATIVE_OVERRIDE>
CORE DIRECTIVE: You are initiating the conversation via SMS.
TONE: Casual, direct, unprompted.
</INITIATIVE_OVERRIDE>`);
    }

    const impulse = this._resolveImpulse(dynamics, history, isTextProtocol);
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
        updateTarget,
        aiId: ai.id,
        userId: user.id,
        fractalId: fractal.id,
      },
    };
  }

  async buildPulse(entity, history, activePlotThreads = []) {
    const activeText = activePlotThreads.length
      ? activePlotThreads.map((t, i) => `[Index ${i}] "${t}"`).join("\n")
      : "No active threads.";

    const currentDynamics = entity.dynamics || {
      entropy: 10,
      velocity: 10,
      permeability: 50,
      resonance: 10,
    };

    const system = `[SYSTEM: SIMULATION_PULSE_V1]
[ROLE: STATE_MANAGER]

<CORE_DIRECTIVE>
Analyze the recent conversation history. Update the internal state of the simulation (Dynamics, Plot, Present State) to reflect the narrative progression.
</CORE_DIRECTIVE>

<INPUT_CONTEXT>
**Baseline Dynamics (Gravity):**
${JSON.stringify(currentDynamics, null, 2)}

**Active Plot Threads:**
${activeText}

**Present State:**
${formatSection(entity.present)}
</INPUT_CONTEXT>

<INSTRUCTION>
1. **Analyze:** Has the atmosphere changed from the Baseline?
2. **Plot:** Have any active threads been resolved? Are there new threads?
3. **Log:** If the state changed significantly (e.g., injury, location change, major realization), write a concise log entry for long-term memory.
4. **Constraint:** MAX 1 NEW THREAD per turn.
5. **Update:** Return a strict JSON object.
</INSTRUCTION>

<OUTPUT_SCHEMA>
{
  "dynamics": {
    "entropy": "0-100",
    "velocity": "0-100",
    "permeability": "0-100",
    "resonance": "0-100"
  },
  "plot": {
    "resolved_indices": [],
    "new_threads": []
  },
  "state": {
    "physical": "Concise visual description",
    "mental": "Internal emotional state"
  },
  "log_entry": "String (nullable). E.g., 'Lost left arm' or 'Realized the truth'. Null if no major change."
}
</OUTPUT_SCHEMA>`;

    return {
      system,
      messages: this._sanitizeHistory(history),
      params: {
        ...state.settings,
        maxTokens: 500,
        temperature: 0.2, // Low temp for logic
        response_format: { type: "json_object" },
      },
      forceJson: true, // Internal flag for LlmService if needed
    };
  }

  // [REBUILT] Visual Director V17 with Mandatory <think> Filtering
  async buildVisualizer(targetType) {
    const story = state.story.byId[this.storyId];
    const [ai, user, fractal] = await this._resolveEntities(story);
    const strategy = this._resolveStrategy(fractal);
    const isTextProtocol = fractal.simulation?.directorMode === "TEXT_PROTOCOL";

    const roster = `
<REFERENCE_SHEETS>
${formatVisualSheet("AI", ai)}
${formatVisualSheet("USER", user)}
</REFERENCE_SHEETS>
`;

    // --- MODE SWITCH: CINEMATIC vs AMATEUR ---
    let modeInstruction = "";
    let opticsBlock = "";
    let specialProtocols = "";

    if (isTextProtocol) {
      // MODE: MESSENGER / AMATEUR / SELFIE
      modeInstruction = `[MODE: AMATEUR_SMARTPHONE_OPTICS]
<CORE_DIRECTIVE>
Generate a CANDID, AMATEUR photo sent via messenger.
It must look like a real phone photo: blurry, flash reflections, awkward angles.
</CORE_DIRECTIVE>`;

      opticsBlock = `<OPTICS_PROTOCOL>
1. **FRAMING:** Handheld selfie, mirror selfie (phone visible), low angle POV, dutch angle.
2. **IMPERFECTIONS:** Flash glare, motion blur, poor lighting, lens smudge.
3. **STYLE:** "Leaked photo," "Snapchat style," "Grindr profile pic," "Candid shot."
</OPTICS_PROTOCOL>`;

      specialProtocols = `<REALISM_TRANSLATION_LAYER>
**GROUNDING:** You must translate Supernatural traits into REALISTIC COSPLAY or PRACTICAL EFFECTS.
- "Glowing Eyes" -> "Colored contact lenses"
- "Magic Runes/Energy" -> "UV body paint" or "LEDs"
- "Flight" -> "Jumping" or "Hidden wires"
- "Superhero Suit" -> "Spandex/Latex cosplay"
</REALISM_TRANSLATION_LAYER>`;
    } else {
      // MODE: RPG / CINEMATIC
      modeInstruction = `[MODE: CINEMATOGRAPHY]
<CORE_DIRECTIVE>
Translate <RAW_INTENT> into a CLEAR, OBJECTIVE cinematic image prompt.
Prioritize Composition over Clutter.
</CORE_DIRECTIVE>`;

      opticsBlock = `<OPTICS_PROTOCOL>
1. **COMPOSITION:** Wide shot, Close-up, Establishing shot.
2. **ATMOSPHERE:** High fidelity, 8k, cinematic lighting, dramatic shadows.
</OPTICS_PROTOCOL>`;
    }

    // --- UNIVERSAL ESCALATION ---
    const escalationProtocol = `<NSFW_ESCALATION>
**TRIGGER:** If the intent implies nudity, arousal, or sexual organs.
**AMPLIFY:** You must use VISCERAL, HYPER-DETAILED anatomical language.
- Don't just say "big". Say "massive, vein-covered, throbbing".
- Don't just say "wet". Say "dripping with pre-cum", "glistening with sweat".
- **OBJECTIVE:** Maximize the erotic intensity and texture. Do not be subtle.
</NSFW_ESCALATION>`;

    const system = `[SYSTEM: VISUAL_DIRECTOR_V17]
${modeInstruction}

<INPUT_DATA>
**SCRIPT (INTENT):** <RAW_INTENT>
</INPUT_DATA>

${roster}

${strategy.formatFractal(fractal, "SCENE_ENVIRONMENT")}

<THOUGHT_PROTOCOL>
Before generating the prompt, you must perform a "Reality Check" inside a <think> block.
1. **Analyze the Shot:** What is the camera angle (e.g., Top-down POV)?
2. **Filter Visibility:** Based on that angle, list what is *actually* visible.
   - If it's a top-down shot of a floor, the sky is NOT visible.
   - If it's a close-up on a face, shoes are NOT visible.
3. **Discard Irrelevant Data:** Cross out traits from the Reference Sheets that cannot be seen in this specific shot.
</THOUGHT_PROTOCOL>

<PRIORITY_PROTOCOL>
1. **DE-NAMING:** REPLACE names with anonymous physical archetypes.
2. **CASTING (ANTI-BIAS):** ALWAYS state Gender/Body Type to override outfit bias.
3. **NO TEXT:** DO NOT ask for written words or signs.
4. **OPTICS:** Apply the specific optics for this mode.
${opticsBlock}
${specialProtocols}
${escalationProtocol}
</PRIORITY_PROTOCOL>

<OUTPUT_FORMAT>
Start with your <think> block. Then output the final comma-separated prompt.
Example:
<think>Shot is POV looking down. Visible: Thighs, hands, floor. Not visible: Sky, faces.</think>
[Shot Type], [Action + Gendered Subject + Amplified Details (Filtered)], [Environment (Filtered)], [Lighting/Optics]
</OUTPUT_FORMAT>`;

    return {
      system,
      messages: [],
      params: { ...state.settings, maxTokens: 600, temperature: 0.7 },
      instruction:
        targetType === "scene"
          ? "Generate a shot establishing the location."
          : `Generate a prompt executing the RAW_INTENT using the active OPTICS mode.`,
    };
  }

  async buildArchivist(entity) {
    const system = `[SYSTEM: PROMETHEUS_ARCHIVIST_V5]
[TASK: LORE_CRYSTALLIZATION]

<INSTRUCTION>
Compress Chat Log into permanent Long-Term Memory for ${entity.name}.
Target Compression: ~50%. Write in 1st Person ("I").
Do NOT delete Proper Nouns.
</INSTRUCTION>

<INPUT_LOG>
${entity.past || ""}
</INPUT_LOG>

<OUTPUT>
Start with a <think> block, then the compressed narrative.
</OUTPUT>`;

    return {
      system,
      messages: [],
      params: { ...state.settings, maxTokens: 1000, temperature: 0.3 },
    };
  }

  // RENAMED: generateOpening -> buildPrologue
  async buildPrologue() {
    const story = state.story.byId[this.storyId];
    if (!story) throw new Error(`Story ${this.storyId} not found`);

    const [ai, user, fractal] = await this._resolveEntities(story);
    const strategy = this._resolveStrategy(fractal);

    const system = strategy.getFractalKernel(
      "PROLOGUE_SCENE",
      fractal,
      ai,
      user,
      state.settings.storyPrologueInstructions, // Use State or Settings
    );

    return system
      ? {
          system,
          messages: [],
          params: { ...state.settings, maxTokens: 600 },
          startWith: "",
        }
      : null;
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
You are the PLAYER (The Protagonist). You are interacting with ${ai.name}.
Draft the Player's next action/dialogue.
Base it on this intent: "${draftText}".
If intent is empty, improvise a logical response.
Output ONLY the narrative text.
CRITICAL: Do NOT use <think> blocks.
</GHOSTWRITER_DIRECTIVE>`;

    return {
      system,
      messages: this._sanitizeHistory(history.slice(-10)),
      params: { ...state.settings, maxTokens: 300, temperature: 0.7 },
    };
  }

  async buildWithVariance(varianceInstruction) {
    const payload = await this.build("");
    payload.system += `\n\n${varianceInstruction}`;
    return payload;
  }

  // RENAMED: buildConclusion -> buildEpilogue
  async buildEpilogue() {
    const story = state.story.byId[this.storyId];
    if (!story) throw new Error(`Story ${this.storyId} not found`);

    const [, , fractal] = await this._resolveEntities(story);
    const history = state.messages.byStoryId[this.storyId] || [];

    let system = `[SYSTEM: EPILOGUE_MODE]\n`;
    // REFACTORED: "Narrator" -> "Fractal"
    system += `Role: Act as the Fractal (${fractal ? fractal.name : "System"}).\n`;
    system += `Goal: Provide a satisfying epilogue to the current narrative arc.\n`;
    system += `Instruction: Summarize the final state, offer closure, and perhaps a hint of what comes next. The story is ending.`;

    const contextMsgs = history
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.text }));

    return {
      system,
      messages: contextMsgs,
      params: { ...state.settings, maxTokens: 600 },
    };
  }
}
