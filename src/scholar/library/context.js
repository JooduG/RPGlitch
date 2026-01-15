/**
 * src/js/scholar/context.js
 * THE CONTEXT BUILDER (Tactical Prompt Engineering)
 * Assembles the raw state of the world into structured prompts for the AI.
 */

import { state } from "../../gamemaster/bus.js";
import { entities } from "../database/repository.js";
import { ROLES } from "../../gamemaster/config.js";
import { Screenplay } from "../../gamemaster/screenplay.js";
import { Warden } from "../../warden/index.js";
import { Mesmer } from "../../mesmer/index.js";
import { templateConsult, templateEcho } from "./prose.js";

export class ContextBuilder {
  constructor(storyId) {
    this.storyId = storyId;
    this.story = storyId ? state.story.byId[storyId] : null;
  }

  // =========================================================================
  // 1. GAMEPLAY (Roleplay Loop)
  // =========================================================================

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

    // Variance & Visuals Delegation
    const visualsAuthorized = Warden.authorizeVisuals(instruction, options);

    const system = Screenplay.standard(
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

  async buildPrologue() {
    if (!this.story) throw new Error("No active story");

    const [ai, user, fractal] = await Promise.all([
      entities.get("character", this.story.aiId),
      entities.get("character", this.story.userId),
      entities.get(ROLES.FRACTAL, this.story.fractalId),
    ]);

    if (!fractal) return null;

    // [SECURITY] Strip Description (Reviewer Eyes Only)
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

    const system = Screenplay.prologue(fractal, context);
    return { system, messages: [] };
  }

  async buildEpilogue() {
    if (!this.story) throw new Error("No active story");
    const fractal = await entities.get(ROLES.FRACTAL, this.story.fractalId);
    const ai = await entities.get(ROLES.AI, this.story.aiId);
    const user = await entities.get(ROLES.USER, this.story.userId);

    const rawMessages = state.messages.byStoryId[this.storyId] || [];
    const history = rawMessages
      .slice(-30)
      .map((m) => {
        const name = m.characterName || (m.role === ROLES.USER ? "User" : "AI");
        return `[${name}]: ${m.text}`;
      })
      .join("\n");

    const system = Screenplay.epilogue(fractal, { ai, user, history });
    return { system, messages: [] };
  }

  async buildWardenPrompt(
    targetEntity,
    others,
    historyMessages,
    activeThreads,
  ) {
    // WARDEN PROMPT COMPOSITION (Inlined from deprecated Warden.compose)
    const system = `
[SYSTEM: PROMETHEUS_WARDEN]
You are THE WARDEN.
Your goal is to analyze the narrative and enforce the Laws of Physics.

ENTITIES:
Target: ${targetEntity.name} (${targetEntity.role || targetEntity.type})
Others:
${others.map((e) => `- ${e.name} (${e.role || e.type})`).join("\n")}

ACTIVE THREADS:
${activeThreads.join("\n")}

HISTORY:
${Array.isArray(historyMessages) ? historyMessages.map((m) => `[${(m.role || "User").charAt(0).toUpperCase() + (m.role || "User").slice(1)}]: ${m.text}`).join("\n") : historyMessages}

Analyze the last message and output JSON:
[JSON SCHEMA]
{
  "dynamics": { "entropy": 0-100, "velocity": 0-100, "permeability": 0-100, "resonance": 0-100 },
  "reflexes": ["list", "of", "detected", "reflexes"],
  "reasoning": "Explanation of the analysis",
  "log_entry": "Short summary of events from AI's biased perspective."
}
`.trim();

    return { system, messages: [] };
  }

  // =========================================================================
  // 2. VISUALIZATION (Mesmer)
  // =========================================================================

  async buildMesmerVisual(targetType) {
    const [ai, user, fractal] = await Promise.all([
      entities.get("character", this.story.aiId),
      entities.get("character", this.story.userId),
      entities.get(ROLES.FRACTAL, this.story.fractalId),
    ]);

    const rawMessages = state.messages.byStoryId[this.storyId] || [];
    const history = rawMessages
      .slice(-5)
      .map((m) => {
        const name = m.characterName || (m.role === ROLES.USER ? "User" : "AI");
        return `[${name}]: ${m.text}`;
      })
      .join("\n");

    const context = { ai, user, fractal, history };
    const mesmerInstructions = Mesmer.templateVisual(targetType, null, context);

    return {
      system: mesmerInstructions,
      messages: [],
      stopSequences: ["\n", "User:", "Character:"],
    };
  }

  buildMesmerExtract(description) {
    const system = Mesmer.templateVisual("ai", description, {
      mode: "extract",
    });
    return { system, messages: [] };
  }

  async buildMesmerEnhance(prompt, entity) {
    const targetType = entity.type === "fractal" ? "scene" : "ai";
    const context = {
      mode: "enhance",
      ai: entity.type !== "fractal" ? entity : null,
      fractal: entity.type === "fractal" ? entity : null,
    };
    const system = Mesmer.templateVisual(targetType, prompt, context);
    return { system, messages: [] };
  }

  /**
   * [FIX] Maestro Enhance (Profile Editor Magic Wand)
   * Wraps Mesmer logic to support the UI's specific call signature.
   */
  async buildMaestroEnhance(prompt, entity, signatureColor) {
    // Reuse Mesmer's enhance logic
    return this.buildMesmerEnhance(prompt, entity);
  }

  // =========================================================================
  // 3. KNOWLEDGE & MEMORY (Scholar)
  // =========================================================================

  buildScholarPrompt(field, content, context) {
    // Replaces buildLibrarian
    const system = templateConsult(field, content, context);
    return { system, messages: [] };
  }

  async buildScholarEchoPrompt(targetEntity, historyMessages, role) {
    const historyText = historyMessages
      .map((m) => {
        const label =
          m.characterName || (m.role === "user" ? "User" : "Character");
        const text = m.content || m.text || "";
        return `[${label}]: ${text}`;
      })
      .join("\n");

    const system = templateEcho(targetEntity, historyText, role);
    return { system, messages: [] };
  }
}
