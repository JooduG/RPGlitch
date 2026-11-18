import { describe, expect, it } from "vitest";
import { parse_think_block, strip_cognition_blocks } from "./llm-output.js";
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
