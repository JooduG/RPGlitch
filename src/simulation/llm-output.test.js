import { describe, expect, it } from "vitest";
import { parse_think_block, safe_parse_json, strip_cognition_blocks } from "./llm-output.js";
import { resolve_style } from "@utils";

describe("resolve_style (pure, no bridge)", () => {
  const registry = { monochrome: { id: "monochrome" }, none: { id: "none" } };
  it("prefers the explicit style", () => {
    expect(resolve_style("monochrome", "other", registry, "none")).toBe("monochrome");
  });
  it("falls back to the caller-provided app value", () => {
    expect(resolve_style(null, "monochrome", registry, "none")).toBe("monochrome");
  });
  it("returns fallback when nothing matches", () => {
    expect(resolve_style(null, null, registry, "none")).toBe("none");
  });
  it("treats 'default' as unset", () => {
    expect(resolve_style("default", "default", registry, "none")).toBe("none");
  });
});

describe("strip_cognition_blocks", () => {
  it("removes think blocks", () => {
    expect(strip_cognition_blocks("before <think>hidden</think> after")).toContain("before");
    expect(strip_cognition_blocks("before <think>hidden</think> after")).toContain("after");
    expect(strip_cognition_blocks("before <think>hidden</think> after")).not.toContain("hidden");
  });
});

describe("parse_think_block", () => {
  it("splits think and prose", () => {
    const parsed = parse_think_block("<think>planning</think>Action time.");
    expect(parsed.think).toContain("planning");
    expect(parsed.prose).toContain("Action time.");
  });
  it("returns empty think (never null) for plain prose", () => {
    const parsed = parse_think_block("Just prose.");
    expect(parsed.think).toBe("");
    expect(parsed.prose).toContain("Just prose.");
  });
});

describe("safe_parse_json", () => {
  it("extracts embedded JSON object from surrounding text", () => {
    const raw = `Here is your prompt: {"prompt": "cyberpunk alley", "negative_prompt": "blurry"} Hope you like it!`;
    expect(safe_parse_json(raw)).toEqual({ prompt: "cyberpunk alley", negative_prompt: "blurry" });
  });

  it("extracts embedded JSON array from surrounding text", () => {
    const raw = `Available targets: ["solo_entity", "story_scene"]`;
    expect(safe_parse_json(raw)).toEqual(["solo_entity", "story_scene"]);
  });

  it("returns null for non-JSON or invalid input", () => {
    expect(safe_parse_json("just text")).toBeNull();
    expect(safe_parse_json("")).toBeNull();
    expect(safe_parse_json(null)).toBeNull();
    expect(safe_parse_json("{ broken json ")).toBeNull();
  });

  it("handles startWith prefix option when model continues prefill", () => {
    const decapitated = 'thinking", "prompt": "neon city", "negative_prompt": "blurry"}';
    const prefix = '{"_thought_process": "';
    expect(safe_parse_json(decapitated, { prefix })).toEqual({ _thought_process: "thinking", prompt: "neon city", negative_prompt: "blurry" });
  });
});

describe("strip_cognition_blocks (extended)", () => {
  it("removes think tags and internal monologue from text", () => {
    expect(strip_cognition_blocks("<think>Planning next turn...</think>Hello world.")).toBe("Hello world.");
    expect(strip_cognition_blocks("Before <think>secret thought</think> After")).toBe("Before  After");
  });

  it("handles dangling closing think tags and model artifact prefixes", () => {
    expect(strip_cognition_blocks("Prose content.</think>")).toBe("Prose content.");
    expect(strip_cognition_blocks("Mattis. Archetypes: Hero\nReal story begins.")).toBe("Real story begins.");
  });

  it("strips leaked DYNAMICS state blocks that leaked into prose", () => {
    expect(strip_cognition_blocks("<DYNAMICS>\n  Chaos: 60 -> 58 (-2)\n  Intensity: 65 -> 70 (+5)\n</DYNAMICS>\n\nThe white light is too loud.")).toBe(
      "The white light is too loud.",
    );
    expect(strip_cognition_blocks("Stray <DYNAMICS> tag here.")).toBe("Stray");
    expect(strip_cognition_blocks("Stray </DYNAMICS> tag here.")).toBe("Stray  tag here.");
  });

  it("handles null or empty inputs", () => {
    expect(strip_cognition_blocks(null)).toBe("");
    expect(strip_cognition_blocks("")).toBe("");
  });
});
