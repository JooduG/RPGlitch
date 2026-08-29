import { describe, expect, it } from "vitest";
import { parse_markdown } from "./markdown.js";

describe("parse_markdown", () => {
  it("returns an empty array for empty, null, undefined, or whitespace-only inputs", () => {
    expect(parse_markdown("")).toEqual([]);
    expect(parse_markdown(null)).toEqual([]);
    expect(parse_markdown(undefined)).toEqual([]);
    expect(parse_markdown("   \n\n   ")).toEqual([]);
  });

  it("parses plain text without inline markdown markers", () => {
    const result = parse_markdown("Hello world");
    expect(result).toEqual([[{ type: "text", content: "Hello world" }]]);
  });

  it("splits multiple paragraphs separated by double newlines", () => {
    const text = "First paragraph line 1.\nFirst paragraph line 2.\n\nSecond paragraph.";
    const result = parse_markdown(text);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([{ type: "text", content: "First paragraph line 1. First paragraph line 2." }]);
    expect(result[1]).toEqual([{ type: "text", content: "Second paragraph." }]);
  });

  it("parses bold (**strong**) tokens", () => {
    const result = parse_markdown("This is **important** info.");
    expect(result).toEqual([
      [
        { type: "text", content: "This is " },
        { type: "strong", content: "important" },
        { type: "text", content: " info." },
      ],
    ]);
  });

  it("parses italic (*em*) tokens", () => {
    const result = parse_markdown("A *whisper* in the dark.");
    expect(result).toEqual([
      [
        { type: "text", content: "A " },
        { type: "em", content: "whisper" },
        { type: "text", content: " in the dark." },
      ],
    ]);
  });

  it("parses bold-italic (***strong-em***) tokens", () => {
    const result = parse_markdown("A ***critical alert*** sounded.");
    expect(result).toEqual([
      [
        { type: "text", content: "A " },
        { type: "strong-em", content: "critical alert" },
        { type: "text", content: " sounded." },
      ],
    ]);
  });

  it('parses dialogue quote ("speech") tokens', () => {
    const result = parse_markdown('She whispered, "Stay alert."');
    expect(result).toEqual([
      [
        { type: "text", content: "She whispered, " },
        { type: "quote", content: "Stay alert." },
      ],
    ]);
  });

  it("parses complex mixed tokens within a single paragraph", () => {
    const text = 'She said, "Look at ***this***!" while **running** into the *woods*.';
    const result = parse_markdown(text);
    expect(result).toEqual([
      [
        { type: "text", content: "She said, " },
        { type: "quote", content: "Look at ***this***!" },
        { type: "text", content: " while " },
        { type: "strong", content: "running" },
        { type: "text", content: " into the " },
        { type: "em", content: "woods" },
        { type: "text", content: "." },
      ],
    ]);
  });

  it("converts non-string inputs to string before parsing", () => {
    // @ts-ignore
    const result = parse_markdown(12345);
    expect(result).toEqual([[{ type: "text", content: "12345" }]]);
  });
});
