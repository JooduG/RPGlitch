import {
  clean_image_prompts,
  escape_xml,
  strip_cognition_blocks,
  parse_think_block,
  safe_parse_pseudo_json,
} from "./parser.js";
import { parse_message, wrap_dialogue } from "../ui/message/render.js";
import { NARRATIVE_STYLES, resolve_voice_register } from "@data";
import { escape_unescaped_json_quotes, merge_prose_into_field } from "@utils";
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

  it("should strip stray </think> closures that appear after the think block already closed", () => {
    const input =
      "<think>Inner thought</think>\n\nThe corridors are quiet.\n\nThe two figures stop. The silence is one of mutual realization.</think>";
    const expected = "The corridors are quiet.\n\nThe two figures stop. The silence is one of mutual realization.";
    expect(strip_cognition_blocks(input)).toBe(expected);
  });

  it("should strip a lone </think> with no think block at all", () => {
    expect(strip_cognition_blocks("Just prose.</think>")).toBe("Just prose.");
  });

  it("should strip Mattis prefix anchor without deleting body text on single-line or multi-line responses", () => {
    const input_single = "Mattis. {{me}} is an earnest, hyper-masculine protector.";
    expect(strip_cognition_blocks(input_single)).toBe("{{me}} is an earnest, hyper-masculine protector.");

    const input_multi = "Mattis. Archetypes: The Titan. Vocabulary: Gains.\n\nThe character state description.";
    expect(strip_cognition_blocks(input_multi)).toBe("The character state description.");
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
  const test_cases = [
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
  it.each(test_cases)("should handle $description", ({ input, expected }) => expect(clean_image_prompts(input)).toBe(expected));
});

describe("text-parser: escape_xml", () => {
  it("should escape basic XML special characters including single quotes", () => {
    const input = "This & that 'quoted' \"quoted\" <tag>";
    const expected = "This &amp; that &apos;quoted&apos; &quot;quoted&quot; &lt;tag&gt;";
    expect(escape_xml(input)).toBe(expected);
  });

  it("should escape square brackets to prevent injection/misinterpretation", () => {
    const input = "[VstartWith: content]";
    const expected = "&#91;VstartWith: content&#93;";
    expect(escape_xml(input)).toBe(expected);
  });

  it("should handle empty or null input gracefully", () => {
    expect(escape_xml(/** @type {any} */ (null))).toBe("");
    expect(escape_xml(/** @type {any} */ (undefined))).toBe("");
    expect(escape_xml("")).toBe("");
  });

  it("should NOT trim the input", () => {
    const input = "  content  ";
    expect(escape_xml(input)).toBe("  content  ");
  });

  it("should handle multi-line strings", () => {
    const input = "line 1\nline 2";
    expect(escape_xml(input)).toBe(input);
  });

  it("snake_case escape_xml should produce identical results", () => {
    const input = "This & that [bracket] <tag>";
    expect(escape_xml(input)).toBe(escape_xml(input));
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

describe("resolve_voice_register hierarchy", () => {
  it("should prioritize character voice_register over narrative style", () => {
    const entity = { voice_register: "plain" };
    const style = NARRATIVE_STYLES.edgar_allan_poe.id; // poe defaults to ornate
    expect(resolve_voice_register(entity, style)).toBe("plain");
  });

  it("should prioritize character ornate register over plain narrative style", () => {
    const entity = { voice_register: "ornate" };
    const style = NARRATIVE_STYLES.cormac_mccarthy.id; // mccarthy defaults to plain
    expect(resolve_voice_register(entity, style)).toBe("ornate");
  });

  it("should fall back to narrative style register when character voice_register is empty", () => {
    const entity = { voice_register: "" };
    expect(resolve_voice_register(entity, NARRATIVE_STYLES.edgar_allan_poe.id)).toBe("ornate");
    expect(resolve_voice_register(entity, NARRATIVE_STYLES.cormac_mccarthy.id)).toBe("plain");
  });

  it("should default to plain when neither character nor narrative style has a voice register", () => {
    expect(resolve_voice_register(null, null)).toBe("plain");
    expect(resolve_voice_register({}, "default")).toBe("plain");
  });
});

describe("escape_unescaped_json_quotes", () => {
  it("should escape unescaped interior double-quotes in JSON strings", () => {
    const input = `{ "mutations": { "AI_CHARACTER": { "state_append": "He said "Hello" to me" } } }`;
    const expected = `{ "mutations": { "AI_CHARACTER": { "state_append": "He said \\"Hello\\" to me" } } }`;
    expect(escape_unescaped_json_quotes(input)).toBe(expected);
  });

  it("should leave already escaped quotes untouched", () => {
    const input = `{ "mutations": { "AI_CHARACTER": { "state_append": "He said \\"Hello\\" to me" } } }`;
    expect(escape_unescaped_json_quotes(input)).toBe(input);
  });

  it("should handle nested commas inside quotes correctly by not stopping at them", () => {
    const input = `{ "mutations": { "AI_CHARACTER": { "state_append": "He said "Hello, friend" to me", "vector_resolve": [] } } }`;
    const expected = `{ "mutations": { "AI_CHARACTER": { "state_append": "He said \\"Hello, friend\\" to me", "vector_resolve": [] } } }`;
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

describe("safe_parse_pseudo_json", () => {
  it("should parse bracketed [HEADLINE: item] syntax", () => {
    const input = "[EXPRESSION: grizzled cynical smirk] [SHIRT: grease-stained tank top]";
    const result = safe_parse_pseudo_json(input);
    expect(result).toEqual({
      EXPRESSION: "grizzled cynical smirk",
      SHIRT: "grease-stained tank top",
    });
  });

  it("should parse multi-line bracketed [HEADLINE: item] syntax", () => {
    const input = "[EXPRESSION: grizzled cynical smirk]\n[SHIRT: grease-stained tank top]\n[HARDWARE: hydraulic prosthetic arm]";
    const result = safe_parse_pseudo_json(input);
    expect(result).toEqual({
      EXPRESSION: "grizzled cynical smirk",
      SHIRT: "grease-stained tank top",
      HARDWARE: "hydraulic prosthetic arm",
    });
  });

  it("should return raw-prose sentinel for regular prose containing colons", () => {
    const input = "Beneath his playful teasing: lies a sharp wound.";
    const result = safe_parse_pseudo_json(input);
    expect(result).toEqual({ __raw_prose__: "Beneath his playful teasing: lies a sharp wound." });
  });

  it("should aggregate repeated INVENTORY brackets into a normalized list", () => {
    const input = "[INVENTORY: white greasy tank-top] [INVENTORY: plasma pistol] [INVENTORY: copper key]";
    const result = safe_parse_pseudo_json(input);
    expect(result.INVENTORY).toEqual(["white greasy tank-top", "plasma pistol", "copper key"]);
  });

  it("should split comma-separated INVENTORY values into a normalized list", () => {
    const result = safe_parse_pseudo_json("[INVENTORY: copper key, plasma pistol]");
    expect(result.INVENTORY).toEqual(["copper key", "plasma pistol"]);
  });

  it("should aggregate STASH alongside INVENTORY", () => {
    const result = safe_parse_pseudo_json("[INVENTORY: copper key] [STASH: old maps] [INVENTORY: rope]");
    expect(result.INVENTORY).toEqual(["copper key", "rope"]);
    expect(result.STASH).toEqual(["old maps"]);
  });

  it("should universally drop keys carrying clear tokens", () => {
    const result = safe_parse_pseudo_json("[HELD: plasma gun] [HELD: none]");
    expect(result.HELD).toBeUndefined();
  });
});

describe("merge_prose_into_field", () => {
  it("should update matching pseudo-JSON keys and keep CONDITION text clean when prose contains KEY: directives", () => {
    const current = "[SHIRT: grease-stained tank top] [CONDITION: Reciprocating drive cycling faster]";
    const new_prose = "CLOTHING: Tank top discarded on the floor";
    const merged = merge_prose_into_field(current, new_prose);
    expect(merged).toBe("[SHIRT: Tank top discarded on the floor] [CONDITION: Reciprocating drive cycling faster]");
  });

  it("should append unstructured prose to CONDITION without corrupting other tags", () => {
    const current = "[SHIRT: grease-stained tank top] [CONDITION: Heavy breathing]";
    const new_prose = "Sweat trickling down his neck";
    const merged = merge_prose_into_field(current, new_prose);
    expect(merged).toBe("[SHIRT: grease-stained tank top] [CONDITION: Heavy breathing, Sweat trickling down his neck]");
  });

  it("should preserve ROBES and APPAREL when updating EXPRESSION and CONDITION", () => {
    const current = "[ROBES: sheer high-elven scholarly robes] [EXPRESSION: soft deferential gaze] [APPAREL: minimalist coral-rose silk thong]";
    const new_prose = "[EXPRESSION: wide-eyed and flushed] [CONDITION: kneeling in the fog]";
    const merged = merge_prose_into_field(current, new_prose);
    expect(merged).toContain("[ROBES: sheer high-elven scholarly robes]");
    expect(merged).toContain("[APPAREL: minimalist coral-rose silk thong]");
    expect(merged).toContain("[EXPRESSION: wide-eyed and flushed]");
    expect(merged).toContain("[CONDITION: kneeling in the fog]");
  });

  it("should strip specified clothing key when disrobed or removed", () => {
    const current = "[ROBES: sheer high-elven scholarly robes] [APPAREL: minimalist coral-rose silk thong]";
    const new_prose = "[ROBES: removed]";
    const merged = merge_prose_into_field(current, new_prose);
    expect(merged).not.toContain("[ROBES:");
    expect(merged).toContain("[APPAREL: minimalist coral-rose silk thong]");
  });

  it("should overwrite a key directly without string duplication", () => {
    const current = "[SHIRT: white greasy tank-top] [HELD: plasma gun]";
    const merged = merge_prose_into_field(current, "[SHIRT: knitted sweater]");
    expect(merged).toBe("[SHIRT: knitted sweater] [HELD: plasma gun]");
  });

  it("should universally delete any key via [KEY: none]", () => {
    const current = "[SHIRT: tank top] [HELD: plasma gun] [DISGUISE: watch cloak]";
    const merged = merge_prose_into_field(current, "[HELD: none] [DISGUISE: removed]");
    expect(merged).toBe("[SHIRT: tank top]");
  });

  it("should delete non-physical keys via clear tokens", () => {
    const current = "[MOOD: suspicious] [STATUS: hunted] [SECRET: stole the ledger]";
    const merged = merge_prose_into_field(current, "[STATUS: normal] [SECRET: cleared]");
    expect(merged).toBe("[MOOD: suspicious]");
  });

  it("should clear INJURY via [INJURY: healed]", () => {
    const current = "[INJURY: left arm in sling] [HELD: pistol]";
    const merged = merge_prose_into_field(current, "[INJURY: healed]");
    expect(merged).toBe("[HELD: pistol]");
  });

  it("should aggregate repeated INVENTORY brackets into a single list", () => {
    const current = "[SHIRT: tank top] [INVENTORY: copper key]";
    const merged = merge_prose_into_field(current, "[INVENTORY: plasma pistol] [INVENTORY: rope]");
    expect(merged).toBe("[SHIRT: tank top] [INVENTORY: copper key, plasma pistol, rope]");
  });

  it("should support the clothing-to-inventory undressing lifecycle", () => {
    const current = "[SHIRT: white greasy tank-top] [INVENTORY: copper key]";
    const merged = merge_prose_into_field(current, "[SHIRT: none] [INVENTORY: white greasy tank-top]");
    expect(merged).toBe("[INVENTORY: copper key, white greasy tank-top]");
  });

  it("should support zero-hallucination redressing by reading INVENTORY back", () => {
    const current = "[SHIRT: none] [INVENTORY: white greasy tank-top]";
    const merged = merge_prose_into_field(current, "[SHIRT: white greasy tank-top]");
    expect(merged).toContain("[SHIRT: white greasy tank-top]");
    expect(merged).toContain("[INVENTORY: white greasy tank-top]");
  });

  it("should wildcard-purge all CLOTHING_KEYS on [CLOTHING: none]", () => {
    const current = "[SHIRT: tank top] [PANTS: cargo pants] [HELD: gun]";
    const merged = merge_prose_into_field(current, "[CLOTHING: none]");
    expect(merged).toBe("[HELD: gun]");
  });
});
