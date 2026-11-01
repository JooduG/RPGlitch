import { describe, it, expect } from "vitest";
import { compile_prompt as compile_legacy } from "../intelligence/prompts.js";
import { create_contract_fixtures } from "../intelligence/prompt-verification.js";
import { compile_prompt as compile_greenfield } from "./prompts.js";
import { verify_compiled_prompt } from "./verifier.js";

/**
 * 🛡️ DIFFERENTIAL EQUIVALENCE SUITE (TEMPORARY: Destroyed in Gate 4)
 *
 * Verifies that given the exact same canonical fixtures, new src/engine/prompts.js
 * emits all required semantic layers and invariant tag order with zero silent tuning drift.
 */
describe("src/engine/differential.test.js — Legacy vs Greenfield Differential Equivalence", () => {
  const { entities, snapshot, history } = create_contract_fixtures();

  it("character core produces structural parity with legacy interaction prompt", () => {
    // 1. Compile legacy prompt (returns { system: string, meta?: ... })
    const legacyResult = compile_legacy("interaction", {
      round: 1,
      entities,
      history,
      compressed_snapshot: snapshot,
      simulation_log: history,
      input: "Alice prepares to move.",
    });
    const legacyPrompt = typeof legacyResult === "string" ? legacyResult : legacyResult.system;

    // 2. Compile new greenfield prompt (returns string)
    const greenfieldPrompt = compile_greenfield({
      core: "character",
      round: 1,
      entities,
      history,
      input: "Alice prepares to move.",
    });

    // Verify greenfield satisfies structural verifier
    const greenfieldCheck = verify_compiled_prompt(greenfieldPrompt);
    expect(greenfieldCheck.valid).toBe(true);

    // Differential Parity Assertions:
    // Both prompts must enforce the 4 Axiomatic Laws (legacy uses `title="Law"`, greenfield uses `name="Law"`)
    for (const law of ["Causality", "Epistemics", "Sovereignty", "Fidelity"]) {
      expect(legacyPrompt).toContain(`title="${law}"`);
      expect(greenfieldPrompt).toContain(`name="${law}"`);
    }

    // Greenfield prompt embeds the canonical entity and world truth fixtures
    for (const token of [
      'id="ALICE"',
      'id="BOB"',
      'id="SECTOR_FOUR"',
      "Analytical cybernetic specialist.",
      "Veteran decker.",
      "Degraded industrial district.",
    ]) {
      expect(greenfieldPrompt).toContain(token);
    }

    // Both prompts enforce the Epistemic Wall: hidden secrets must not leak
    expect(legacyPrompt).not.toContain("[SECRET:");
    expect(greenfieldPrompt).not.toContain("[SECRET:");
  });

  it("director core produces structured staging parity with legacy director prompt", () => {
    const legacyResult = compile_legacy("director", {
      round: 1,
      entities,
      history,
      compressed_snapshot: snapshot,
      simulation_log: history,
      input: "Bob scans the perimeter.",
    });
    const legacyDirector = typeof legacyResult === "string" ? legacyResult : legacyResult.system;

    const greenfieldPrompt = compile_greenfield({
      core: "director",
      round: 1,
      entities,
      history,
      input: "Bob scans the perimeter.",
    });

    expect(verify_compiled_prompt(greenfieldPrompt).valid).toBe(true);

    // Differential Parity Assertions for Director staging requirements
    // Both prompts enforce JSON mode and include director notes and dynamics deltas
    expect(legacyDirector).toContain("directors_note");
    expect(legacyDirector).toContain("dynamics_deltas");
    expect(greenfieldPrompt).toContain('OUTPUT_FORMAT mode="json"');
    expect(greenfieldPrompt).toContain("directors_note");
    expect(greenfieldPrompt).toContain("dynamics_deltas");
  });
});
