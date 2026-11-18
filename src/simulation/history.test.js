import { describe, expect, it } from "vitest";
import {
  canonicalize_role,
  collapse_history,
  decompose_story_title,
  filter_narrative_messages,
  format_history_entries,
  is_empty_narrative_message,
  is_narrative_role,
  is_telemetry_meta,
  role_display_label,
} from "./history.js";

describe("canonicalize_role", () => {
  it("maps model/assistant to ai", () => {
    expect(canonicalize_role("model")).toBe("ai");
    expect(canonicalize_role("assistant")).toBe("ai");
  });
  it("maps user_persona to user", () => {
    expect(canonicalize_role("user_persona")).toBe("user");
  });
});

describe("history filters", () => {
  it("drops empty narrative messages", () => {
    expect(is_empty_narrative_message("   ", { attachments: [], meta: {} })).toBe(true);
    expect(is_empty_narrative_message("hello", { attachments: [], meta: {} })).toBe(false);
  });
  it("detects telemetry meta", () => {
    expect(is_telemetry_meta({ type: "DYNAMICS_DELTA" })).toBe(true);
    expect(is_telemetry_meta({})).toBe(false);
  });
  it("collapse_history merges same-speaker runs", () => {
    const out = collapse_history([
      { role: "ai_character", character_name: "Beast", content: "One." },
      { role: "ai_character", character_name: "Beast", content: "Two." },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].content).toContain("Two.");
  });
  it("filter_narrative_messages drops system rows", () => {
    const out = filter_narrative_messages([
      { role: "system", content: "x" },
      { role: "ai_character", content: "y" },
    ]);
    expect(out).toHaveLength(1);
  });
});

describe("role_display_label & is_narrative_role", () => {
  it("maps roles to display labels", () => {
    expect(role_display_label("USER_PERSONA")).toBe("User");
    expect(role_display_label("user")).toBe("User");
    expect(role_display_label("FRACTAL")).toBe("Fractal");
    expect(role_display_label("AI_CHARACTER")).toBe("Character");
    expect(role_display_label(null)).toBe("Character");
  });

  it("identifies narrative roles", () => {
    expect(is_narrative_role("ai")).toBe(true);
    expect(is_narrative_role("FRACTAL")).toBe(true);
    expect(is_narrative_role("user")).toBe(true);
    expect(is_narrative_role("npc")).toBe(true);
    expect(is_narrative_role("system")).toBe(false);
    expect(is_narrative_role(null)).toBe(false);
  });
});

describe("collapse_history", () => {
  it("groups consecutive messages from the same role and character", () => {
    const messages = [
      { role: "user", text: "Hello", character_name: "Orion" },
      { role: "user", text: "Are you there?", character_name: "Orion" },
      { role: "assistant", text: "I am here.", character_name: "Glitch" },
    ];
    const collapsed = collapse_history(messages);
    expect(collapsed).toEqual([
      { role: "user_persona", name: "Orion", content: "Hello\nAre you there?" },
      { role: "ai_character", name: "Glitch", content: "I am here." },
    ]);
  });

  it("ignores system messages in collapsed history", () => {
    const messages = [
      { role: "system", text: "Telemetry delta" },
      { role: "assistant", text: "Welcome.", character_name: "Glitch" },
    ];
    expect(collapse_history(messages)).toEqual([{ role: "ai_character", name: "Glitch", content: "Welcome." }]);
  });
});

describe("filter_narrative_messages", () => {
  it("filters out system messages and respects consolidated option", () => {
    const messages = [
      { role: "system", text: "Story Started" },
      { role: "user", text: "Look out", meta: { consolidated: true } },
      { role: "assistant", text: "I see it", character_name: "Iris" },
    ];

    expect(filter_narrative_messages(messages)).toEqual([
      { role: "user", text: "Look out", meta: { consolidated: true } },
      { role: "assistant", text: "I see it", character_name: "Iris" },
    ]);

    expect(filter_narrative_messages(messages, { exclude_consolidated: true })).toEqual([{ role: "assistant", text: "I see it", character_name: "Iris" }]);
  });

  it("filters out empty string entries without prologue/epilogue flags", () => {
    const messages = [
      { role: "fractal", text: "", character_name: "World" },
      { role: "fractal", text: "   ", character_name: "World" },
      { role: "fractal", text: "", meta: { is_prologue: true }, character_name: "World" },
      { role: "assistant", text: "Valid dialogue", character_name: "Iris" },
    ];

    expect(filter_narrative_messages(messages)).toEqual([
      { role: "fractal", text: "", meta: { is_prologue: true }, character_name: "World" },
      { role: "assistant", text: "Valid dialogue", character_name: "Iris" },
    ]);
  });

  it("handles null or non-array inputs safely", () => {
    expect(filter_narrative_messages(null)).toEqual([]);
    expect(filter_narrative_messages(undefined)).toEqual([]);
  });
});

describe("format_history_entries", () => {
  it("formats messages into canonical XML <ACTION> sequences with origin, round, and stripped think tags", () => {
    const messages = [
      { role: "user", text: "Hello", character_name: "Orion", origin: "ORION" },
      { role: "assistant", text: "<think>He greets me.</think>Greetings.", character_name: "Glitch", origin: "GLITCH" },
    ];
    const xml = format_history_entries(messages);
    expect(xml).toContain('<ACTION round="1" origin="ORION">Hello</ACTION>');
    expect(xml).toContain('<ACTION round="2" origin="GLITCH">Greetings.</ACTION>');
    expect(xml).not.toContain("<think>");
  });

  it("collapses consecutive messages with separator and supports indent and max_chars", () => {
    const messages = [
      { role: "user", text: "One", character_name: "Orion" },
      { role: "user", text: "Two", character_name: "Orion" },
    ];
    const xml = format_history_entries(messages, { separator: "\n\n", indent: 2 });
    expect(xml).toBe('  <ACTION round="1" origin="Orion">One\n\nTwo</ACTION>');
  });

  it("returns empty string on empty or null inputs", () => {
    expect(format_history_entries([])).toBe("");
    expect(format_history_entries(null)).toBe("");
  });
});

describe("decompose_story_title", () => {
  it("decomposes standard title into colored entity segments", () => {
    const entities = {
      ai: { name: "Glitch" },
      user: { name: "Orion" },
      fractal: { name: "Nova City" },
      get_color: (e) =>
        e.name === "Glitch" ? "#00ffcc"
        : e.name === "Orion" ? "#ff66cc"
        : "#6699ff",
    };
    const title = "Chronicles of Glitch & Orion in Nova City";
    const parts = decompose_story_title(title, entities);
    expect(parts).toEqual([
      { text: "Chronicles of " },
      { text: "Glitch", color: "#00ffcc" },
      { text: " & " },
      { text: "Orion", color: "#ff66cc" },
      { text: " in " },
      { text: "Nova City", color: "#6699ff" },
    ]);
  });

  it("handles custom arbitrary titles gracefully", () => {
    const title = "Custom Dark Fantasy Epic";
    const parts = decompose_story_title(title, {});
    expect(parts).toEqual([{ text: "Custom Dark Fantasy Epic" }]);
  });

  it("handles null or empty title gracefully", () => {
    expect(decompose_story_title(null)).toEqual([{ text: "" }]);
    expect(decompose_story_title("")).toEqual([{ text: "" }]);
  });
});
