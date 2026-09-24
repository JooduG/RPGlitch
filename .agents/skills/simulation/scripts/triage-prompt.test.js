/**
 * ============================================================================
 * .agents/skills/simulation/scripts/triage-prompt.test.js
 * 🧪 PROMPT COMPLEXITY TRIAGE MATRIX UNIT TESTS
 * ============================================================================
 *
 * Purpose:
 * Unit tests verifying the 5-dimension (D1-D5) prompt scoring model, R1 parameter
 * density risk evaluation, tier assignment thresholds, and ceiling caps.
 *
 * Architecture:
 * - D1: Specification completeness (0-2)
 * - D2: Ambiguity (0-2)
 * - D3: Structural need (0-2)
 * - D4: Reasoning depth (0-2)
 * - D5: Stakes (0-2)
 * - R1: Technical parameter density risk (0-2)
 * - Tiers: Tier 0 (0-1), Tier 1 (2-4), Tier 2 (5-7), Tier 3 (8-10)
 * - Caps: R1 === 2 caps at Tier 2; explicit user ceilings cap tier downward.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { triage_prompt, resolve_tier } from "./triage-prompt.js";

describe("calculate_complexity_score()", () => {
  it("evaluates degenerate input of 3 words or fewer", () => {
    const result = triage_prompt("fix this", { consumer: "chat" });
    expect(result.is_degenerate).toBe(true);
    expect(result.tier).toBe(3);
    expect(result.summary).toContain("degenerate input");
  });

  it("calculates score 0 for simple, fully specified, single-step prompts", () => {
    const prompt = "Format this JSON payload with 2 spaces of indentation and return only the JSON.";
    const result = triage_prompt(prompt, { consumer: "code" });
    expect(result.total_score).toBeLessThanOrEqual(2);
    expect(result.tier).toBeLessThanOrEqual(1);
  });

  it("calculates high scores for ambiguous, multi-step, structured, high-stakes tasks", () => {
    const complex_prompt = `
      Analyze our user telemetry data across all regions and devise a 5-step risk mitigation policy.
      If fraud score exceeds 0.85, trigger immediate freeze and alert security.
      Otherwise, evaluate purchase velocity. If velocity is high, request 2FA.
      Ensure the output matches our strict RFC-compliant audit schema with rollback procedures.
      A mistake will result in false account closures or financial loss.
    `;
    const result = triage_prompt(complex_prompt, { consumer: "agent" });
    expect(result.dimensions.d1_specification).toBeGreaterThanOrEqual(1);
    expect(result.dimensions.d3_structure).toBeGreaterThanOrEqual(1);
    expect(result.dimensions.d4_reasoning).toBe(2);
    expect(result.dimensions.d5_stakes).toBe(2);
    expect(result.total_score).toBeGreaterThanOrEqual(6);
    expect(result.tier).toBeGreaterThanOrEqual(2);
  });

  it("detects high technical-parameter density (R1) and enforces Tier 2 cap", () => {
    const token_dense_prompt = `
      Update \`src/intelligence/modules/system.js\` to modify regex \`/^<SYSTEM>(.*?)<\\/SYSTEM>$/gs\`.
      Keep CLI flag \`--strict-mode\` and model ID \`claude-3-5-sonnet-20241022\`.
      Ensure URL https://api.perchance.org/v2/stream adheres to error code ERR_CONN_RESET.
    `;
    const result = triage_prompt(token_dense_prompt, { consumer: "code" });
    expect(result.risk.r1_technical_density).toBe(2);
    // If score would have qualified for Tier 3, R1=2 caps at Tier 2
    const forced_tier = resolve_tier(9, 2);
    expect(forced_tier).toBe(2);
  });

  it("respects user explicit ceiling caps", () => {
    const complex_prompt = "Rewrite the entire state machine with multi-branch logic, schemas, and error codes.";
    const result = triage_prompt(complex_prompt, { user_ceiling: "light_touch" });
    expect(result.tier).toBeLessThanOrEqual(1);
    expect(result.cap_applied).toBe("user_ceiling");
  });
});
