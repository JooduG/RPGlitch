/**
 * src/ui/message/render.js
 * 💬 MESSAGE RENDERING PIPELINE
 * Owns the markdown-it instance and the full render chain that turns a raw LLM
 * message into safe display HTML: image-prompt stripping, think-block extraction,
 * cliché detox, markdown rendering, sanitization, and dialogue-quote wrapping.
 * Kept in the UI layer because it is render-only and depends on @data/@platform.
 */

import MarkdownIt from "markdown-it";
import { clean_image_prompts, parse_think_block } from "../../intelligence/parser.js";
import { detox_prose } from "@data";
import { sanitize } from "@platform";

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});

/**
 * Stateful parser to wrap text inside double quotes with a `<span class="dialogue">` tag.
 * Preserves inner HTML tags (like `<em>`) by splitting the HTML and running quote replacement on text nodes.
 * @param {string} html
 * @returns {string}
 */
export function wrap_dialogue(html) {
  if (!html) return "";
  const parts = html.split(/(<[^>]+>)/);
  let in_quote = false;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith("<")) {
      continue;
    }

    const text = parts[i].replace(/&quot;/g, '"');
    let new_text = "";
    let last_index = 0;

    for (let j = 0; j < text.length; j++) {
      if (text[j] === '"') {
        new_text += text.substring(last_index, j);
        if (!in_quote) {
          new_text += '<span class="dialogue">&ldquo;';
          in_quote = true;
        } else {
          new_text += "&rdquo;</span>";
          in_quote = false;
        }
        last_index = j + 1;
      }
    }
    new_text += text.substring(last_index);
    parts[i] = new_text;
  }

  let result = parts.join("");
  if (in_quote) {
    result += "</span>";
  }
  return result;
}

/**
 * Master parser that runs all passes.
 * @param {string|null|undefined} rawText
 * @param {"plain"|"ornate"|"raw"|"clinical"} [register="plain"]
 * @returns {{ displayText: string, think: string|null }}
 */
export function parse_message(rawText, register = "plain") {
  // 1. Remove Image Prompts (Artifacts)
  let text = clean_image_prompts(rawText || "");

  // 2. Extract Think Block
  const think_result = parse_think_block(text);
  text = think_result.content;

  // 3. Anti-Cliche Layer
  text = detox_prose(text, register);
  const detoxed_think = think_result.think ? detox_prose(think_result.think, register) : null;
  const detoxed_text = text;

  // 4. Render Markdown
  let rendered = sanitize(markdown.render(text).trim());
  rendered = rendered.replace(/&quot;/g, '"').replace(/&apos;/g, "'");

  // 5. Wrap Dialogue Quotes
  rendered = wrap_dialogue(rendered);

  const rendered_think = detoxed_think ? sanitize(markdown.render(detoxed_think).trim()) : null;

  return {
    displayText: rendered,
    think: rendered_think,
    detoxedText: detoxed_text,
  };
}
