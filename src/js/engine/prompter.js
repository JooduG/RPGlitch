import { state } from "../core/state.js";
import { entities } from "../data/repo.js";
import { ROLES } from "../core/constants.js";
import { Strategies } from "./strategies.js";

export class ContextBuilder {
  constructor(storyId) {
    this.storyId = storyId;
    this.story = state.story.byId[storyId];
  }

  async _getEntities() {
    const [ai, user, fractal] = await Promise.all([
      entities.get("character", this.story.aiId),
      entities.get("character", this.story.userId),
      entities.get(ROLES.FRACTAL, this.story.fractalId),
    ]);
    return { ai, user, fractal };
  }

  async build(userText = "", options = {}) {
    this.story = state.story.byId[this.storyId];
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
      params: state.settings, // Ensure params are returned
    };
  }

  async buildPrologue() {
    this.story = state.story.byId[this.storyId];
    const { fractal } = await this._getEntities();
    const context = this.story.summary || "A new encounter.";

    const system = Strategies.prologue(fractal, context);

    return {
      system,
      messages: [],
      params: { ...state.settings, maxTokens: 600 },
    };
  }

  async buildEpilogue() {
    this.story = state.story.byId[this.storyId];
    const { fractal } = await this._getEntities();
    const msgs = state.messages.byStoryId[this.storyId] || [];

    const system = Strategies.epilogue(fractal);

    const contextMsgs = msgs
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.text }));

    return {
      system,
      messages: contextMsgs,
      params: { ...state.settings, maxTokens: 600 },
    };
  }

  async buildPulse(ai, history, activeThreads) {
    const historyStr = history.map((m) => `${m.role}: ${m.text}`).join("\n");
    const system = Strategies.pulse(ai, historyStr, activeThreads);
    return {
      system,
      messages: [],
      params: {
        ...state.settings,
        maxTokens: 500,
        response_format: { type: "json_object" },
      },
    };
  }

  async buildArchivist(entity) {
    const system = Strategies.archivist(entity);
    return {
      system,
      messages: [],
      params: { ...state.settings, maxTokens: 1000, temperature: 0.3 },
    };
  }

  async buildGhostwriter(draft) {
    return {
      system: `[ROLE: GHOSTWRITER]\nRefine this text to be more evocative:\n"${draft}"`,
      messages: [],
      params: { ...state.settings, maxTokens: 300, temperature: 0.7 },
    };
  }

  async buildVisualizer(targetType) {
    return {
      system: `[MODULE: VISUALIZER]\nGenerate a stable diffusion prompt for a ${targetType}.`,
      messages: [],
      params: { ...state.settings, maxTokens: 300, temperature: 0.7 },
    };
  }
}
