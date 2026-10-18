/**
 * @file src/config.js
 * ⚙️ RPGlitch System Configuration & Token Budget Allocations
 *
 * Promoted configuration surface providing canonical defaults for the prompt token
 * ceiling, dynamic reservoir allocations, and simulation limits across @intelligence,
 * @state, and @ui without layer violations.
 */

// -----------------------------------------------------------------------------
// [SECTION 1: PROMPT TOKEN CEILING & RESERVOIR BUDGETS]
// -----------------------------------------------------------------------------

/**
 * Hard ceiling: Dispatched prompt assemblies must stay below this limit
 * to avoid middle-truncation / context loss on inference backends.
 * Default: 6,000 tokens.
 */
export const DEFAULT_PROMPT_CEILING = 6000;

/**
 * Historical ceiling multiplier weights.
 * Allocations proportionally scale if a custom ceiling is applied.
 */
export const PROMPT_BUDGET_WEIGHTS = Object.freeze({
  system: 0.2, // ~1,200 tokens (constitution, axiomatic protocols, dynamics)
  entities: 0.333, // ~2,000 tokens (actor sheets, cast, candidate vectors)
  history: 0.267, // ~1,600 tokens (dialogue transcript window)
  task: 0.2, // ~1,200 tokens (currents, directives, schema, delivery posture)
});

/**
 * Resolves the token budget allocation across prompt layers based on a given ceiling.
 *
 * @param {number} [ceiling=DEFAULT_PROMPT_CEILING] - Target prompt token ceiling
 * @returns {{
 *   ceiling: number,
 *   system_max_tokens: number,
 *   entities_max_tokens: number,
 *   history_max_tokens: number,
 *   task_max_tokens: number
 * }}
 */
export function resolve_prompt_budget_allocation(ceiling = DEFAULT_PROMPT_CEILING) {
  const safe_ceiling = typeof ceiling === "number" && ceiling > 0 ? ceiling : DEFAULT_PROMPT_CEILING;

  // Use fixed baseline numbers when ceiling is default 6000 to maintain byte contracts
  if (safe_ceiling === DEFAULT_PROMPT_CEILING) {
    return Object.freeze({
      ceiling: DEFAULT_PROMPT_CEILING,
      system_max_tokens: 1200,
      entities_max_tokens: 2000,
      history_max_tokens: 1600,
      task_max_tokens: 1200,
    });
  }

  return Object.freeze({
    ceiling: safe_ceiling,
    system_max_tokens: Math.round(safe_ceiling * PROMPT_BUDGET_WEIGHTS.system),
    entities_max_tokens: Math.round(safe_ceiling * PROMPT_BUDGET_WEIGHTS.entities),
    history_max_tokens: Math.round(safe_ceiling * PROMPT_BUDGET_WEIGHTS.history),
    task_max_tokens: Math.round(safe_ceiling * PROMPT_BUDGET_WEIGHTS.task),
  });
}

// -----------------------------------------------------------------------------
// [SECTION 2: MEMORY & TEMPORAL LIMITS]
// -----------------------------------------------------------------------------

/** Maximum session memories preserved per entity before FIFO eviction */
export const PAST_VECTOR_CAP = 20;

/** Maximum lifetime total vectors per entity in cold/warm storage */
export const MAX_ENTITY_VECTORS = 200;

/** Maximum length in characters for a single consolidated memory string */
export const MAX_VECTOR_CHARS = 220;

// =============================================================================
// CHANGELOG
// =============================================================================

/**
 * CHANGELOG:
 * - 2026-10-18: Track A Slice 3 — Created promoted root src/config.js with DEFAULT_PROMPT_CEILING and resolve_prompt_budget_allocation.
 */
