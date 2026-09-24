/**
 * ============================================================================
 * .agents/skills/simulation/scripts/triage-prompt.js
 * 📐 PROMPT COMPLEXITY TRIAGE AND RIGHT-SIZED OPTIMIZATION ENGINE
 * ============================================================================
 *
 * Purpose:
 * Evaluates how much change a prompt needs before rewriting or editing it,
 * computing a 5-dimension score (D1-D5), technical parameter density risk (R1),
 * and enforcing tier ceilings to prevent over-editing working prompts or
 * under-editing broken ones.
 *
 * Scoring Model:
 * - D1: Specification completeness (0: clear goal/done, 1: vague, 2: guessing)
 * - D2: Ambiguity (0: 1 reading, 1: 2 similar readings, 2: materially divergent)
 * - D3: Structural need (0: none/present, 1: implied, 2: rigid schema needed)
 * - D4: Reasoning depth (0: single-step, 1: linear multi-step, 2: conditional/branching)
 * - D5: Stakes (0: trivial, 1: wastes work, 2: irreversible / financial / security)
 * - R1: Technical density (0: plain text, 1: few tokens, 2: dense paths/regex/flags/code)
 *
 * Tiers:
 * - Tier 0 (0-1): Leave As-Is
 * - Tier 1 (2-4): Light Touch (typos, clarity, verbatim preservation)
 * - Tier 2 (5-7): Structured Rewrite (explicit contract, canonical examples)
 * - Tier 3 (8-10): Full Rebuild (system contract, anti-patterns, non-goals)
 *
 * Invariants & Caps:
 * - User Ceiling Cap: Explicit user ceiling (e.g. "light_touch") caps at Tier 1.
 * - Technical Density Cap: R1 === 2 caps at Tier 2 (prevents rebuilding token-dense prompts).
 * - Degenerate Input: <= 3 words skips scoring and defaults to Tier 3 from goal.
 * ============================================================================
 */

/**
 * @typedef {Object} TriageDimensions
 * @property {number} d1_specification
 * @property {number} d2_ambiguity
 * @property {number} d3_structure
 * @property {number} d4_reasoning
 * @property {number} d5_stakes
 */

/**
 * @typedef {Object} TriageResult
 * @property {boolean} is_degenerate
 * @property {TriageDimensions} dimensions
 * @property {number} total_score
 * @property {{ r1_technical_density: number }} risk
 * @property {number} tier
 * @property {string} tier_name
 * @property {string | null} cap_applied
 * @property {string} summary
 */

const TIER_NAMES = Object.freeze({
  0: "LEAVE AS-IS",
  1: "LIGHT TOUCH",
  2: "STRUCTURED REWRITE",
  3: "FULL REBUILD",
});

/**
 * Assesses technical parameter density (code blocks, paths, regexes, flags, URLs, model IDs).
 * @param {string} text
 * @returns {number} 0 (low), 1 (medium), 2 (high)
 */
export function assess_technical_density(text) {
  if (!text || typeof text !== "string") return 0;
  let count = 0;

  // Code fences or inline backticks
  const code_matches = text.match(/`[^`]+`/g);
  if (code_matches) count += code_matches.length * 2;

  // File paths and directories
  const path_matches = text.match(/\b(?:src|tasks|tmp|\.agents)\/[\w.-]+/g);
  if (path_matches) count += path_matches.length * 2;

  // Flags and parameters
  const flag_matches = text.match(/--[\w-]+/g);
  if (flag_matches) count += flag_matches.length;

  // Regex patterns
  const regex_matches = text.match(/\/[^/\n]+\/[a-z]*/g);
  if (regex_matches) count += regex_matches.length * 2;

  // URLs
  const url_matches = text.match(/https?:\/\/[^\s)]+/g);
  if (url_matches) count += url_matches.length * 2;

  if (count >= 4) return 2;
  if (count >= 1) return 1;
  return 0;
}

/**
 * Calculates D1-D5 scoring dimensions heuristically from the prompt content and consumer.
 * @param {string} text
 * @param {string} [consumer="chat"]
 * @returns {TriageDimensions}
 */
export function calculate_complexity_score(text, consumer = "chat") {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // D1: Specification completeness
  let d1 = 0;
  if (!lower.includes("format") && !lower.includes("return only") && !lower.includes("output must")) {
    d1 = 1;
  }
  if (clean.length < 15) {
    d1 = 2;
  }

  // D2: Ambiguity
  let d2 = 0;
  if (lower.includes("better") || lower.includes("improve") || lower.includes("clean up")) {
    d2 = 1;
  }
  if (clean.split(/\s+/).length < 5) {
    d2 = 2;
  }

  // D3: Structural need
  let d3 = 0;
  if (consumer === "agent" || consumer === "code" || lower.includes("schema") || lower.includes("json") || lower.includes("table")) {
    d3 = 1;
  }
  if (
    (consumer === "agent" || consumer === "code") &&
    (lower.includes("rfc") || lower.includes("strict") || lower.includes("audit") || lower.includes("schema"))
  ) {
    d3 = 2;
  }

  // D4: Reasoning depth
  let d4 = 0;
  if (lower.includes("step") || lower.includes("then") || lower.includes("after")) {
    d4 = 1;
  }
  if (lower.includes("if ") || lower.includes("otherwise") || lower.includes("else") || lower.includes("branch")) {
    d4 = 2;
  }

  // D5: Stakes
  let d5 = 0;
  if (lower.includes("production") || lower.includes("security") || lower.includes("loss") || lower.includes("freeze") || lower.includes("risk")) {
    d5 = 2;
  } else if (lower.includes("test") || lower.includes("refactor")) {
    d5 = 1;
  }

  return {
    d1_specification: d1,
    d2_ambiguity: d2,
    d3_structure: d3,
    d4_reasoning: d4,
    d5_stakes: d5,
  };
}

/**
 * Resolves the operational tier based on raw total score and technical density cap.
 * @param {number} total_score
 * @param {number} r1_density
 * @returns {number} Tier (0, 1, 2, or 3)
 */
export function resolve_tier(total_score, r1_density) {
  let tier = 0;
  if (total_score >= 8) tier = 3;
  else if (total_score >= 5) tier = 2;
  else if (total_score >= 2) tier = 1;

  // Technical density cap: R1 === 2 caps at Tier 2 unless explicitly waived
  if (r1_density === 2 && tier > 2) {
    tier = 2;
  }
  return tier;
}

/**
 * Full triage execution for a prompt.
 * @param {string} prompt_text
 * @param {Object} [options={}]
 * @param {string} [options.consumer="chat"]
 * @param {string} [options.user_ceiling="none"]
 * @returns {TriageResult}
 */
export function triage_prompt(prompt_text, options = {}) {
  const { consumer = "chat", user_ceiling = "none" } = options;
  const words = prompt_text.trim().split(/\s+/).filter(Boolean);

  if (words.length <= 3) {
    return {
      is_degenerate: true,
      dimensions: { d1_specification: 2, d2_ambiguity: 2, d3_structure: 1, d4_reasoning: 0, d5_stakes: 1 },
      total_score: 6,
      risk: { r1_technical_density: 0 },
      tier: 3,
      tier_name: TIER_NAMES[3],
      cap_applied: null,
      summary: "Triage: degenerate input (<=3 words), no score -> Tier 3 (Full Rebuild) from stated goal",
    };
  }

  const dimensions = calculate_complexity_score(prompt_text, consumer);
  const total_score =
    dimensions.d1_specification + dimensions.d2_ambiguity + dimensions.d3_structure + dimensions.d4_reasoning + dimensions.d5_stakes;

  const r1_density = assess_technical_density(prompt_text);
  let tier = resolve_tier(total_score, r1_density);
  let cap_applied = null;

  if (r1_density === 2 && total_score >= 8 && tier === 2) {
    cap_applied = "technical_density";
  }

  if (user_ceiling === "light_touch" && tier >= 1) {
    if (tier > 1) {
      tier = 1;
      cap_applied = "user_ceiling";
    } else {
      cap_applied = "user_ceiling";
    }
  }

  const summary = `Triage: D1 ${dimensions.d1_specification}, D2 ${dimensions.d2_ambiguity}, D3 ${dimensions.d3_structure}, D4 ${dimensions.d4_reasoning}, D5 ${dimensions.d5_stakes} = ${total_score}/10; R1 = ${r1_density} -> Tier ${tier} (${TIER_NAMES[tier]})${cap_applied ? ` [Capped by ${cap_applied}]` : ""}`;

  return {
    is_degenerate: false,
    dimensions,
    total_score,
    risk: { r1_technical_density: r1_density },
    tier,
    tier_name: TIER_NAMES[tier],
    cap_applied,
    summary,
  };
}

// ============================================================================
// [SECTION 5: CLI EXECUTION RUNNER]
// ============================================================================

if (process.argv[1] && process.argv[1].endsWith("triage-prompt.js")) {
  const input_prompt = process.argv.slice(2).join(" ");
  if (!input_prompt) {
    console.log("Usage: node .agents/skills/simulation/scripts/triage-prompt.js <prompt-text>");
    process.exit(0);
  }
  const result = triage_prompt(input_prompt);
  console.log("--------------------------------------------------------------------------------");
  console.log("📐 PROMPT COMPLEXITY TRIAGE REPORT");
  console.log("--------------------------------------------------------------------------------");
  console.log(result.summary);
  console.log(`- Tier Name:   ${result.tier_name}`);
  console.log(`- Total Score: ${result.total_score}/10`);
  console.log(`- R1 Risk:     ${result.risk.r1_technical_density}`);
  console.log("--------------------------------------------------------------------------------");
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-09-24: Added CLI runner and initial prompt complexity triage module implementing D1-D5 scoring, R1 density risk evaluation, and tier capping.
 */
