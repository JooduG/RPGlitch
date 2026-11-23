/**
 * @file src/simulation/prose.js
 * Narrative prose rendering pipeline (Rank 1, pure simulation).
 * Extracts image prompt stripping, think blocks, cliché detox, markdown,
 * sanitization, and dialogue quote wrapping for ChatBubble and DevBubble.
 */

import { sanitize } from "@utils";
import MarkdownIt from "markdown-it";
import { format_tagged_fields } from "./brackets.js";
import { clean_generated_prose, parse_think_block, strip_covert_directives } from "./llm-output.js";
// Note: if `clean_image_prompts` is exported from `./retrieval.js` instead of `./prompts.js`, swap the path below.
import { clean_image_prompts } from "./prompts.js";

const markdown = new MarkdownIt({ html: false, breaks: true, linkify: true });

/**
 * Stateful parser wrapping text inside double quotes with `<span class="dialogue">`.
 * Decodes `&quot;` / `&apos;` safely on text nodes only (never on HTML tag attributes).
 * @param {string} html
 * @returns {string}
 */
export function wrap_dialogue(html) {
  if (!html) return "";
  const parts = html.split(/(<[^>]+>)/);
  let in_quote = false;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith("<")) continue;

    const text = parts[i].replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    let new_text = "";
    let last_index = 0;

    for (let j = 0; j < text.length; j++) {
      if (text[j] === '"') {
        new_text += text.substring(last_index, j);
        new_text += in_quote ? "&rdquo;</span>" : '<span class="dialogue">&ldquo;';
        in_quote = !in_quote;
        last_index = j + 1;
      }
    }
    parts[i] = new_text + text.substring(last_index);
  }

  return parts.join("") + (in_quote ? "</span>" : "");
}

/**
 * Lightweight think-block markdown renderer (skips image-prompt & dialogue passes).
 * @param {string | null | undefined} raw_think
 * @param {"casual" | "lyrical" | "primal" | "clinical"} [register="casual"]
 * @returns {string | null}
 */
export function render_think_html(raw_think, register = "casual") {
  if (!raw_think || !String(raw_think).trim()) return null;
  const detoxed = clean_generated_prose(String(raw_think), register);
  return sanitize(markdown.render(detoxed).trim());
}

/**
 * Master parser running image prompt stripping, think extraction, cliché detox,
 * markdown rendering, sanitization, and dialogue quote wrapping.
 * @param {string | null | undefined} raw_text
 * @param {"casual" | "lyrical" | "primal" | "clinical"} [register="casual"]
 * @returns {{ displayText: string, think: string | null, rawThink: string | null, detoxedText: string }}
 */
export function parse_message(raw_text, register = "casual") {
  let text = clean_image_prompts(raw_text || "");
  const { content, think } = parse_think_block(text);

  text = clean_generated_prose(content, register);
  text = format_tagged_fields(strip_covert_directives(text), { see_hidden: "none" });

  const rendered = wrap_dialogue(sanitize(markdown.render(text).trim()));
  return { displayText: rendered, think: render_think_html(think, register), rawThink: think || null, detoxedText: text };
}
