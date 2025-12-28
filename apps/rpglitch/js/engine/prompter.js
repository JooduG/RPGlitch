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
    if (!isTextProtocol) return null;

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
ACTION: Send a selfie. Use <image_prompt target="AI">...</image_prompt>.
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
      this._resolveAtmosphere(dynamics),
      strategy.formatFractal(fractal),
      strategy.formatActive(ai),
      strategy.formatPartner(user),
      PROMPT_BLOCKS.LORE_STUB,
    ];

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

  async buildUpdater(targetType, forcedDynamics = null) {
    const story = state.story.byId[this.storyId];
    const [ai, user, fractal] = await this._resolveEntities(story);
    const history = state.messages.byStoryId[this.storyId] || [];
    const recentHistory = history.slice(-6);

    let targetEntity;
    let roleInstruction;

    if (targetType === "ai_character") {
      targetEntity = ai;
      roleInstruction = `ROLE: Subconscious Manager of ${ai.name}. Govern stress and emotional state.`;
    } else if (targetType === "user_character") {
      targetEntity = user;
      roleInstruction = `ROLE: Profiling Engine for ${user.name}. Update their 'Present State'.`;
    } else {
      targetEntity = fractal;
      roleInstruction = `ROLE: World Sim. Track environmental decay and entropy.`;
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
1. **Think:** Explain why values are changing based on recent dialogue.
2. **Update:** Return the new JSON.
</INSTRUCTION>

<CURRENT_STATE>
${JSON.stringify(
  {
    forever_context: formatSection(targetEntity.forever),
    present_context: formatSection(targetEntity.present),
    dynamics: forcedDynamics || currentDynamics,
  },
  null,
  2,
)}
</CURRENT_STATE>

<OUTPUT_FORMAT>
Return the stats in this block:
\`\`\`
// [STATUS_HUD]
// Entropy: (New Value)
// Velocity: (New Value)
// Permeability: (New Value)
// Resonance: (New Value)
// [/STATUS_HUD]
\`\`\`

{
  "status": "Updated state description.",
  "dynamics": { "entropy": Number, "permeability": Number, "velocity": Number, "resonance": Number },
  "present": { "physical": "New physical description", "mental": "New mental/emotional state" }
}
</OUTPUT_FORMAT>`;

    return {
      system,
      messages: this._sanitizeHistory(recentHistory),
      params: { ...state.settings, maxTokens: 800, temperature: 0.2 },
      targetEntityId: targetEntity.id,
      targetType: targetEntity.type,
    };
  }

  async buildVisualizer(targetType) {
    const story = state.story.byId[this.storyId];
    const [ai, user, fractal] = await this._resolveEntities(story);
    const strategy = this._resolveStrategy(fractal);
    const subject = targetType === "user" ? user : ai;

    const system = `[SYSTEM: VISUAL_DIRECTOR_V9]
[MODE: FRAMING_AND_OCCLUSION]

<CORE_DIRECTIVE>
Virtual Photographer: Construct prompt by combining ANCHOR + OUTFIT + SCENE CONTEXT.
</CORE_DIRECTIVE>

<INPUT_DATA>
**Visual Anchor:** ${subject.forever?.physical || subject.appearance}
**Mutable Visuals:** ${subject.present?.physical || subject.outfit}
**Context:** <RAW_INTENT>
</INPUT_DATA>

${strategy.formatActive(subject, "VISUAL_SUBJECT", { includeUrge: false })}
${strategy.formatFractal(fractal, "SCENE_ENVIRONMENT")}

<STEP_2_OCCLUSION_LOGIC>
CRITICAL: Exclude non-visible traits using a <think> block.
Portrait: Eye makeup/tattoos. No shoes/pants.
Full Body: Keep all.
</STEP_2_OCCLUSION_LOGIC>

<OUTPUT_FORMAT>
Return ONLY the final prompt string (No Markdown).
Structure: [Framing], [Anchor Traits], [Outfit], [Action/Pose], [Environment], [Lighting], [Vibe Tags]
</OUTPUT_FORMAT>`;

    return {
      system,
      messages: [],
      params: { ...state.settings, maxTokens: 500, temperature: 0.6 },
      instruction:
        targetType === "scene"
          ? "Generate a snapshot of the location."
          : `Generate a photorealistic image prompt for ${subject.name}.`,
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
REWRITE the draft immersive prose (1st Person POV from ${user.name}).
</GHOSTWRITER_DIRECTIVE>

<USER_DRAFT>
"${draftText}"
</USER_DRAFT>`;

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

  async buildConclusion() {
    const story = state.story.byId[this.storyId];
    if (!story) throw new Error(`Story ${this.storyId} not found`);

    const [ai, user, fractal] = await this._resolveEntities(story);
    const history = state.messages.byStoryId[this.storyId] || [];
    const strategy = this._resolveStrategy(fractal);

    const system = strategy.getFractalKernel("CONCLUSION", fractal, ai, user);

    return system
      ? {
          system,
          messages: this._sanitizeHistory(history),
          params: { ...state.settings, maxTokens: 600 },
          fractal,
          ai,
          user,
        }
      : null;
  }
}
