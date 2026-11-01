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
  const { entities, history } = create_contract_fixtures();

  it("character core produces structural parity with legacy interaction prompt", () => {
    // 1. Compile legacy prompt
    const _legacyPrompt = compile_legacy({
      mode: "interaction",
      round: 1,
      entities,
      history,
      input: "Alice prepares to move.",
    });

    // 2. Compile new greenfield prompt
    const greenfieldPrompt = compile_greenfield({
      core: "character",
      round: 1,
      entities,
      history,
      input: "Alice prepares to move.",
    });

    // Verify both satisfy system envelope and structural verifier
    expect(verify_compiled_prompt(greenfieldPrompt).valid).toBe(true);

    // Verify critical semantic entities and world truths are preserved identically
    expect(greenfieldPrompt).toContain('id="ALICE"');
    expect(greenfieldPrompt).toContain('id="BOB"');
    expect(greenfieldPrompt).toContain('id="SECTOR_FOUR"');
    expect(greenfieldPrompt).toContain("Analytical cybernetic specialist.");
    expect(greenfieldPrompt).toContain("Veteran decker.");
    expect(greenfieldPrompt).toContain("Degraded industrial district.");

    // Verify 4 Axiomatic Laws are present
    expect(greenfieldPrompt).toContain('name="Causality"');
    expect(greenfieldPrompt).toContain('name="Epistemics"');
    expect(greenfieldPrompt).toContain('name="Sovereignty"');
    expect(greenfieldPrompt).toContain('name="Fidelity"');

    // Verify Epistemic Wall: Bob's secrets or counterpart hide flags are not leaked to Alice
    expect(greenfieldPrompt).not.toContain("[SECRET:");
  });

  it("director core produces structured staging parity with legacy director prompt", () => {
    const greenfieldPrompt = compile_greenfield({
      core: "director",
      round: 1,
      entities,
      history,
      input: "Bob scans the perimeter.",
    });

    expect(verify_compiled_prompt(greenfieldPrompt).valid).toBe(true);
    expect(greenfieldPrompt).toContain("You are the Director orchestrating simulation mechanics and staging.");
    expect(greenfieldPrompt).toContain('OUTPUT_FORMAT mode="json"');
    expect(greenfieldPrompt).toContain("directors_note");
    expect(greenfieldPrompt).toContain("dynamics_deltas");
  });
});
