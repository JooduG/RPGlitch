/**
 * src/media/image-generation.js
 * 🎨 IMAGE GENERATION SERVICE (Facade Bridge)
 * This file acts as a backward-compatible bridge for the modular visual system.
 * Logic is now split across:
 * - ./visuals/image_prompts.js (Aesthetic routing & Tag composition)
 * - ./visuals/image_engine.js  (API Execution & High-level Pipelines)
 */

import { GeneratorEngine, ImageGeneration } from "./image_engine.js"
import { AestheticRouter, NEGATIVE_PROMPT, PROMPT_TEMPLATES, PromptEngine, VISUAL_CORTEX } from "./image_prompts.js"

// Export the main controllers and objects
export { AestheticRouter, GeneratorEngine, ImageGeneration, NEGATIVE_PROMPT, PROMPT_TEMPLATES, PromptEngine, VISUAL_CORTEX }

// Direct method exports for legacy compatibility
export const optimizeImagePrompt = ImageGeneration.optimizeImagePrompt
export const composeBasePrompt = ImageGeneration.composeBasePrompt
export const getResolution = ImageGeneration.getResolution
export const upload = ImageGeneration.upload
export const cacheImage = ImageGeneration.cacheImage
export const templateVisual = ImageGeneration.templateVisual
