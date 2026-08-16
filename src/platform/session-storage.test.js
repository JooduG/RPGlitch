import { beforeEach, describe, expect, it, vi } from "vitest";

describe("session-checkpoint", () => {
  beforeEach(() => {
    vi.resetModules();
    window.name = "";
    window.sessionStorage.clear();
  });

  it("round-trips a checkpoint through sessionStorage", async () => {
    const { save_session_checkpoint, load_session_checkpoint } = await import("./session-storage.js");
    save_session_checkpoint({ story_id: "story-42", round: 7, phase: "generating" });
    expect(load_session_checkpoint()).toEqual({ story_id: "story-42", round: 7, phase: "generating" });
  });

  it("coerces missing story id and round to safe defaults", async () => {
    const { save_session_checkpoint, load_session_checkpoint } = await import("./session-storage.js");
    save_session_checkpoint({ story_id: null, round: undefined, phase: undefined });
    expect(load_session_checkpoint()).toEqual({ story_id: null, round: 0, phase: "idle" });
  });

  it("clears the checkpoint", async () => {
    const { save_session_checkpoint, load_session_checkpoint, clear_session_checkpoint } = await import("./session-storage.js");
    save_session_checkpoint({ story_id: "story-1", round: 0, phase: "idle" });
    clear_session_checkpoint();
    expect(load_session_checkpoint()).toBeNull();
  });

  it("returns null when nothing is stored", async () => {
    const { load_session_checkpoint } = await import("./session-storage.js");
    expect(load_session_checkpoint()).toBeNull();
  });

  it("writes to window.name when sessionStorage is blocked", async () => {
    const ss_get = vi.spyOn(window.sessionStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const ss_set = vi.spyOn(window.sessionStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { save_session_checkpoint } = await import("./session-storage.js");
    save_session_checkpoint({ story_id: "story-9", round: 3, phase: "idle" });
    expect(window.name).toBe(JSON.stringify({ story_id: "story-9", round: 3, phase: "idle" }));
    ss_get.mockRestore();
    ss_set.mockRestore();
  });

  it("restores from window.name when sessionStorage is blocked on a cold load", async () => {
    const ss_get = vi.spyOn(window.sessionStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    window.name = JSON.stringify({ story_id: "story-9", round: 3, phase: "idle" });
    vi.resetModules();
    const { load_session_checkpoint } = await import("./session-storage.js");
    expect(load_session_checkpoint()).toEqual({ story_id: "story-9", round: 3, phase: "idle" });
    ss_get.mockRestore();
  });
});
