import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { sanitize, llm_service } from "@core/intelligence/llm-service.js";
import { app } from "@state/app.svelte.js";
import { ERROR_MESSAGES } from "@core/engine/config.js";

// Mock app state
vi.mock("@state/app.svelte.js", () => {
  return {
    app: {
      start_stream: vi.fn(),
      update_stream: vi.fn(),
      end_stream: vi.fn(),
      streaming: { active: false },
    },
  };
});

describe("llm_service - sanitize", () => {
  it("should remove outer quotes", () => {
    expect(sanitize('"Hello World"')).toBe("Hello World");
    expect(sanitize("'Hello World'")).toBe("Hello World");
  });

  it("should remove conversational fillers up to a colon", () => {
    expect(sanitize("Sure: Hello World")).toBe("Hello World");
    expect(sanitize("Certainly: Hello World")).toBe("Hello World");
    expect(sanitize("I can help: Hello World")).toBe("Hello World");
    expect(sanitize("here is the requested text: Hello World")).toBe("Hello World");
    expect(sanitize("enhanced text:: Hello World")).toBe("Hello World");
    expect(sanitize("the enhanced text: Hello World")).toBe("Hello World");
  });

  it("should remove code fences", () => {
    expect(sanitize("```\nHello World\n```")).toBe("Hello World");
    expect(sanitize("```javascript\nHello World\n```")).toBe("Hello World");
  });

  it("should trim the result", () => {
    expect(sanitize("  Hello World  ")).toBe("Hello World");
    expect(sanitize("\nHello World\n")).toBe("Hello World");
  });

  it("should STRIP <think> blocks in llm response", () => {
    const input = "<think>I need to be mysterious.</think>Hello Ghost.";
    expect(sanitize(input)).toBe("Hello Ghost.");
  });
});

describe("llm_service - generate", () => {
  let originalWindowAi;
  beforeEach(() => {
    vi.clearAllMocks();
    originalWindowAi = window.ai;
    vi.spyOn(app, "start_stream").mockImplementation(() => {});
    vi.spyOn(app, "update_stream").mockImplementation(() => {});
    vi.spyOn(app, "end_stream").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    window.ai = originalWindowAi;
    vi.restoreAllMocks();
  });

  it("should throw an error if window.ai is not available", async () => {
    const originalAi = window.ai;
    delete window.ai; // Ensure it's totally gone

    await expect(
      llm_service.generate({ system: "", messages: [] }, { silent: true }),
    ).rejects.toThrow(/LLM Engine Unavailable: window.ai not found/);

    window.ai = originalAi;
  });

  it("should correctly format conversation history", () => {
    const messages = [
      { role: "user", text: "Hello" },
      { role: "ai", content: "Hi there", character_name: "Assistant" },
      { role: "system", content: "You are helpful." },
    ];
    const formatted = llm_service._format_history(messages);
    expect(formatted).toBe(
      "[[User]]: Hello\n\n[[Assistant]]: Hi there\n\n[[Character]]: You are helpful.",
    );
  });

  it("should call window.ai with correct instruction assembly", async () => {
    window.ai = vi.fn().mockResolvedValue("Mocked response");
    const payload = {
      system: "System prompt",
      startWith: "Start with this",
      messages: [{ role: "user", text: "Hello" }],
    };
    await llm_service.generate(payload, { silent: true, raw: true });
    const expectedInstruction =
      "System prompt\n\n\n\n[CONVERSATION HISTORY]\n[[User]]: Hello\n\n\n\n[START RESPONSE WITH]\nStart with this";
    expect(window.ai).toHaveBeenCalledWith(expectedInstruction, expect.any(Object));
  });

  it("should handle streaming callbacks and update app state", async () => {
    const mockResponse = "Chunk1Chunk2";
    window.ai = vi.fn().mockImplementation(async (instruction, options) => {
      options.onToken("Chunk1");
      options.onToken("Chunk2");
      return mockResponse;
    });
    const onTokenSpy = vi.fn();
    const payload = { system: "", node_id: "test-node", messages: [] };
    await llm_service.generate(payload, {
      onToken: onTokenSpy,
      silent: false,
      raw: true,
    });
    expect(app.start_stream).toHaveBeenCalledWith("test-node", "ai");
    expect(app.update_stream).toHaveBeenNthCalledWith(1, "Chunk1");
    expect(app.update_stream).toHaveBeenNthCalledWith(2, "Chunk2");
    expect(onTokenSpy).toHaveBeenCalledTimes(2);
    expect(onTokenSpy).toHaveBeenLastCalledWith("Chunk2");
  });

  it("should sanitize output by default", async () => {
    window.ai = vi.fn().mockResolvedValue("```\nHere is the response\n```");
    const payload = { messages: [] };
    const result = await llm_service.generate(payload, { silent: true });
    expect(result).toBe("Here is the response");
  });

  it("should not sanitize output if options.raw is true", async () => {
    window.ai = vi.fn().mockResolvedValue("```\nHere is the response\n```");
    const payload = { messages: [] };
    const result = await llm_service.generate(payload, {
      silent: true,
      raw: true,
    });
    expect(result).toBe("```\nHere is the response\n```");
  });

  it("should handle timeout/keep alive network errors", async () => {
    window.ai = vi.fn().mockRejectedValue(new Error("stream keep alive timeout"));
    const payload = { messages: [] };
    await expect(llm_service.generate(payload, { silent: false })).rejects.toThrow(
      ERROR_MESSAGES.CONNECTION_LOST,
    );
    expect(app.end_stream).toHaveBeenCalled();
  });

  it("should rethrow generic errors when silent is true", async () => {
    const error = new Error("Generic error");
    window.ai = vi.fn().mockRejectedValue(error);
    const payload = { messages: [] };
    await expect(llm_service.generate(payload, { silent: true })).rejects.toThrow("Generic error");
    expect(console.warn).toHaveBeenCalled();
  });

  it("should execute enhance correctly", async () => {
    window.ai = vi.fn().mockResolvedValue("```\nEnhanced response\n```");
    const payload = { messages: [] };
    const result = await llm_service.enhance(payload);
    expect(result).toBe("Enhanced response");
    expect(window.ai).toHaveBeenCalled();
  });
});
