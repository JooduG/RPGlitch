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
    const ai = await entities.get(ROLES.AI, this.story.aiId);
    const user = await entities.get(ROLES.USER, this.story.userId);

    // Fetch History (Last 30 turns for deep context, matching Archivist)
    const rawMessages = state.messages.byStoryId[this.storyId] || [];
    const history = rawMessages
      .slice(-30)
      .map((m) => {
        const name = m.characterName || (m.role === ROLES.USER ? "User" : "AI");
        return `[${name}]: ${m.text}`;
      })
      .join("\n");

    const system = Strategies.epilogue(fractal, { ai, user, history });
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
   * Builds a Maestro (Visualizer) prompt.
   */
  async buildMaestroPrompt(targetType) {
    // Fetch all context entities for physical grounding
    const [ai, user, fractal] = await Promise.all([
      entities.get("character", this.story.aiId),
      entities.get("character", this.story.userId),
      entities.get(ROLES.FRACTAL, this.story.fractalId),
    ]);

    // Fetch History (Last 5 turns for immediate context)
    const rawMessages = state.messages.byStoryId[this.storyId] || [];
    const history = rawMessages
      .slice(-5)
      .map((m) => {
        const name = m.characterName || (m.role === ROLES.USER ? "User" : "AI");
        return `[${name}]: ${m.text}`;
      })
      .join("\n");

    const context = { ai, user, fractal, history };
    const maestroInstructions = Strategies.maestro(targetType, null, context);

    return {
      system: maestroInstructions,
      messages: [],
      stopSequences: ["\n", "User:", "Character:"], // Tighten visual stops
    };
  }

  buildMaestroExtract(description) {
    const system = Strategies.maestro("ai", description, {
      mode: "extract",
    });
    return { system, messages: [] };
  }

  async buildMaestroEnhance(prompt, entity, color) {
    // Determine target type for context scoping
    const targetType = entity.type === "fractal" ? "scene" : "ai";
    const context = {
      mode: "enhance",
      ai: entity.type !== "fractal" ? entity : null,
      fractal: entity.type === "fractal" ? entity : null,
    };

    const system = Strategies.maestro(targetType, prompt, context);
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
