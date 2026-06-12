import { clean_image_prompts, escapeXml, strip_cognition_blocks } from "@intelligence";
import { describe, expect, it } from "vitest";

describe("strip_cognition_blocks", () => {
  it("should remove <think> blocks and trailing newlines", () => {
    const input = "Before\n<think>\nInner thought\n</think>\nAfter";
    const expected = "Before\nAfter";
    expect(strip_cognition_blocks(input)).toBe(expected);
  });

  it("should handle multiple <think> blocks", () => {
    const input = "<think>first</think>\nHello\n<think>second</think>World";
    const expected = "Hello\nWorld";
    expect(strip_cognition_blocks(input)).toBe(expected);
  });

  it("should return empty string for null or undefined", () => {
    expect(strip_cognition_blocks(/** @type {any} */ (null))).toBe("");
    expect(strip_cognition_blocks(/** @type {any} */ (undefined))).toBe("");
  });

  it("should handle empty <think> blocks", () => {
    const input = "A<think></think>B";
    const expected = "AB";
    expect(strip_cognition_blocks(input)).toBe(expected);
  });

  it("should handle text without <think> blocks", () => {
    const input = "Just regular text.";
    expect(strip_cognition_blocks(input)).toBe(input);
  });
});

describe("clean_image_prompts", () => {
  const testCases = [
    { description: "null input", input: /** @type {any} */ (null), expected: "" },
    { description: "undefined input", input: /** @type {any} */ (undefined), expected: "" },
    { description: "an empty string", input: "", expected: "" },
    {
      description: "text with no prompts",
      input: "Just some normal text with no prompts.",
      expected: "Just some normal text with no prompts.",
    },
    {
      description: "a standard <image_prompt> block",
      input: "Hello <image_prompt>a cat</image_prompt> world",
      expected: "Hello  world",
    },
    {
      description: "a self-closing <image_prompt /> tag",
      input: "Hello <image_prompt /> world",
      expected: "Hello  world",
    },
    {
      description: "a self-closing tag with attributes",
      input: 'Hello <image_prompt src="cat.png" alt="A cat" /> world',
      expected: "Hello  world",
    },
    {
      description: "multiple image prompts",
      input: "Start <image_prompt>one</image_prompt> middle <image_prompt /> end",
      expected: "Start  middle  end",
    },
    {
      description: "newlines inside the image prompt tag",
      input: "Line 1\n<image_prompt>\na cute\ncat\n</image_prompt>\nLine 2",
      expected: "Line 1\n\nLine 2",
    },
    {
      description: "case-insensitive tags",
      input: "Hello <IMAGE_PROMPT>cat</Image_Prompt> world <Image_Prompt />",
      expected: "Hello  world ",
    },
    {
      description: "tags with extra whitespace",
      input: "Test <image_prompt    >content</image_prompt   > test2 <image_prompt   />",
      expected: "Test  test2 ",
    },
    {
      description: "a non-self-closing tag with attributes",
      input: 'Hello <image_prompt src="cat.png" alt="A cat">cute cat</image_prompt> world',
      expected: "Hello  world",
    },
    {
      description: "nested image prompts",
      input: "Start <image_prompt>Outer <image_prompt>Inner</image_prompt> Outer-End</image_prompt> End",
      expected: "Start  End",
    },
    {
      description: "markdown image syntax",
      input: "Hello ![alt text](https://example.com/image.png) world",
      expected: "Hello  world",
    },
    {
      description: "a standard <image> block",
      input: "Hello <image>a cute cat</image> world",
      expected: "Hello  world",
    },
    {
      description: "nested <image> tags",
      input: "Outer <image>Inner <image>deep</image> post-inner</image> End",
      expected: "Outer  End",
    },
    {
      description: "tags with '>' in attributes correctly",
      input: 'Hello <image_prompt alt="quoted > bracket">content</image_prompt> world',
      expected: "Hello  world",
    },
    {
      description: "self-closing tags with '>' in attributes",
      input: 'Hello <image_prompt alt="quoted > bracket" /> world',
      expected: "Hello  world",
    },
    {
      description: "tags that just start with image_prompt but are different",
      input: "Keep <image_prompt_metadata>data</image_prompt_metadata> this",
      expected: "Keep <image_prompt_metadata>data</image_prompt_metadata> this",
    },
    {
      description: "malformed unclosed tags",
      input: "Hello <image_prompt> unclosed tag",
      expected: "Hello <image_prompt> unclosed tag",
    },
    {
      description: "malformed self-closing tags",
      input: "Hello <image_prompt world",
      expected: "Hello <image_prompt world",
    },
  ];
  it.each(testCases)("should handle $description", ({ input, expected }) => expect(clean_image_prompts(input)).toBe(expected));
});

describe("text-parser: escapeXml", () => {
  it("should escape basic XML special characters including single quotes", () => {
    const input = "This & that 'quoted' \"quoted\" <tag>";
    const expected = "This &amp; that &apos;quoted&apos; &quot;quoted&quot; &lt;tag&gt;";
    expect(escapeXml(input)).toBe(expected);
  });

  it("should escape square brackets to prevent injection/misinterpretation", () => {
    const input = "[VstartWith: content]";
    const expected = "&#91;VstartWith: content&#93;";
    expect(escapeXml(input)).toBe(expected);
  });

  it("should handle empty or null input gracefully", () => {
    expect(escapeXml(/** @type {any} */ (null))).toBe("");
    expect(escapeXml(/** @type {any} */ (undefined))).toBe("");
    expect(escapeXml("")).toBe("");
  });

  it("should NOT trim the input", () => {
    const input = "  content  ";
    expect(escapeXml(input)).toBe("  content  ");
  });

  it("should handle multi-line strings", () => {
    const input = "line 1\nline 2";
    expect(escapeXml(input)).toBe("line 1\nline 2");
  });
});
