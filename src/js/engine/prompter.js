import { state } from "../core/state.js";
import { entities } from "../data/repo.js";
import { ROLES } from "../core/constants.js";
import { Strategies } from "./strategies.js";

// --- CONTEXT BUILDER ---

export class ContextBuilder {
  constructor(storyId) {
    this.storyId = storyId;
    this.story = storyId ? state.story.byId[storyId] : null;
  }

  /**
   * Builds the standard roleplay prompt.
   * Fetches AI, User, Fractal entities + Message History.
   */
  async build(instruction, options = {}) {
    if (!this.story) throw new Error("No active story for ContextBuilder");

    const [ai, user, fractal] = await Promise.all([
      entities.get("character", this.story.aiId),
      entities.get("character", this.story.userId),
      entities.get(ROLES.FRACTAL, this.story.fractalId),
    ]);

    const messages = state.messages.byStoryId[this.storyId] || [];

    // Map to LLM format
    const llmMessages = messages.map((m) => ({
      role: m.role === ROLES.USER ? "user" : "model",
      content: m.text,
      characterName:
        m.characterName || (m.role === ROLES.AI ? ai.name : user.name),
    }));

    if (instruction) {
      llmMessages.push({
        role: "user",
        content: instruction,
      });
    }

    // [VISUAL_LOGIC] Determine if visuals are authorized for this turn
    // 1. Explicit keywords from User
    const userRequestedVisual =
      instruction &&
      /pic|show|photo|image|visual|look at|see|camera|screenshot/i.test(
        instruction,
      );

    // 2. Random Chance (15% default normalized frequency)
    const randomChance = Math.random() < 0.15;

    // 3. Force Authorization (e.g. from buttons or specific flags)
    const forceVisuals = options.forceVisuals === true;

    const visualsAuthorized =
      userRequestedVisual || randomChance || forceVisuals;

    const system = Strategies.standard(
      ai,
      user,
      fractal,
      options.varianceInstruction,
      visualsAuthorized,
    );

    const userName = user?.name || "User";

    return {
      system,
      messages: llmMessages,
      stopSequences: [`\n${userName}:`, "\nUser:", "\nCharacter:"],
    };
  }

  /**
   * Builds the Prologue prompt.
   */
  async buildPrologue() {
    if (!this.story) throw new Error("No active story");

    const [ai, user, fractal] = await Promise.all([
      entities.get("character", this.story.aiId),
      entities.get("character", this.story.userId),
      entities.get(ROLES.FRACTAL, this.story.fractalId),
    ]);

    if (!fractal) return null;

    // [SECURITY] Description field is 🔒 User Eyes Only.
    // We strip it before sending to the AI to prevent meta-leakage or prompt injection.
    const cleanEntity = (e) => {
      if (!e) return null;
      const { description, ...clean } = e;
      return clean;
    };

    const context = {
      title: this.story.storyTitle || "A new journey begins.",
      ai: cleanEntity(ai),
      user: cleanEntity(user),
    };

    const system = Strategies.prologue(fractal, context);
    return { system, messages: [] };
  }

  /**
   * Builds the Epilogue prompt.
   */
  async buildEpilogue() {
    if (!this.story) throw new Error("No active story");
    const fractal = await entities.get(ROLES.FRACTAL, this.story.fractalId);
    const system = Strategies.epilogue(fractal);
    return { system, messages: [] };
  }

  /**
   * Builds the Pulse (Heartbeat) prompt.
   */
  async buildPulse(targetEntity, others, historyMessages, activeThreads) {
    // Convert history messages array to string block
    const historyText = historyMessages
      .map((m) => {
        const label =
          m.characterName || (m.role === "user" ? "User" : "Character");
        const text = m.content || m.text || "";
        return `[${label}]: ${text}`;
      })
      .join("\n");

    const system = Strategies.pulse(
      targetEntity,
      others,
      historyText,
      activeThreads,
    );
    return { system, messages: [] };
  }

  /**
   * Builds a Visualizer prompt.
   */
  async buildVisualizer(targetType) {
    // Visualizer needs the last few messages to understand context?
    // Strategies.visualizer takes (targetType, rawIntent)
    // Here we are likely just returning the system prompt wrapper.
    // The "rawIntent" is usually appended by the Director.
    // Fetch all context entities for physical grounding
    const [ai, user, fractal] = await Promise.all([
      entities.get("character", this.story.aiId),
      entities.get("character", this.story.userId),
      entities.get(ROLES.FRACTAL, this.story.fractalId),
    ]);

    const context = { ai, user, fractal };
    const visualCortexInstructions = Strategies.visualizer(
      targetType,
      null,
      context,
    );

    return {
      system: visualCortexInstructions,
      messages: [],
      stopSequences: ["\n", "User:", "Character:"], // Tighten visual stops
    };
  }

  /**
   * Builds Profile Generation prompts.
   */
  buildProfileGenerator(description) {
    const system = Strategies.profileGenerator(description);
    return { system, messages: [] };
  }

  async buildProfileEnhancer(prompt, entity, color) {
    const system = Strategies.profileEnhancer(prompt, {
      gender: (entity.gender || "unknown").toLowerCase(),
      identity: `${entity.name || "Unknown"} (${entity.type || "entity"})`,
      color,
    });
    return { system, messages: [] };
  }

  buildLibrarian(field, content, context) {
    const system = Strategies.librarian(field, content, context);
    return { system, messages: [] };
  }

  /**
   * Builds the Archivist (Memory) prompt.
   */
  async buildArchivist(targetEntity, historyMessages, role) {
    const historyText = historyMessages
      .map((m) => {
        const label =
          m.characterName || (m.role === "user" ? "User" : "Character");
        const text = m.content || m.text || "";
        return `[${label}]: ${text}`;
      })
      .join("\n");

    const system = Strategies.archivist(targetEntity, historyText, role);
    return { system, messages: [] };
  }
}
