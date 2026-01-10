// src/js/gamemaster/parser.js
import { Warden } from "../warden/index.js";
import { ROLES } from "./config.js";

/**
 * THE NARRATIVE PARSER
 * Extracts Text, Thoughts, and Visual Instructions from the AI's raw stream.
 */
export const Parser = {
  process: (response) => {
    if (!response) {
      return {
        text: "",
        visualPrompts: [],
        targetType: ROLES.AI,
        aspect: null,
      };
    }
    // [WARDEN] Sanitization
    let text = Warden.clean(response);

    const visualPrompts = [];
    let aspect = null;
    let targetType = ROLES.AI;

    // [MULTI-SHOT] Robust Attribute Parsing
    // We capture attributes (Group 1) and content (Group 2) separately
    const visualMatches = [
      ...response.matchAll(/<image_prompt([^>]*)>([\s\S]*?)<\/image_prompt>/gi),
    ];

    if (visualMatches.length > 0) {
      visualMatches.forEach((match) => {
        // Clean up the text by removing the full tag
        text = text.replace(match[0], "").trim();

        const attrs = match[1]; // e.g. ' target="scene" aspect="landscape"'
        const content = match[2];

        // Extract attributes independently (Order agnostic, handles whitespace)
        const targetMatch = attrs.match(/target=["']([^"']+)["']/i);
        const aspectMatch = attrs.match(/aspect=["']([^"']+)["']/i);

        // Default values
        const pTarget = targetMatch
          ? targetMatch[1].toLowerCase()
          : "character";
        const pAspect = aspectMatch ? aspectMatch[1].toLowerCase() : "portrait";

        // Update Top-Level metadata (from last tag found)
        targetType = pTarget;
        aspect = pAspect;

        // Clean thought blocks
        const rawPrompt = content
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .trim();

        if (rawPrompt) {
          visualPrompts.push({
            prompt: rawPrompt,
            target: pTarget,
            aspect: pAspect,
          });
        }
      });

      // Re-inject for UI display
      visualPrompts.forEach((vp) => {
        // [CLEANUP] Ensure the display prompt doesn't have leaked tags
        const displayPrompt = vp.prompt
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .replace(/<image_prompt[^>]*>|<\/image_prompt>/gi, "")
          .trim();
        text += `\n\n<image_prompt target="${vp.target}" aspect="${vp.aspect}">${displayPrompt}</image_prompt>`;
      });
    }

    // Clean any residual <think> tags from the main text if they weren't inside image prompts
    // (Usually UI handles this via CSS, but good to have raw text clean-ish)
    // Actually, we usually keep them for the UI to fold.

    return { text, visualPrompts, targetType, aspect };
  },
};
