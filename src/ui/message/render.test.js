/**
 * src/ui/message/render.test.js
 * 🧪 MESSAGE RENDERING TESTS
 * Tests for wrap_dialogue and parse_message rendering pipeline.
 */

import { describe, expect, it } from "vitest";
import { parse_message, wrap_dialogue } from "./render.js";

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

  it("should sanitize leaking &quot; and &apos; XML entities before wrapping dialogue", () => {
    const input = "Orion said, &quot;I&apos;m fine.&quot;";
    const { displayText } = parse_message(input);
    expect(displayText).toBe('<p>Orion said, <span class="dialogue">&ldquo;I\'m fine.&rdquo;</span></p>');
  });
});
