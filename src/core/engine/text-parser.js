/**
 * @file text_parser.js
 * @description Logic for parsing raw LLM output into structured UI data.
 * Handles: Think blocks, Image prompts, and Scene Headers.
 */
/**
 * Extracts <think> blocks from text.
 * @param {string} text
 * @returns {{ content: string, think: string|null }}
 */
export function parse_think_block(text) {
  if (!text) return { content: "", think: null };
  const match = text.match(/<think>([\s\S]*?)<\/think>/i);
  const think = match ? match[1].trim() : null;
  const content = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  return { content, think };
}
/**
 * Removes <image_prompt> tags from text.
 * @param {string} text
 * @returns {string}
 */
export function clean_image_prompts(text) {
  if (!text) return "";

  // 1. Remove Markdown image syntax ![alt](url)
  let result = text.replace(/!\[.*?\]\(.*?\)/g, "");

  // 2. Remove self-closing tags with potential quoted '>' in attributes
  // Matches <tag ... /> where attributes can have quoted strings
  // We handle image_prompt specifically to avoid over-matching other tags
  // Note: Standard JS regex doesn't support atomic groups (++) or possessive quantifiers (*+) in all environments
  result = result.replace(/<image_prompt\s+(?:[^"'>]|"[^"]*"|'[^']*')*?\/>/gi, "");
  // Also handle the no-attribute case <image_prompt />
  result = result.replace(/<image_prompt\s*\/>/gi, "");

  // 3. Iteratively remove the innermost <image_prompt>...</image_prompt> and <image>...</image> pairs
  let previous = "";
  while (previous !== result) {
    previous = result;
    // Handle <image_prompt>...</image_prompt>
    result = result.replace(
      /<image_prompt(?:\s+(?:[^"'>]|"[^"]*"|'[^']*')*)?>(?:(?!<image_prompt)[\s\S])*?<\/image_prompt\s*>/gi,
      "",
    );
    // Handle <image>...</image>
    result = result.replace(
      /<image(?:\s+(?:[^"'>]|"[^"]*"|'[^']*')*)?>(?:(?!<image)[\s\S])*?<\/image\s*>/gi,
      "",
    );
  }

  return result;
}
/**
 * Parses Scene Headers in the format: 『 [Location] · [Time] · [Weather] 』
 * @param {string} text
 * @returns {{ content: string, header: { location: string, time: string, weather: string }|null }}
 */
export function parse_scene_header(text) {
  if (!text) return { content: "", header: null };
  // Pattern: 『 [Location] · [Time] · [Weather] 』
  const match = text.match(
    /^『\s*\[\s*([\s\S]*?)\s*]\s*·\s*\[\s*([\s\S]*?)\s*]\s*·\s*\[\s*([\s\S]*?)\s*]\s*』/,
  );
  if (match) {
    return {
      content: text.replace(match[0], "").trim(),
      header: {
        location: match[1].trim(),
        time: match[2].trim(),
        weather: match[3].trim(),
      },
    };
  }
  return { content: text, header: null };
}
/**
 * Master parser that runs all passes.
 * @param {string} rawText
 * @returns {{ displayText: string, think: string|null, sceneData: object|null }}
 */
export function parse_message(rawText) {
  // 1. Remove Image Prompts (Artifacts)
  let text = clean_image_prompts(rawText || "");
  // 2. Extract Think Block
  const thinkResult = parse_think_block(text);
  text = thinkResult.content;
  // 3. Extract Scene Header
  const headerResult = parse_scene_header(text);
  return {
    displayText: headerResult.content,
    think: thinkResult.think,
    sceneData: headerResult.header,
  };
}
/**
 * Text sanitization for prompt safety.
 * Removes markdown-like characters and collapses whitespace.
 * @param {string} text
 * @param {number} [limit=500]
 * @returns {string}
 */
export function clean_text(text, limit = 500) {
  if (!text) return "";
  const clean = text
    .replace(/[*_#>`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > limit ? clean.substring(0, limit) + "..." : clean;
}
