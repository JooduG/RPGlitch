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

import { filter_epistemic_brackets } from "../../synaptic.js";

/**
 * Strips epistemic [SECRET: ...] and [PLAN: ...] directives as well as
 * hidden bracket entries from rendered state strings.
 * Enforces the Epistemic Wall so AI models never receive another entity's private knowledge.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function strip_epistemic_tags(text) {
  if (!text) return "";
  const filtered = filter_epistemic_brackets(text, "other");
  return String(filtered)
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
  return filter_epistemic_brackets(state_text, is_owner ? "owner" : "other");
}

/**
 * Verifies epistemic wall integrity in a compiled prompt string.
 * Audits for forbidden private tags ([SECRET: ...], [PLAN: ...], or uncompiled | hide entries).
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
  const hide_match = prompt_text.match(/\[[^\]]*\|\s*hide\s*[^\]]*\]/i);
  if (hide_match) {
    return false;
  }
  return true;
}

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-29: Routed through synaptic.js:filter_epistemic_brackets to support universal bracket hide visibility, owner secrecy signals, and uncompiled hide leakage detection.
 * - 2026-09-23: Purged redundant re-exports of VISUAL_EXCLUDED_KEYS and strip_visual_excluded under P4; downstream consumers import directly from @utils.
 * - 2026-09-23: Delegated VISUAL_EXCLUDED_KEYS and strip_visual_excluded to @utils/text.js to break circular dependency with media layer.
 * - 2026-09-19: Repatriated VISUAL_EXCLUDED_KEYS and strip_visual_excluded from media layer to epistemic.js, establishing pure self-contained epistemic prompt filtering.
 * - 2026-09-18: Standardized verify_epistemic_integrity contract to return boolean (true = clean, false = leak) aligning with call-site guard.
 * - 2026-09-18: Extracted from monolithic entities.js into dedicated epistemic.js submodule; added verify_epistemic_integrity assertion guard.
 * ============================================================================
 */
