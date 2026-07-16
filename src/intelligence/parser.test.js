import {
  clean_image_prompts,
  escapeXml,
  strip_cognition_blocks,
  parse_think_block,
  parse_message,
  wrap_dialogue,
  escape_unescaped_json_quotes,
} from "./parser.js";
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

describe("parse_think_block", () => {
  it("should parse a single complete think block", () => {
    const result = parse_think_block("<think>Hello</think> World");
    expect(result.think).toBe("Hello");
    expect(result.content).toBe(" World");
  });

  it("should merge multiple complete think blocks", () => {
    const result = parse_think_block("<think>First</think>\nText\n<think>Second</think> More text");
    expect(result.think).toBe("First\n\nSecond");
    expect(result.content).toBe("\nText\n More text");
  });

  it("should merge complete blocks and a streaming unclosed block", () => {
    const result = parse_think_block("<think>Director</think>\n\n<think>Actor starting...");
    expect(result.think).toBe("Director\n\nActor starting...");
    expect(result.content).toBe("\n\n");
  });

  it("should handle only an unclosed block", () => {
    const result = parse_think_block("<think>Streaming only");
    expect(result.think).toBe("Streaming only");
    expect(result.content).toBe("");
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
    expect(escapeXml(input)).toBe(input);
  });
});

describe("wrap_dialogue", () => {
  it("should wrap double quotes in span.dialogue tags and convert to curly quotes", () => {
    const input = 'Hello "World" text';
    const expected = 'Hello <span class="dialogue">&ldquo;World&rdquo;</span> text';
    expect(wrap_dialogue(input)).toBe(expected);
  });

  it("should handle nested HTML tags inside quotes properly without corrupting them", () => {
    const input = 'Hello "World <em>italic</em> text" test';
    const expected = 'Hello <span class="dialogue">&ldquo;World <em>italic</em> text&rdquo;</span> test';
    expect(wrap_dialogue(input)).toBe(expected);
  });

  it("should auto-close unclosed quotes at the end of the string", () => {
    const input = 'Hello "World';
    const expected = 'Hello <span class="dialogue">&ldquo;World</span>';
    expect(wrap_dialogue(input)).toBe(expected);
  });

  it("should skip quotes inside tag attributes", () => {
    const input = '<p class="active">Hello "World"</p>';
    const expected = '<p class="active">Hello <span class="dialogue">&ldquo;World&rdquo;</span></p>';
    expect(wrap_dialogue(input)).toBe(expected);
  });
});

describe("parse_message updated behavior", () => {
  it("should parse markdown and wrap dialogue", () => {
    const input = 'Orion twitched. "Hey *twink*."';
    const { displayText } = parse_message(input);
    expect(displayText).toBe('<p>Orion twitched. <span class="dialogue">&ldquo;Hey <em>twink</em>.&rdquo;</span></p>');
  });
});

describe("escape_unescaped_json_quotes", () => {
  it("should escape unescaped interior double-quotes in JSON strings", () => {
    const input = `{ "mutations": { "AI_CHARACTER": { "present_append_physical": "He said "Hello" to me" } } }`;
    const expected = `{ "mutations": { "AI_CHARACTER": { "present_append_physical": "He said \\"Hello\\" to me" } } }`;
    expect(escape_unescaped_json_quotes(input)).toBe(expected);
  });

  it("should leave already escaped quotes untouched", () => {
    const input = `{ "mutations": { "AI_CHARACTER": { "present_append_physical": "He said \\"Hello\\" to me" } } }`;
    expect(escape_unescaped_json_quotes(input)).toBe(input);
  });

  it("should handle nested commas inside quotes correctly by not stopping at them", () => {
    const input = `{ "mutations": { "AI_CHARACTER": { "present_append_physical": "He said "Hello, friend" to me", "resolve_vectors": [] } } }`;
    const expected = `{ "mutations": { "AI_CHARACTER": { "present_append_physical": "He said \\"Hello, friend\\" to me", "resolve_vectors": [] } } }`;
    expect(escape_unescaped_json_quotes(input)).toBe(expected);
  });

  it("should handle unescaped quotes with trailing braces or brackets", () => {
    const input = `{ "directive": "Say "hello"" }`;
    const expected = `{ "directive": "Say \\"hello\\"" }`;
    expect(escape_unescaped_json_quotes(input)).toBe(expected);
  });
});

describe("parse_message XML entity sanitization pass", () => {
  it("should sanitize leaking &quot; and &apos; XML entities before wrapping dialogue", () => {
    const input = "Orion said, &quot;I&apos;m fine.&quot;";
    const { displayText } = parse_message(input);
    expect(displayText).toBe('<p>Orion said, <span class="dialogue">&ldquo;I\'m fine.&rdquo;</span></p>');
  });
});
