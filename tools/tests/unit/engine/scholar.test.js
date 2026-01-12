import { jest } from "@jest/globals";

// Mock dependencies
jest.mock("../../../../src/js/gamemaster/llm.js", () => ({
  LlmService: {
    generate: jest.fn(),
  },
}));

jest.mock("../../../../src/js/scholar/context.js", () => ({
  ContextBuilder: jest.fn().mockImplementation(() => ({
    buildScholarPrompt: jest
      .fn()
      .mockResolvedValue({ system: "PROMPT", messages: [] }),
    buildScholarArchivistPrompt: jest
      .fn()
      .mockResolvedValue({ system: "ARCHIVE_PROMPT", messages: [] }),
  })),
}));

jest.mock("../../../../src/js/gamemaster/utils.js", () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../../../src/js/mesmer/audio/service.js", () => ({
  audioService: {
    play: jest.fn(),
  },
}));

jest.mock("../../../../src/js/mesmer/ui/core/modal.js", () => ({
  showAlert: jest.fn(),
}));

import { Scholar } from "../../../../src/js/scholar/index.js";
import { LlmService } from "../../../../src/js/gamemaster/llm.js";
import { ContextBuilder } from "../../../../src/js/scholar/index.js";

describe("Scholar System", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  test("archive() processes history and returns updates", async () => {
    LlmService.generate.mockResolvedValue(
      JSON.stringify({
        past_update: "New Memory",
        state: { mental: "Enlightened" },
      }),
    );

    const result = await Scholar.archive({ name: "Test" }, [], "character");

    expect(result).toEqual({
      past_update: "New Memory",
      state: { mental: "Enlightened" },
    });
  });

  test("archive() handles JSON parsing errors gracefully", async () => {
    LlmService.generate.mockResolvedValue("Invalid JSON");

    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = await Scholar.archive({ name: "Test" }, [], "character");
    consoleSpy.mockRestore();

    expect(result).toBeNull();
  });
});
