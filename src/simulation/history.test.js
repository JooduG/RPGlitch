import { describe, expect, it } from "vitest";
import { canonicalize_role, collapse_history, filter_narrative_messages, is_empty_narrative_message, is_telemetry_meta } from "./history.js";

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
