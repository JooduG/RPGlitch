import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock dependencies
vi.mock("../../../src/gamemaster/llm.js", () => {
  return {
    LlmService: {
      generate: vi.fn(),
    },
  };
});

vi.mock("../../../src/scholar/library/context.js", () => {
  return {
    ContextBuilder: class {
      buildScholarPrompt = vi
        .fn()
        .mockResolvedValue({ system: "PROMPT", messages: [] });
      buildScholarEchoPrompt = vi
        .fn()
        .mockResolvedValue({ system: "ECHO_PROMPT", messages: [] });
      buildMesmerEnhance = vi
        .fn()
        .mockResolvedValue({ system: "ENHANCE", messages: [] });
    },
  };
});

// utils.js mock removed

vi.mock("../../../src/mesmer/audio/sound-effects.js", () => ({
  soundEffects: {
    play: vi.fn(),
  },
}));

import { LlmService } from "../../../src/gamemaster/llm.js";
import { Scholar } from "../../../src/scholar/index.js";

describe("Scholar System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = `
      <input id="input-past" value="Old Memory" />
      <button id="btn-magic-past">✨</button>
    `;
  });

  test("consult() enhances a field via LLM", async () => {
    LlmService.generate.mockResolvedValue("Refined Memory");

    const mockChar = {
      name: "Test Subject",
      timeline: { past: "Old Memory" },
      type: "character",
    };

    const result = await Scholar.consult("past", mockChar);

    expect(result).toBe("Refined Memory");
    expect(LlmService.generate).toHaveBeenCalled();
  });

  test("echo() processes history and returns updates", async () => {
    LlmService.generate.mockResolvedValue(
      JSON.stringify({
        past_update: "New Memory",
        state: { mental: "Enlightened" },
      }),
    );

    const result = await Scholar.echo({ name: "Test" }, [], "character");

    expect(result).toEqual({
      past_update: "New Memory",
      state: { mental: "Enlightened" },
    });
  });

  test("echo() handles JSON parsing errors gracefully", async () => {
    LlmService.generate.mockResolvedValue("Invalid JSON");

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await Scholar.echo({ name: "Test" }, [], "character");
    consoleSpy.mockRestore();

    expect(result).toBeNull();
  });
});
