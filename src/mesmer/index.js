/* FILE: src/mesmer/index.js */
import { CONFIG, ROLES } from "../gamemaster/config.js";
import { events, EVENTS, store as state } from "../gamemaster/index.js";
import { LlmService } from "../gamemaster/llm.js";
import { ContextBuilder, entities } from "../scholar/index.js";
import { soundEffects } from "./audio/sound-effects.js";
import { textToSpeech } from "./audio/text-to-speech.svelte.js"; // <--- THE NEW REACTIVE VOICE
import { TextToImage } from "./logic/text-to-image.js";

const error = console.error;
const { PHYSICS } = CONFIG;
const PHYSICS_CONSTANTS = PHYSICS;

export const VISUAL_CORTEX = `
[VISUAL_CORTEX]
- You have access to a visual generation engine.
- To generate an image, output a separate line: <image_prompt>Description of the image</image_prompt>.
- The description should be visual, detailed, and artistic.
- Do NOT include the <image_prompt> block inside the <think> block.
`;

export const MESMER_CONSTANTS = {
  FADE_DURATION: 300,
  TOAST_DURATION: 3000,
};

/**
 * THE MESMER
 * The Illusionist. Master of Light (Visuals), Sound (Audio/Voice), and Mood (Theme).
 * Consolidates "Prometheus Maestro" with Audio/Voice/Theme services.
 */
export const Mesmer = {
  // --- AUDIO (ILLUSION: SOUND) ---

  /**
   * The Native Voice Store (Svelte 5 Reactive)
   * Usage: Mesmer.voice.speak("Hello")
   * usage: $derived(Mesmer.voice.isSpeaking)
   */
  voice: textToSpeech,

  /**
   * Play a sound effect or notification.
   * @param {string} soundId - "notification", "click", "error", etc.
   */
  play: (soundId) => {
    return soundEffects.play(soundId);
  },

  // --- THEME (ILLUSION: MOOD) ---

  /**
   * Set the primary theme color dynamically.
   */
  setTheme: (element, colorName) => {
    if (!element) return;
    element.style.setProperty("--primary", colorName);
  },

  // --- VISUALS (ILLUSION: LIGHT) ---

  /**
   * Visualizer Pipeline
   * Generates a scene or character image based on a raw intent.
   */
  visualize: async (storyId, visualPrompt, targetType, options = {}) => {
    const story = state.story.byId[storyId];
    if (!story) throw new Error(`Story ${storyId} not found`);

    let targetRole = ROLES.AI;
    let targetId = story.aiId;

    if (targetType === ROLES.FRACTAL || targetType === "scene") {
      targetRole = ROLES.FRACTAL;
      targetId = story.fractalId;
    } else if (targetType === ROLES.USER) {
      targetRole = ROLES.USER;
      targetId = story.userId;
    }

    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, {
        detail: { role: targetRole, characterId: targetId },
      }),
    );

    try {
      const builder = new ContextBuilder(storyId);
      let vTarget = targetType || "character";
      if (targetType === ROLES.FRACTAL) vTarget = "scene";

      const vPayload = await builder.buildMesmerVisual(vTarget);
      vPayload.system += `\n<RAW_INTENT>\n${visualPrompt}\n</RAW_INTENT>`;

      const refinedPrompt = await LlmService.generate(vPayload, {
        maxTokens: 300,
        temperature: PHYSICS_CONSTANTS.VISUAL_TEMP_DEFAULT,
      });

      // [FEATURE] Extract Optics Thoughts for UI
      const thinkMatch = refinedPrompt.match(/<think>([\s\S]*?)<\/think>/i);
      const opticsThoughts = thinkMatch ? thinkMatch[1].trim() : null;

      // [HARDEN] Strip any leaked Narrative tags from the Refined Prompt
      const cleanRefinedPrompt = refinedPrompt
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<image_prompt[^>]*>|<\/image_prompt>/gi, "")
        .trim();

      const resolution = TextToImage.getResolutionForMode(
        options.aspect || vTarget,
      );

      const imageUrl = await TextToImage.generate(cleanRefinedPrompt, {
        resolution,
        guidanceScale: options.guidanceScale,
      });

      return { imageUrl, refinedPrompt: cleanRefinedPrompt, opticsThoughts };
    } catch (visErr) {
      error("[The_Mesmer] Visual Generation Failed:", visErr);
      return { imageUrl: null, refinedPrompt: null, opticsThoughts: null };
    } finally {
      events.dispatchEvent(
        new CustomEvent(EVENTS.TYPING_STOPPED, {
          detail: { role: targetRole, characterId: targetId },
        }),
      );
    }
  },

  /**
   * Extraction Pipeline
   * Scrapes a description to generate a portrait.
   */
  extract: async (characterId) => {
    try {
      const character = await entities.get("character", characterId);
      if (!character) throw new Error("Character not found");

      const builder = new ContextBuilder(null);
      const { system } = await builder.buildMesmerExtract(
        character.description || character.name,
      );

      const refinedPrompt = await LlmService.generate({ system, messages: [] });
      const imageUrl = await TextToImage.generate(refinedPrompt, {
        resolution: "512x768",
      });

      return imageUrl;
    } catch (e) {
      error("[The_Mesmer] Extraction Failed:", e);
      throw e;
    }
  },

  // --- PROMPT TEMPLATES ---

  templateVisual: (targetType, rawIntent, context) => {
    const { ai, user, fractal, history, mode = "visualize" } = context || {};
    let ctxBlock = "";

    switch (targetType) {
      case "scene":
        ctxBlock = `
[CONTEXT: FRACTAL (ENVIRONMENTAL ONLY)]
Base Physics: ${fractal?.forever?.physical || "Unknown"}
Current State: ${fractal?.present?.physical || "Standard atmosphere"}
Constraint: **STRICTLY NO CHARACTERS.** This image MUST NOT contain any humans, people, or specific characters. Focus entirely on setting, lighting, and objects.
`;
        break;

      case "user":
        ctxBlock = `
[CONTEXT: USER (AVATAR)]
Identity: ${user?.name || "User"}
Base Form (Forever): ${user?.forever?.physical || "Unknown"}
Dynamic State (Present): ${user?.present?.physical || "Standard outfit"}
Constraint: **SOLO PROTOCOL.** This image MUST feature ONLY the User. Do NOT include backgrounds characters or the AI character.
`;
        break;

      case "ai":
      case "character":
      default:
        ctxBlock = `
[CONTEXT: AI_ENTITY (CHARACTER)]
Identity: ${ai?.name || "AI"}
Base Form (Forever): ${ai?.forever?.physical || "Unknown"}
Dynamic State (Present): ${ai?.present?.physical || "Standard outfit"}
Constraint: **SOLO PROTOCOL.** This image MUST feature ONLY the AI. Do NOT include backgrounds characters or the User.
`;
        break;
    }

    return `
[SYSTEM: PROMETHEUS_MESMER_V3.0]
[MODULE: VISUAL_REALITY_ENGINE]
Role: Backend Image Prompt Processor.
Task: Convert the User's intent into a high-fidelity Stable Diffusion prompt.
Target: ${targetType}
[MODE: ${mode.toUpperCase()}]
[VISUALS_AUTHORIZED]
[THINK_AUTHORIZED]

[RECENT CONTEXT]
${history || "No recent history."}

${ctxBlock}

[INSTRUCTIONS: ${mode.toUpperCase()}]
${
  mode === "extract"
    ? `Objective: Scrape the provided Description/Profile to generate a brand new photorealistic portrait prompt. Focus on physical traits, lighting, and cinematic composition.`
    : mode === "enhance"
      ? `Objective: Refine the User's raw prompt into a high-fidelity visual description. Upgrade lighting, texture, and technical descriptors while preserving original intent.`
      : `Objective: Standard operation. Convert the User's intent into a single impactful image prompt.`
}

Input Context (Intent): "${rawIntent || "See raw input"}"

[PROTOCOL: OPTICS_BRAIN]
1. **CHAIN_OF_THOUGHT:** You MUST start with a <think> block to plan the composition (Lighting, Angle, Physics, Details) before writing the prompt.
2. **SOLO_SHOT:** You are authorized to generate **EXACTLY ONE** <image_prompt> tag. Do NOT generate multiple images. Pick the single most impactful moment.

[PROTOCOL: GENDER_STRICTNESS]
- **HAMMER DOWN THE GENDER.**
- If the Profile says MALE/MAN/BOY, the image MUST be MALE.
- If the Profile says FEMALE/WOMAN/GIRL, the image MUST be FEMALE.
- Any ambiguity (e.g. "femboy") must lean HEAVILY towards the biological base form defined in [Base Form] unless explicitly overridden by [Dynamic State].

[STRICT_PROTOCOL]
1. **HIERARCHY IS LAW.** If <RAW_INTENT> conflicts with Profile, <RAW_INTENT> wins.
2. **PHYSICAL ONLY.** Do NOT infer mental states. Use valid visual descriptors only.
3. **FORMAT:** Output properly formatted prompt text only. No conversational filler.
4. **STYLE:** 8k, photorealistic, cinematic lighting.
`;
  },
};
