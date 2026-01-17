/**
 * src/mesmer/logic/manager.js
 * VISUAL MANAGER
 * Handles prompt composition and image generation calls.
 */

const log = console.log;
const error = console.error;

export const VisualManager = {
  /**
   * Composes a visual prompt from a character profile.
   * @param {Object} entity
   * @returns {string}
   */
  composePrompt(entity) {
    if (!entity) return "";
    const physical = entity.present?.physical || entity.eternal?.physical || "";
    const visualTags = entity.tags ? entity.tags.join(", ") : "";

    let prompt = "";
    if (entity.name) prompt += `${entity.name}. `;
    if (physical) prompt += `${physical}. `;
    if (visualTags) prompt += `Tags: ${visualTags}. `;

    return prompt.trim();
  },

  /**
   * Returns resolution format based on target mode.
   * @param {string} mode - 'portrait' | 'landscape' | 'square' | 'scene' | 'character'
   * @returns {string} - "portrait", "landscape", "square"
   */
  getResolutionForMode(mode) {
    switch (mode) {
      case "landscape":
      case "scene":
      case "fractal":
        return "768x512";
      case "portrait":
      case "character":
      case "user":
      case "ai":
        return "512x768";
      default:
        return "512x512";
    }
  },

  /**
   * Generates an image from a prompt.
   * @param {string} prompt
   * @param {Object} options { resolution, removeBackground }
   * @returns {Promise<string|null>} The image URL
   */
  async generate(prompt, options = {}) {
    if (!window.textToImage) {
      error("[VisualManager] textToImage plugin not found.");
      return null;
    }

    try {
      log("[VisualManager] Generating:", prompt, options);
      // Mocking the plugin call, assuming perchant textToImage API
      // In a real scenario, this matches the plugin signature
      const result = await window.textToImage(prompt, options);
      return result?.url || result; // Adapt to plugin return type
    } catch (e) {
      error("[VisualManager] Generation failed:", e);
      return null;
    }
  },

  /**
   * Uploads a file to the server.
   * @param {File} file
   * @returns {Promise<string|null>}
   */
  async upload(file) {
    if (!window.upload) {
      error("[VisualManager] upload plugin not found.");
      return null;
    }

    try {
      log("[VisualManager] Uploading file:", file.name);
      const result = await window.upload(file);
      return result?.url || result;
    } catch (e) {
      error("[VisualManager] Upload failed:", e);
      return null;
    }
  },
};
