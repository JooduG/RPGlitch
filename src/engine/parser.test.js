import { describe, it, expect } from "vitest";
import { extract_think_block, parse_bracket_token, parse_brackets, format_clean_brackets } from "./parser.js";

describe("src/engine/parser.js — Pure Bracket & Streaming Parser", () => {
  it("extracts and strips <think> block from streamed prose", () => {
    const raw = `<think>
1. Intent: Assess the room.
2. Subtext: Suspicion.
</think>
"Step back," Alice says quietly.`;

    const result = extract_think_block(raw);
    expect(result.think).toContain("1. Intent: Assess the room.");
    expect(result.prose).toBe('"Step back," Alice says quietly.');
  });

  it("handles unclosed <think> stream gracefully", () => {
    const stream = `<think>Still planning thoughts...`;
    const result = extract_think_block(stream);
    expect(result.think).toBe("Still planning thoughts...");
    expect(result.prose).toBe("");
  });

  it("parses single bracket token with metadata flags", () => {
    const tokenStr = "[KNIFE: concealed in boot | hide | w: 9 | is_origin]";
    const parsed = parse_bracket_token(tokenStr);

    expect(parsed).toEqual({
      key: "KNIFE",
      value: "concealed in boot",
      flags: {
        hide: true,
        show: false,
        is_origin: true,
        weight: 9,
      },
      raw: tokenStr,
    });
  });

  it("isolates pipes inside {Option A | Option B} from control flags", () => {
    const tokenStr = "[OUTFIT: {wearing a black harness | white silk shirt} | hide | w: 7]";
    const parsed = parse_bracket_token(tokenStr);

    expect(parsed.key).toBe("OUTFIT");
    expect(parsed.value).toBe("{wearing a black harness | white silk shirt}");
    expect(parsed.flags.hide).toBe(true);
    expect(parsed.flags.weight).toBe(7);
  });

  it("extracts multiple brackets from multiline state text", () => {
    const text = `
      [BUILD: tall and athletic]
      [MOOD: cautious]
      [SECRET: knows the cipher | hide]
    `;

    const brackets = parse_brackets(text);
    expect(brackets).toHaveLength(3);
    expect(brackets[0].key).toBe("BUILD");
    expect(brackets[1].key).toBe("MOOD");
    expect(brackets[2].key).toBe("SECRET");
    expect(brackets[2].flags.hide).toBe(true);
  });

  it("filters and formats clean brackets honoring see_hidden & Epistemic Wall", () => {
    const text = `
      [BUILD: tall]
      [GUN: holstered | hide]
    `;

    // Active character sees own hidden bracket
    const ownView = format_clean_brackets(text, { see_hidden: "own", is_counterpart: false });
    expect(ownView).toContain("[BUILD: tall]");
    expect(ownView).toContain("[GUN: holstered]");

    // Counterpart across wall has hidden bracket stripped
    const counterpartView = format_clean_brackets(text, { see_hidden: "own", is_counterpart: true });
    expect(counterpartView).toContain("[BUILD: tall]");
    expect(counterpartView).not.toContain("[GUN: holstered]");

    // Omniscient view sees all
    const omniView = format_clean_brackets(text, { see_hidden: "all", is_counterpart: true });
    expect(omniView).toContain("[GUN: holstered]");

    // Camera/Diffusion view sees none
    const cameraView = format_clean_brackets(text, { see_hidden: "none", is_counterpart: false });
    expect(cameraView).toContain("[BUILD: tall]");
    expect(cameraView).not.toContain("[GUN: holstered]");
  });
});
