import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitize_llm } from "./transport.js";

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    escape_xml: vi.fn((s) => s),
    stream_bridge: { start: vi.fn(), update: vi.fn(), end: vi.fn() },
    collapse_history: vi.fn(),
  };
});

describe("sanitize_llm", () => {
  it("returns an empty string for empty input", () => {
    expect(sanitize_llm("")).toBe("");
    expect(sanitize_llm(null)).toBe("");
    expect(sanitize_llm(undefined)).toBe("");
  });

  it("preserves a closing double quote from dialogue at message end", () => {
    const input = 'She smiled and turned away. "We\'ll see."';
    expect(sanitize_llm(input)).toBe(input);
  });

  it("preserves a closing single quote from dialogue at message end", () => {
    const input = "He dropped his voice. 'Doubt it, love.'";
    expect(sanitize_llm(input)).toBe(input);
  });

  it("preserves a closing quote even when the line is a bare trailing dialogue beat", () => {
    const input = 'The door creaked open. "...so you came after all."';
    expect(sanitize_llm(input)).toBe(input);
  });

  it("preserves paired outer quotes (whole-message dialogue)", () => {
    const input = '"Even now, I remember the exact color of your coat."';
    expect(sanitize_llm(input)).toBe(input);
  });

  it("strips an unmatched leading quote artifact", () => {
    expect(sanitize_llm('"Here is your response: the sky is blue')).toBe("Here is your response: the sky is blue");
    expect(sanitize_llm("'A stray opening quote artifact")).toBe("A stray opening quote artifact");
  });

  it("does not corrupt a lone quote character", () => {
    expect(sanitize_llm('"')).toBe('"');
    expect(sanitize_llm("'")).toBe("'");
  });

  it("still strips conversational filler prefixes", () => {
    expect(sanitize_llm("Sure, here is your answer: The vault is sealed.")).toBe("The vault is sealed.");
    expect(sanitize_llm("Certainly: Step inside.")).toBe("Step inside.");
  });

  it("still strips code fences", () => {
    const input = "```js\nconst x = 1;\n```";
    expect(sanitize_llm(input)).toBe("const x = 1;");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitize_llm("   hello world   ")).toBe("hello world");
  });
});
