/**
 * src/intelligence/modules/entities/epistemic.js
 * ============================================================================
 * 🛡️ EPISTEMIC SECURITY MODULE — The Epistemic Wall & Privacy Sanitization
 * ============================================================================
 *
 * Enforces the Epistemic Wall across the RPGlitch simulation lifecycle.
 * Ensures that private thoughts ([SECRET: ...], [PLAN: ...]) and covert intentions
 * of non-owner entities are never leaked to another entity's perspective.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string sanitization and verification.
 * - Zero external dependencies.
 * - Strict Full-Name domain nomenclature.
 * ============================================================================
 */

import { safe_parse_pseudo_json } from "@utils";

/**
 * Strips epistemic [SECRET: ...] and [PLAN: ...] directives from rendered state strings.
 * Enforces the Epistemic Wall so AI models never receive another entity's private knowledge.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function strip_epistemic_tags(text) {
  if (!text) return "";
  return String(text)
    .replace(/\[(?:SECRET|PLAN)\s*:\s*[^\]]*\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Conditionally strips epistemic secrets and plans based on entity perspective.
 * When is_owner is true, private state is preserved; when false, state is sanitized.
 *
 * @param {string|null|undefined} state_text
 * @param {boolean} [is_owner=false]
 * @returns {string}
 */
export function strip_epistemic_secrets(state_text, is_owner = false) {
  if (!state_text) return "";
  return is_owner ? String(state_text) : strip_epistemic_tags(state_text);
}

/**
 * Verifies epistemic wall integrity in a compiled prompt string.
 * Audits for forbidden private tags ([SECRET: ...] or [PLAN: ...]).
 *
 * @param {string} prompt_text - Compiled prompt text to audit.
 * @returns {boolean} True if clean, false if an epistemic leak was detected.
 */
export function verify_epistemic_integrity(prompt_text) {
  if (!prompt_text || typeof prompt_text !== "string") return true;
  const secret_match = prompt_text.match(/\[SECRET\s*:\s*[^\]]*\]/i);
  if (secret_match) {
    return false;
  }
  const plan_match = prompt_text.match(/\[PLAN\s*:\s*[^\]]*\]/i);
  if (plan_match) {
    return false;
  }
  return true;
}

/**
 * Keys that must NEVER reach an image-generation prompt (private state or physical inventory).
 * @type {ReadonlySet<string>}
 */
export const VISUAL_EXCLUDED_KEYS = Object.freeze(new Set(["INVENTORY", "STASH", "SECRET", "PLAN", "STATUS"]));

/**
 * Strips non-visual pseudo-JSON keys from a raw parameter string for image generation prompts.
 *
 * @param {string | null | undefined} raw_parameter_string
 * @returns {string} Sanitized visual parameter string
 */
export function strip_visual_excluded(raw_parameter_string) {
  if (!raw_parameter_string) return "";
  const parsed_parameters = safe_parse_pseudo_json(raw_parameter_string);
  if (parsed_parameters.__raw_prose__) return raw_parameter_string;

  const retained_entries = Object.entries(parsed_parameters)
    .filter(([key]) => !VISUAL_EXCLUDED_KEYS.has(key))
    .map(([key, value]) => `[${key}: ${Array.isArray(value) ? value.join(", ") : String(value).replace(/[[\]]/g, "")}]`);

  return retained_entries.join(" ");
}

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-19: Repatriated VISUAL_EXCLUDED_KEYS and strip_visual_excluded from media layer to epistemic.js, establishing pure self-contained epistemic prompt filtering.
 * - 2026-09-18: Standardized verify_epistemic_integrity contract to return boolean (true = clean, false = leak) aligning with call-site guard.
 * - 2026-09-18: Extracted from monolithic entities.js into dedicated epistemic.js submodule; added verify_epistemic_integrity assertion guard.
 * ============================================================================
 */
