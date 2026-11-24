import { describe, expect, it } from "vitest";
import {
  canonicalize_role,
  decompose_story_title,
  filter_narrative_messages,
  is_empty_narrative_message,
  is_narrative_role,
  is_telemetry_meta,
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
  it("filter_narrative_messages drops system rows", () => {
    const out = filter_narrative_messages([
      { role: "system", content: "x" },
      { role: "ai_character", content: "y" },
    ]);
    expect(out).toHaveLength(1);
  });
});

describe("is_narrative_role", () => {
  it("identifies narrative roles", () => {
    expect(is_narrative_role("ai")).toBe(true);
    expect(is_narrative_role("FRACTAL")).toBe(true);
    expect(is_narrative_role("user")).toBe(true);
    expect(is_narrative_role("npc")).toBe(true);
    expect(is_narrative_role("system")).toBe(false);
    expect(is_narrative_role(null)).toBe(false);
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
