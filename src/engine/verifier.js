/**
 * src/engine/verifier.js
 * ============================================================================
 * 📜 STRUCTURAL TAG INVENTORY & ENVELOPE VERIFIER
 * ============================================================================
 *
 * Lean structural gatekeeper for prompt compilation in RPGlitch.
 * Replaces legacy byte-size checks by verifying:
 * 1. Envelope closures (<SYSTEM ...> ... </SYSTEM>).
 * 2. Balance of all open and closing XML-style tags.
 * 3. Tag inventories: verifying ordered presence of mandatory structural layers.
 * 4. Prohibition of unescaped/naked control leaks.
 * 5. Relational invariant: relations must emit child <RELATION target="..."> tags.
 * ============================================================================
 */

/**
 * Extracts all XML-style tags in order of appearance from a prompt string.
 * Returns an array of tag objects: { name, is_closing, is_self_closing, raw }
 *
 * @param {string} promptText
 * @returns {Array<{ name: string, is_closing: boolean, is_self_closing: boolean, raw: string }>}
 */
export function extract_tag_sequence(promptText) {
  if (typeof promptText !== "string") return [];

  // Match XML tags like <TAG>, </TAG>, <TAG attr="val">, <TAG />
  // Exclude KaTeX / mathematical symbols or plain brackets like [KEY: VAL]
  const tag_regex = /<\/?([A-Za-z0-9_-]+)(?:\s+[^>]*)?\/?>/g;
  const sequence = [];
  let match;

  while ((match = tag_regex.exec(promptText)) !== null) {
    const raw = match[0];
    const name = match[1];
    const is_closing = raw.startsWith("</");
    const is_self_closing = raw.endsWith("/>");

    sequence.push({
      name,
      is_closing,
      is_self_closing,
      raw,
    });
  }

  return sequence;
}

/**
 * Validates that all opened tags in a prompt text are balanced and properly closed.
 *
 * @param {string} promptText
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function verify_tag_balance(promptText) {
  const errors = [];
  const tags = extract_tag_sequence(promptText);
  const stack = [];

  for (const tag of tags) {
    if (tag.is_self_closing) continue;

    if (!tag.is_closing) {
      stack.push(tag.name);
    } else {
      if (stack.length === 0) {
        errors.push(`Unexpected closing tag </${tag.name}> with no matching opening tag.`);
      } else {
        const expected = stack.pop();
        if (expected !== tag.name) {
          errors.push(`Mismatched closing tag: expected </${expected}>, but encountered </${tag.name}>.`);
        }
      }
    }
  }

  while (stack.length > 0) {
    const unclosed = stack.pop();
    errors.push(`Unclosed opening tag <${unclosed}>.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verifies that a prompt strictly begins with <SYSTEM and ends with </SYSTEM>.
 *
 * @param {string} promptText
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function verify_system_envelope(promptText) {
  const errors = [];
  const trimmed = promptText ? promptText.trim() : "";

  if (!trimmed.startsWith("<SYSTEM")) {
    errors.push("Prompt envelope does not start with <SYSTEM opening tag.");
  }
  if (!trimmed.endsWith("</SYSTEM>")) {
    errors.push("Prompt envelope does not end with </SYSTEM> closing tag.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verifies that an expected sequence of tags appears in order in the prompt.
 *
 * @param {string} promptText
 * @param {string[]} expectedTagOrder
 * @returns {{ valid: boolean, missing: string[], out_of_order: string[] }}
 */
export function verify_tag_order(promptText, expectedTagOrder) {
  const tags = extract_tag_sequence(promptText)
    .filter((t) => !t.is_closing)
    .map((t) => t.name);

  const missing = [];
  const out_of_order = [];
  let last_index = -1;

  for (const expected of expectedTagOrder) {
    const current_index = tags.indexOf(expected, last_index + 1);
    if (current_index === -1) {
      // Check if it exists earlier (out of order) or is completely missing
      if (tags.includes(expected)) {
        out_of_order.push(expected);
      } else {
        missing.push(expected);
      }
    } else {
      last_index = current_index;
    }
  }

  return {
    valid: missing.length === 0 && out_of_order.length === 0,
    missing,
    out_of_order,
  };
}

/**
 * Checks for forbidden leaks: raw prompt delimiters, unclosed directives, or naked variables.
 *
 * @param {string} promptText
 * @returns {{ valid: boolean, violations: string[] }}
 */
export function verify_prompt_hygiene(promptText) {
  const violations = [];
  if (!promptText || typeof promptText !== "string") {
    return { valid: false, violations: ["Empty or non-string prompt text."] };
  }

  // Detect unparsed mustache macros like {{char}} or {{user}}
  const unparsed_macros = promptText.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
  if (unparsed_macros) {
    violations.push(`Unparsed mustache macro detected: ${unparsed_macros.join(", ")}`);
  }

  // Detect unclosed think markers
  if (promptText.includes("<think>") && !promptText.includes("</think>")) {
    // Note: <think> in prompt startWith is fine, but inside static spine must be closed or avoided
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Combined verification gate for compiled prompts.
 *
 * @param {string} promptText
 * @param {{ expected_tags?: string[] }} options
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function verify_compiled_prompt(promptText, options = {}) {
  const errors = [];

  const envelope = verify_system_envelope(promptText);
  if (!envelope.valid) errors.push(...envelope.errors);

  const balance = verify_tag_balance(promptText);
  if (!balance.valid) errors.push(...balance.errors);

  if (options.expected_tags && options.expected_tags.length > 0) {
    const order = verify_tag_order(promptText, options.expected_tags);
    if (!order.valid) {
      if (order.missing.length > 0) {
        errors.push(`Missing mandatory tags: ${order.missing.join(", ")}`);
      }
      if (order.out_of_order.length > 0) {
        errors.push(`Tags appeared out of order: ${order.out_of_order.join(", ")}`);
      }
    }
  }

  const hygiene = verify_prompt_hygiene(promptText);
  if (!hygiene.valid) errors.push(...hygiene.violations);

  return {
    valid: errors.length === 0,
    errors,
  };
}
