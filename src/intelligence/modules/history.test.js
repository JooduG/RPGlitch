/**
 * src/intelligence/modules/history.test.js
 * ============================================================================
 * 🧪 UNIT TESTS: History Module — Turn History & Episodic Milestones
 * ============================================================================
 *
 * Verifies the token-optimized history formatting contracts:
 * 1. resolve_history configuration resolver
 * 2. render_history transcript log formatting with <ENTRY> XML tags
 * 3. format_recent_history dialogue formatting with <think> tag stripping
 * 4. render_input_history_xml enveloped history block
 * 5. render_chapter_history_xml episodic milestone formatting
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import {
  HISTORY_DEFAULTS,
  resolve_history,
  render_history,
  render_input_history_xml,
  render_chapter_history_xml,
  render_visual_history,
} from "./history.js";

describe("src/intelligence/modules/history.js", () => {
  describe("HISTORY_DEFAULTS & resolve_history()", () => {
    it("exports frozen defaults and resolves partial configurations", () => {
      expect(Object.isFrozen(HISTORY_DEFAULTS)).toBe(true);
      expect(HISTORY_DEFAULTS.limit).toBe(16);
      expect(HISTORY_DEFAULTS.max_chars).toBe(400);

      const resolved_default = resolve_history();
      expect(resolved_default).toEqual(HISTORY_DEFAULTS);

      const resolved_custom = resolve_history({ limit: 8, max_chars: 200 });
      expect(resolved_custom.limit).toBe(8);
      expect(resolved_custom.max_chars).toBe(200);
      expect(resolved_custom.enabled).toBe(true);
    });
  });

  describe("render_history()", () => {
    it("renders turn transcript logs with origin, round, and stripped think blocks", () => {
      const simulation_log = [
        { role: "USER_PERSONA", content: "I draw my sword.", origin: "SILVERS" },
        {
          role: "AI_CHARACTER",
          content: "<think>He is hostile.</think> Step away from the altar.",
          origin: "ELIAS",
        },
      ];

      const rendered = render_history(simulation_log, { limit: 10, indent: 2 });
      expect(rendered).toContain('origin="SILVERS"');
      expect(rendered).toContain('origin="ELIAS"');
      expect(rendered).toContain('round="1"');
      expect(rendered).toContain('round="2"');
      expect(rendered).toContain("Step away from the altar.");
      expect(rendered).not.toContain("<think>");
      expect(rendered).not.toContain("He is hostile.");
    });

    it("formats uncollapsed recent dialogue messages with word-boundary truncation", () => {
      const history = [
        { role: "user", character_name: "Benedict", text: "Is the road safe?" },
        {
          role: "ai",
          character_name: "Elias",
          text: "<think>It is treacherous.</think> The pass is blocked by snow.",
        },
      ];

      const formatted = render_history(history, { limit: 16, max_chars: 400, collapse: false });
      expect(formatted).toContain('<ENTRY round="1" origin="Benedict">Is the road safe?</ENTRY>');
      expect(formatted).toContain('<ENTRY round="2" origin="Elias">The pass is blocked by snow.</ENTRY>');
      expect(formatted).not.toContain("<think>");
      expect(formatted).not.toContain("It is treacherous.");
    });

    it("resolves origins fallback gracefully when character_name is absent", () => {
      const history = [
        { role: "user", text: "Look out!" },
        { role: "FRACTAL", text: "Thunder rumbles." },
      ];

      const formatted = render_history(history, { collapse: false });
      expect(formatted).toContain('origin="User"');
      expect(formatted).toContain('origin="Fractal"');
    });

    it("filters out empty or whitespace-only messages", () => {
      const history = [
        { role: "user", text: "   " },
        { role: "ai", text: "<think>Only thought</think>" },
      ];

      const formatted = render_history(history, { collapse: false });
      expect(formatted).toBe("");
    });

    it("handles string or empty simulation log safely", () => {
      expect(render_history("pre-rendered history")).toBe("pre-rendered history");
      expect(render_history(null)).toBe("");
      expect(render_history([])).toBe("");
    });
  });

  describe("render_input_history_xml()", () => {
    it("envelopes formatted history inside input tag with clean indentation", () => {
      const history = [{ role: "user", character_name: "Benedict", text: "Hello" }];
      const xml = render_input_history_xml(history, { tag: "INPUT_HISTORY", limit: 5 });

      expect(xml).toContain("<INPUT_HISTORY>");
      expect(xml).toContain('<ENTRY round="1" origin="Benedict">Hello</ENTRY>');
      expect(xml).toContain("</INPUT_HISTORY>");
    });

    it("returns empty string when history contains no valid content", () => {
      expect(render_input_history_xml([])).toBe("");
      expect(render_input_history_xml([{ role: "user", text: "" }])).toBe("");
    });
  });

  describe("render_chapter_history_xml()", () => {
    it("renders closed chapter milestones while normalizing repetitive chapter prefixes", () => {
      const entity = {
        chapters: [
          { status: "closed", title: "Chapter 1: The Descent", summary: "Entered the cavern." },
          { status: "closed", title: "The Ambush", summary: "Ambushed by goblins." },
          { status: "open", title: "Chapter 3: Current", summary: "Active scene." },
        ],
      };

      const xml = render_chapter_history_xml(entity, 2);
      expect(xml).toContain("<CHAPTER_HISTORY>");
      expect(xml).toContain("- Chapter 1: The Descent: Entered the cavern.");
      expect(xml).toContain("- Chapter The Ambush: Ambushed by goblins.");
      expect(xml).not.toContain("Chapter Chapter");
      expect(xml).not.toContain("Current");
    });

    it("returns empty string when entity has no closed chapters", () => {
      expect(render_chapter_history_xml(null)).toBe("");
      expect(render_chapter_history_xml({ chapters: [] })).toBe("");
      expect(render_chapter_history_xml({ chapters: [{ status: "open" }] })).toBe("");
    });
  });
});

describe("src/intelligence/modules/history.js — render_visual_history", () => {
  it("formats the most recent non-system beats as 'Name: prose' lines", () => {
    const entries = [
      { role: "fractal", character_name: "Ashenweald", text: "The fog curls around the roots." },
      { role: "system", text: "telemetry: chaos +1" },
      { role: "ai", character_name: "Silvers", text: "He watches from the treeline." },
    ];

    const rendered = render_visual_history(entries);
    expect(rendered).toContain("Ashenweald: The fog curls around the roots.");
    expect(rendered).toContain("Silvers: He watches from the treeline.");
    expect(rendered).not.toContain("telemetry");
  });

  it("limits to the most recent entries and returns empty for absent feeds", () => {
    const entries = [
      { role: "ai", character_name: "First", text: "One." },
      { role: "ai", character_name: "Second", text: "Two." },
    ];

    expect(render_visual_history(entries, { max_entries: 1 })).toBe("Second: Two.");
    expect(render_visual_history([])).toBe("");
    expect(render_visual_history(null)).toBe("");
  });
});

/**
 * CHANGELOG
 * - 2026-09-13: Initial unit test suite for history.js covering resolve_history, render_history, format_recent_history, render_input_history_xml, and render_chapter_history_xml with token-optimized XML contracts.
 */
