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
    }));

    // If user is currently typing (instruction), append it?
    // Actually normally 'instruction' here comes from user input if not saved yet,
    // but Director usually saves it first.
    // If instruction is passed, we append it as user message?
    // Director.js usage: `builder.build(text, options)`
    // If text is provided, push it?
    if (instruction) {
      llmMessages.push({
        role: "user",
        content: instruction,
      });
    }

    const system = Strategies.standard(
      ai,
      user,
      fractal,
      options.varianceInstruction,
    );

    return {
      system,
      messages: llmMessages,
    };
  }

  /**
   * Builds the Prologue prompt.
   */
  async buildPrologue() {
    if (!this.story) throw new Error("No active story");
    const fractal = await entities.get(ROLES.FRACTAL, this.story.fractalId);
    if (!fractal) return null;

    // Prologue uses a summary or initial context?
    // Strategies.prologue takes (fractal, context)
    // We can pass the story title or premise if available?
    // For now, pass empty context or story title.
    const context = this.story.storyTitle || "A new journey begins.";

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
  async buildPulse(aiEntity, historyMessages, activeThreads) {
    // Convert history messages array to string block
    const historyText = historyMessages
      .map((m) => `[${m.role}]: ${m.text}`)
      .join("\n");

    const system = Strategies.pulse(aiEntity, historyText, activeThreads);
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
    const system = Strategies.visualizer(targetType, "");
    return { system, messages: [] };
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
}
