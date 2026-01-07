import { state } from "../core/state.js";
import { entities } from "../data/repo.js";
import { ROLES } from "../core/constants.js";
import { Strategies } from "./strategies.js";

export class ContextBuilder {
  constructor(storyId) {
    this.storyId = storyId;
    // Handle null storyId for non-story generation tasks (Profile Gen)
    this.story = storyId ? state.story.byId[storyId] : null;
  }

  async _getEntities() {
    // 1. Try DB Fetch
    let ai = await entities.get("character", this.story?.aiId);
    let user = await entities.get("character", this.story?.userId);
    let fractal = await entities.get(ROLES.FRACTAL, this.story?.fractalId);

    // 2. Try Snapshot Fallback
    const snapshot = this.story?.snapshots?.start || {};

    // 3. Robust Fallbacks (Prevents "Character: undefined" in prompt)
    if (!ai)
      ai = snapshot.ai || {
        name: "The AI",
        description: "An interactive character.",
      };
    if (!user)
      user = snapshot.user || {
        name: "The User",
        description: "The protagonist.",
      };
    if (!fractal)
      fractal = snapshot.fractal || {
        name: "The System",
        description: "The world engine.",
      };

    return { ai, user, fractal };
  }

  async build(userText = "", options = {}) {
    const { ai, user, fractal } = await this._getEntities();
    const msgs = state.messages.byStoryId[this.storyId] || [];

    let system = Strategies.standard(
      ai,
      user,
      fractal,
      options.varianceInstruction,
    );

    const messages = msgs.map((m) => ({
      role: m.role,
      content: m.text,
    }));

    return {
      system,
      messages,
      userText,
    };
  }

  async buildPrologue() {
    const { fractal } = await this._getEntities();
    const context = this.story?.summary || "A new encounter.";
    const system = Strategies.prologue(fractal, context);
    return { system, messages: [] };
  }

  async buildEpilogue() {
    const { fractal } = await this._getEntities();
    const msgs = state.messages.byStoryId[this.storyId] || [];
    const system = Strategies.epilogue(fractal);

    // Include recent context
    const contextMsgs = msgs
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.text }));
    return { system, messages: contextMsgs };
  }

  async buildPulse(ai, history, activeThreads) {
    const historyStr = history.map((m) => `${m.role}: ${m.text}`).join("\n");
    const safeAi = ai || { name: "AI" };
    const system = Strategies.pulse(safeAi, historyStr);
    return { system, messages: [] };
  }

  async buildGhostwriter(draft) {
    return {
      system: `[ROLE: GHOSTWRITER]\nRefine this text to be more evocative:\n"${draft}"`,
      messages: [],
    };
  }

  async buildVisualizer(targetType) {
    return {
      system: Strategies.visualizer(targetType, ""),
      messages: [],
    };
  }

  async buildProfileGenerator(characterDescription) {
    const system = Strategies.profileGenerator(characterDescription);
    return { system, messages: [] };
  }

  async buildProfileEnhancer(currentPrompt, entity, paletteColor) {
    const gender = (entity.gender || "unknown").toLowerCase();
    const identity = `${entity.name || "Unknown"} (${entity.type || "entity"})`;
    // Format color: "dark_blue" -> "Dark Blue"
    const color = (paletteColor || "default")
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const system = Strategies.profileEnhancer(currentPrompt, {
      gender,
      identity,
      color,
    });
    return { system, messages: [] };
  }

  async buildLibrarian(targetField, currentContent, contextData) {
    const system = Strategies.librarian(
      targetField,
      currentContent,
      contextData,
    );
    return { system, messages: [] };
  }
}
