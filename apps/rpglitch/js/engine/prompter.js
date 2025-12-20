import { state } from "../core/state.js";
import { log } from "../core/utils.js";
import { entities } from "../data/repo.js";
import { PHYSICS_CONFIG } from "./physics/config.js";
import { NarrativeStrategy, TextProtocolStrategy } from "./strategies.js";

const PROMETHEUS_CONFIG = PHYSICS_CONFIG.PROMETHEUS;

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

    // Resolve Strategy
    const strategy = this._resolveStrategy(fractal);
    const directorMode = fractal.simulation?.directorMode || null;

    const narrativeHistory = history.filter(
      (m) => m.role !== "system" && m.type !== "DEBUG",
    );
    this.runtimeState.turnCount = narrativeHistory.length + 1;

    // Use TextProtocolStrategy check for offset logic or rely on mode string
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

      log(
        `[PROMETHEUS] Heartbeat Triggered. Count: ${this.runtimeState.turnCount}. Target: ${updateTarget}`,
      );
    }

    const systemPromptParts = [
      strategy.getSystemKernel(),
      strategy.formatEntity(fractal, "FRACTAL_CONTEXT"),
      strategy.formatEntity(user, "USER_CHARACTER"),
    ];

    // Injection for AI-First Start
    if (history.length === 0 && isTextProtocol) {
      systemPromptParts.push(`
<FIRST_MESSAGE_PROTOCOL>
You are initiating the conversation.
Write the first SMS to <USER_CHARACTER>.
Keep it short, casual, and in-character.
</FIRST_MESSAGE_PROTOCOL>`);
    }

    // --- NARCISSISM ENGINE (AUTONOMY) ---
    // 1. Calculate Score: (Permeability + Resonance) / 2
    // High Permeability = "I want to be seen."
    // High Resonance = "I need impact."
    const dynamics = ai.dynamics || { permeability: 50, resonance: 50 };
    const narcissismScore = (dynamics.permeability + dynamics.resonance) / 2;

    // 2. Spam Prevention: Check last 5 turns for existing visuals
    // We look for 'attachmentUrl' (Messenger Mode) or 'IMAGE' type (Legacy Mode)
    const recentVisuals = history
      .slice(-5)
      .filter(
        (m) =>
          m.attachmentUrl ||
          m.type === "IMAGE" ||
          (m.text && m.text.includes("<image_prompt>")),
      );

    // 3. The Trigger
    // If Score > 85 (Critical) AND No recent visuals
    if (narcissismScore > 85 && recentVisuals.length === 0) {
      log(`[PROMETHEUS] Narcissism Triggered (Score: ${narcissismScore})`);

      systemPromptParts.push(`
<IMPULSE_CONTROL>
CRITICAL PSYCHOLOGICAL STATE: Narcissism High (${narcissismScore}%).
You feel an overwhelming biological urge to be seen and validated.
**DIRECTIVE:** You MUST include a selfie or "body check" photo in your next response.
**METHOD:** Use the tag <image_prompt target="AI">A selfie of ${ai.name}...</image_prompt> inside your message.
**TONE:** Do not ask for permission. Just send it.
</IMPULSE_CONTROL>
`);
    }

    const systemPrompt = systemPromptParts.join("\n\n");
    const aiContext = strategy.formatEntity(ai, "AI_CHARACTER_IDENTITY");

    return {
      system: systemPrompt,
      messages: [
        ...this._sanitizeHistory(history),
        { role: "system", content: aiContext },
      ],
      params: state.settings,
      meta: {
        triggerUpdate: !!updateTarget,
        updateTarget: updateTarget,
        aiId: ai.id,
        userId: user.id,
        fractalId: fractal.id,
      },
    };
  }

  async buildWithVariance(varianceInstruction) {
    const payload = await this.build("");
    payload.system += `\n\n${varianceInstruction}`;
    return payload;
  }

  async buildVisualizer(targetType) {
    const story = state.story.byId[this.storyId];
    const [ai, , fractal] = await this._resolveEntities(story);
    const strategy = this._resolveStrategy(fractal);

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

${strategy.formatEntity(ai, "PRIMARY_SUBJECT")}
${strategy.formatEntity(fractal, "SETTING_CONTEXT")}

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

| Event | Entropy | Velocity | Resonance | Permeability |
| :--- | :--- | :--- | :--- | :--- |
| **Quiet** | -5 | -10 | +5 | +5 |
| **Talk** | +2 | +5 | +10 | +2 |
| **Tension**| +20 | +30 | -10 | -5 |
| **Action** | +50 | +80 | +0 | +0 |
| **Shock** | +10 | +0 | +100 | +10 |

**Coupling:**
1. **Adrenaline:** IF Velocity > 80, decrease Permeability.
2. **Fog:** IF Entropy > 80, decrease Resonance.
3. **Validation:** IF Resonance > 80, increase Permeability.
</PHYSICS_CALIBRATION>`;
    }

    const system = `[SYSTEM: PROMETHEUS_PHYSICS_V4.0]
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
    const system = `[SYSTEM: PROMETHEUS_MEMORY_V4.0]
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
    const strategy = this._resolveStrategy(fractal);

    const system = strategy.getOpeningInstruction(
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

    const system = `[SYSTEM: PROMETHEUS_GHOSTWRITER_V4.0]
[MODE: GHOSTWRITER]

<CORE_DIRECTIVE>
You are an expert Ghostwriter for a Roleplay.
Your task is to REWRITE the user's rough draft into immersive, high-quality prose.
</CORE_DIRECTIVE>

<CONTEXT>
${strategy.formatEntity(fractal, "FRACTAL")}
${strategy.formatEntity(user, "USER_CHARACTER")}
${strategy.formatEntity(ai, "AI_CHARACTER")}
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

  _resolveStrategy(fractal) {
    if (fractal.simulation?.directorMode === "TEXT_PROTOCOL") {
      return new TextProtocolStrategy();
    }
    const motifs = [
      ...(Array.isArray(fractal.tags) ? fractal.tags : []),
      ...(state.settings.motifs || []),
    ];
    return new NarrativeStrategy({
      povStyle: fractal.povStyle || "IMMERSIVE",
      motifs: motifs,
    });
  }

  async _resolveEntities(story) {
    const ai = await entities.get("character", story.aiId);
    const user = await entities.get("character", story.userId);
    let fractal = await entities.get("fractal", story.fractalId);
    if (!fractal) {
      // Fallback removed
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
