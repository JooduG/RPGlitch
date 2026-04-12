import { describe, it, expect } from "vitest";
import {
  parse_scene_header,
  clean_image_prompts,
  escapeXml,
  strip_cognition_blocks,
} from "./text-parser.js";

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
    expect(strip_cognition_blocks(null)).toBe("");
    expect(strip_cognition_blocks(undefined)).toBe("");
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
    { description: "null input", input: null, expected: "" },
    { description: "undefined input", input: undefined, expected: "" },
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
      input:
        "Start <image_prompt>Outer <image_prompt>Inner</image_prompt> Outer-End</image_prompt> End",
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
  it.each(testCases)("should handle $description", ({ input, expected }) => {
    expect(clean_image_prompts(input)).toBe(expected);
  });
});

describe("parse_scene_header", () => {
  it("should parse a standard scene header", () => {
    const text = "『 [Dark Forest] · [Midnight] · [Raining] 』\nThe rest of the content.";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "The rest of the content.",
      header: {
        location: "Dark Forest",
        time: "Midnight",
        weather: "Raining",
      },
    });
  });
  it("should return null header if the format doesn't match", () => {
    const text = "[Dark Forest] - [Midnight] - [Raining]\nThe rest of the content.";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "[Dark Forest] - [Midnight] - [Raining]\nThe rest of the content.",
      header: null,
    });
  });
  it("should return empty content and null header for empty input", () => {
    expect(parse_scene_header(null)).toEqual({ content: "", header: null });
    expect(parse_scene_header(undefined)).toEqual({
      content: "",
      header: null,
    });
    expect(parse_scene_header("")).toEqual({ content: "", header: null });
  });
  it("should handle a header with no content after it", () => {
    const text = "『 [Location] · [Time] · [Weather] 』";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "",
      header: {
        location: "Location",
        time: "Time",
        weather: "Weather",
      },
    });
  });
  it("should handle extra whitespace gracefully", () => {
    const text = "『   [ Location ]  ·  [ Time ]  ·  [ Weather ]   』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Content",
      header: {
        location: "Location",
        time: "Time",
        weather: "Weather",
      },
    });
  });
  it("should return null header if header is missing brackets", () => {
    const text = "『 Location · Time · Weather 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "『 Location · Time · Weather 』\nContent",
      header: null,
    });
  });
  it("should parse a header with empty brackets", () => {
    const text = "『 [] · [] · [] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Content",
      header: {
        location: "",
        time: "",
        weather: "",
      },
    });
  });
  it("should return null header if sections are missing", () => {
    const text = "『 [Location] · [Time] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "『 [Location] · [Time] 』\nContent",
      header: null,
    });
  });
  it("should return null header if brackets are malformed", () => {
    const text = "『 [Location · [Time] · [Weather] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "『 [Location · [Time] · [Weather] 』\nContent",
      header: null,
    });
  });
  it("should return null header if the header is not at the start of the text", () => {
    const text = "Some text before 『 [Location] · [Time] · [Weather] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Some text before 『 [Location] · [Time] · [Weather] 』\nContent",
      header: null,
    });
  });
  it("should return null header if there are leading spaces before the header", () => {
    const text = "   『 [Location] · [Time] · [Weather] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "   『 [Location] · [Time] · [Weather] 』\nContent",
      header: null,
    });
  });
  it("should handle unicode and special characters inside brackets", () => {
    const text = "『 [東京 🗼] · [23:00 / 夜] · [嵐 (Storm)] 』\nJapanese Content";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Japanese Content",
      header: {
        location: "東京 🗼",
        time: "23:00 / 夜",
        weather: "嵐 (Storm)",
      },
    });
  });
  it("should return null header if separator is missing or wrong", () => {
    const text = "『 [Location] - [Time] - [Weather] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "『 [Location] - [Time] - [Weather] 』\nContent",
      header: null,
    });
  });
  it("should return null header for a missing opening bracket", () => {
    const text = "『 [Location] · Time] · [Weather] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "『 [Location] · Time] · [Weather] 』\nContent",
      header: null,
    });
  });
  it("should return null header if missing closing corner bracket", () => {
    const text = "『 [Location] · [Time] · [Weather] \nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "『 [Location] · [Time] · [Weather] \nContent",
      header: null,
    });
  });
  it("should handle multiline content in the rest of the text", () => {
    const text = "『 [Location] · [Time] · [Weather] 』\nLine 1\nLine 2\nLine 3";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Line 1\nLine 2\nLine 3",
      header: {
        location: "Location",
        time: "Time",
        weather: "Weather",
      },
    });
  });
  it("should handle brackets containing only spaces", () => {
    const text = "『 [   ] · [   ] · [   ] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Content",
      header: {
        location: "",
        time: "",
        weather: "",
      },
    });
  });
  it("should parse correctly with absolutely no extra spaces around tokens", () => {
    const text = "『[Location]·[Time]·[Weather]』Content";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Content",
      header: {
        location: "Location",
        time: "Time",
        weather: "Weather",
      },
    });
  });
  it("should return null header if text is just spaces", () => {
    const text = "    ";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "    ",
      header: null,
    });
  });
  it("should return null header if one bracket is missing entirely", () => {
    const text = "『 [Location] · [Time] ·  』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "『 [Location] · [Time] ·  』\nContent",
      header: null,
    });
  });
  it("should handle completely empty text input without breaking", () => {
    const text = "";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "",
      header: null,
    });
  });
  it("should handle empty or whitespace-only values within header brackets", () => {
    const text = "『 [ ] · [  ] · [] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Content",
      header: {
        location: "",
        time: "",
        weather: "",
      },
    });
  });
});

describe("parse_scene_header additional edge cases", () => {
  it("should handle completely empty header structure without brackets", () => {
    const text = "『 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "『 』\nContent",
      header: null,
    });
  });
  it("should handle headers where inner contents contain the separator character", () => {
    const text = "『 [City · Center] · [12:00] · [Clear] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Content",
      header: {
        location: "City · Center",
        time: "12:00",
        weather: "Clear",
      },
    });
  });
  it("should handle headers where inner contents contain brackets", () => {
    const text = "『 [Area [51]] · [Time [Unknown]] · [Weather [Redacted]] 』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Content",
      header: {
        location: "Area [51]",
        time: "Time [Unknown]",
        weather: "Weather [Redacted]",
      },
    });
  });
  it("should handle different types of whitespace (newlines, tabs) within the header", () => {
    const text = "『\t[\nLocation\n]\t·\t[\tTime\t]\n·\t[\nWeather\n]\t』\nContent";
    const result = parse_scene_header(text);
    expect(result).toEqual({
      content: "Content",
      header: {
        location: "Location",
        time: "Time",
        weather: "Weather",
      },
    });
  });
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
    expect(escapeXml(null)).toBe("");
    expect(escapeXml(undefined)).toBe("");
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
