import { describe, expect, it } from "vitest";
import {
  extract_tag_sequence,
  verify_compiled_prompt,
  verify_prompt_hygiene,
  verify_system_envelope,
  verify_tag_balance,
  verify_tag_order,
} from "./verifier.js";

describe("src/engine/verifier.js - Tag Inventory & Structural Anchor", () => {
  it("extracts XML tags and attributes accurately", () => {
    const prompt = `<SYSTEM round="1"><MAIN_CHARACTER id="ALICE"><PERSONALITY>Brave</PERSONALITY></MAIN_CHARACTER></SYSTEM>`;
    const tags = extract_tag_sequence(prompt);

    expect(tags).toHaveLength(6);
    expect(tags[0]).toEqual({ name: "SYSTEM", is_closing: false, is_self_closing: false, raw: '<SYSTEM round="1">' });
    expect(tags[3]).toEqual({ name: "PERSONALITY", is_closing: true, is_self_closing: false, raw: "</PERSONALITY>" });
  });

  it("validates balanced open and closed tags", () => {
    const valid = `<SYSTEM><REALITY>World</REALITY><TASK>Do it</TASK></SYSTEM>`;
    expect(verify_tag_balance(valid).valid).toBe(true);

    const unclosed = `<SYSTEM><REALITY>World<TASK>Do it</TASK>`;
    const res1 = verify_tag_balance(unclosed);
    expect(res1.valid).toBe(false);
    expect(res1.errors.some((e) => e.includes("Unclosed opening tag <REALITY>"))).toBe(true);

    const mismatched = `<SYSTEM><REALITY>World</SYSTEM>`;
    const res2 = verify_tag_balance(mismatched);
    expect(res2.valid).toBe(false);
    expect(res2.errors[0]).toContain("Mismatched closing tag: expected </REALITY>, but encountered </SYSTEM>");
  });

  it("verifies system envelope boundaries", () => {
    expect(verify_system_envelope("<SYSTEM>Hello</SYSTEM>").valid).toBe(true);
    expect(verify_system_envelope("<PROMPT>Hello</PROMPT>").valid).toBe(false);
    expect(verify_system_envelope("<SYSTEM>Hello").valid).toBe(false);
  });

  it("verifies ordered tag appearance", () => {
    const prompt = `<SYSTEM><REALITY>Truth</REALITY><SCENARIO>Room</SCENARIO><TASK>Goal</TASK></SYSTEM>`;
    const expected = ["SYSTEM", "REALITY", "SCENARIO", "TASK"];
    expect(verify_tag_order(prompt, expected).valid).toBe(true);

    const out_of_order = ["SYSTEM", "SCENARIO", "REALITY", "TASK"];
    const res = verify_tag_order(prompt, out_of_order);
    expect(res.valid).toBe(false);
    expect(res.out_of_order).toContain("REALITY");
  });

  it("detects unparsed mustache macros in prompt hygiene", () => {
    const clean = `<SYSTEM>Alice meets Bob.</SYSTEM>`;
    expect(verify_prompt_hygiene(clean).valid).toBe(true);

    const leaky = `<SYSTEM>Alice meets {{user}}.</SYSTEM>`;
    const res = verify_prompt_hygiene(leaky);
    expect(res.valid).toBe(false);
    expect(res.violations[0]).toContain("{{user}}");
  });

  it("verifies full compiled prompt structure", () => {
    const validPrompt = `<SYSTEM round="1">
      <AXIOMATIC_CONSTITUTION>
        <LAW name="Causality">Ground physics.</LAW>
      </AXIOMATIC_CONSTITUTION>
      <REALITY>World is alive.</REALITY>
      <TASK>Execute beat.</TASK>
    </SYSTEM>`;

    const result = verify_compiled_prompt(validPrompt, { expected_tags: ["SYSTEM", "AXIOMATIC_CONSTITUTION", "REALITY", "TASK"] });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
