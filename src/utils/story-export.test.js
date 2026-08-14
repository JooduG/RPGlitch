import { describe, expect, it } from "vitest";
import { build_story_export_filename, export_story_markdown, format_story_beat } from "./story-export.js";

describe("format_story_beat", () => {
  it("renders character dialogue as a bold label + prose", () => {
    expect(format_story_beat({ role: "assistant", character_name: "Vael", text: "The wind pulls at the sails." })).toBe(
      "**Vael:** The wind pulls at the sails.",
    );
  });

  it("labels user entries as You when no persona name is set", () => {
    expect(format_story_beat({ role: "user", text: "I step ashore." })).toBe("**You:** I step ashore.");
  });

  it("uses the persona name for user entries when present", () => {
    expect(format_story_beat({ role: "user", character_name: "Ghost", text: "I step ashore." })).toBe("**Ghost:** I step ashore.");
  });

  it("renders narrator roles as blockquotes", () => {
    expect(format_story_beat({ role: "prologue", text: "The sea is black." })).toBe("> The sea is black.");
    expect(format_story_beat({ role: "fractal", text: "Dusk settles." })).toBe("> Dusk settles.");
  });

  it("renders system telemetry as an italic note", () => {
    expect(format_story_beat({ role: "system", text: "Vector Resolved: +2 affinity" })).toBe("_Vector Resolved: +2 affinity_");
  });

  it("strips cognition blocks from beat text", () => {
    expect(format_story_beat({ role: "assistant", character_name: "Vael", text: "<think>plan</think>The sails fill." })).toBe(
      "**Vael:** The sails fill.",
    );
  });

  it("returns null for empty beats", () => {
    expect(format_story_beat({ role: "assistant", text: "" })).toBe(null);
    expect(format_story_beat({ role: "assistant", text: "   " })).toBe(null);
    expect(format_story_beat(null)).toBe(null);
  });
});

describe("export_story_markdown", () => {
  const story = {
    title: "The Black Tide",
    state: "active",
    last_played: 1723636800000,
  };

  it("emits a title and metadata header", () => {
    const md = export_story_markdown(story, []);
    expect(md.startsWith("# The Black Tide")).toBe(true);
    expect(md).toContain("**State:** Active");
    expect(md).toContain("**Beats:** 0");
  });

  it("counts beats and rounds from the log", () => {
    const entries = [
      { role: "prologue", text: "Open.", round: 0 },
      { role: "user", text: "Hello.", round: 1 },
      { role: "assistant", character_name: "Vael", text: "Hi.", round: 1 },
    ];
    const md = export_story_markdown(story, entries);
    expect(md).toContain("**Beats:** 3");
    expect(md).toContain("**Rounds:** 2");
    expect(md).toContain("## Round 1");
  });

  it("groups beats under round headers", () => {
    const entries = [
      { role: "user", text: "One.", round: 1 },
      { role: "assistant", character_name: "Vael", text: "Two.", round: 1 },
      { role: "user", text: "Three.", round: 2 },
    ];
    const md = export_story_markdown(story, entries);
    expect(md).toContain("## Round 1");
    expect(md).toContain("## Round 2");
    const round1_index = md.indexOf("## Round 1");
    const round2_index = md.indexOf("## Round 2");
    expect(md.indexOf("One.")).toBeGreaterThan(round1_index);
    expect(md.indexOf("Two.")).toBeGreaterThan(round1_index);
    expect(md.indexOf("One.")).toBeLessThan(round2_index);
    expect(md.indexOf("Three.")).toBeGreaterThan(round2_index);
  });

  it("marks concluded stories", () => {
    const md = export_story_markdown({ ...story, state: "concluded" }, []);
    expect(md).toContain("**State:** Concluded");
  });

  it("handles missing entries gracefully", () => {
    expect(export_story_markdown(story, null)).toContain("# The Black Tide");
  });
});

describe("build_story_export_filename", () => {
  it("builds a slugged, dated filename", () => {
    const name = build_story_export_filename({ title: "The Black Tide!" }, new Date(2026, 7, 14));
    expect(name).toBe("story-the-black-tide-2026-08-14.md");
  });

  it("falls back for untitled stories", () => {
    const name = build_story_export_filename({}, new Date(2026, 0, 1));
    expect(name).toMatch(/^story-story-2026-01-01\.md$/);
  });
});
