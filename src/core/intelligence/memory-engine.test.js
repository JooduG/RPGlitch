import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { consolidate_vector } from "./memory-engine.js";
import { llm_service } from "./llm-service.js";
import { dynamics_engine } from "./dynamics-engine.js";
import { prompt_builder } from "./prompt-builder.js";

// Mock dependencies
vi.mock("./llm-service.js", () => ({
  llm_service: {
    generate: vi.fn(),
  },
}));

vi.mock("./dynamics-engine.js", () => ({
  dynamics_engine: {
    dynamics_scan: vi.fn(() => []),
  },
}));

vi.mock("./prompt-builder.js", () => ({
  prompt_builder: {
    build_memory_prompt: vi.fn(() => ({ system: "mock prompt", messages: [] })),
  },
}));

describe("memory-engine - consolidate_vector", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01"));
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should return null if target_entity is missing", async () => {
    const result = await consolidate_vector(null, []);
    expect(result).toBeNull();
  });

  it("should return null and warn if no valid JSON object is found in response", async () => {
    vi.mocked(llm_service.generate).mockResolvedValue("No JSON here");

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("No valid JSON object found"),
    );
  });

  it("should return null and warn if JSON parsing fails", async () => {
    vi.mocked(llm_service.generate).mockResolvedValue("{ malformed: json }");

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Failed to parse resonance JSON"),
      expect.any(Error),
    );
  });

  it("should return null and error if llm_service.generate rejects (network error)", async () => {
    const networkError = new Error("Network failure");
    vi.mocked(llm_service.generate).mockRejectedValue(networkError);

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Resonance condensation failed"),
      networkError,
    );
  });

  it("should return null and warn if resonance summary property is missing", async () => {
    const mockResonance = { vector_tags: ["tag"] }; // Missing summary
    vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify(mockResonance));

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("summary is missing or empty"),
    );
  });

  it("should return null and warn if resonance summary property is empty", async () => {
    const mockResonance = { summary: "  ", vector_tags: ["tag"] }; // Empty/whitespace summary
    vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify(mockResonance));

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("summary is missing or empty"),
    );
  });

  it("should return resonance object on valid JSON response and verify dependency calls", async () => {
    const mockEntity = { name: "Viper" };
    const mockHistory = [{ role: "user", content: "test message" }];
    const mockResonance = {
      summary: "A significant event happened.",
      vector_tags: ["event", "significant"],
    };
    const mockPayload = { system: "mock prompt", messages: [] };

    vi.mocked(prompt_builder.build_memory_prompt).mockReturnValue(mockPayload);
    vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify(mockResonance));
    vi.mocked(dynamics_engine.dynamics_scan).mockReturnValue([{ id: "DYNAMICS_TAG" }]);

    const result = await consolidate_vector(mockEntity, mockHistory, "character");

    // Verify dependency interactions
    expect(prompt_builder.build_memory_prompt).toHaveBeenCalledWith(
      "character",
      mockEntity,
      mockHistory,
    );
    expect(llm_service.generate).toHaveBeenCalledWith(mockPayload, {
      json: true,
      silent: true,
      raw: true,
    });
    expect(dynamics_engine.dynamics_scan).toHaveBeenCalledWith(mockResonance.summary);

    // Verify final resonance object
    expect(result).toEqual({
      summary: mockResonance.summary,
      vector_tags: mockResonance.vector_tags,
      dynamics_tags: ["DYNAMICS_TAG"],
      timestamp: Date.now(),
    });
    expect(result.timestamp).toBe(new Date("2024-01-01").getTime());
  });

  it("should use empty array for vector_tags if both tags and vector_tags are missing", async () => {
    const mockResonance = { summary: "Only summary provided" };
    vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify(mockResonance));

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).not.toBeNull();
    expect(result.summary).toBe(mockResonance.summary);
    expect(result.vector_tags).toEqual([]);
  });

  it("should handle response objects with generatedText property", async () => {
    const mockResonance = {
      summary: "Event from object generatedText.",
      tags: ["tag1"],
    };
    vi.mocked(llm_service.generate).mockResolvedValue({
      generatedText: "```json\n" + JSON.stringify(mockResonance) + "\n```",
    });

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).not.toBeNull();
    expect(result.summary).toBe(mockResonance.summary);
    expect(result.vector_tags).toEqual(mockResonance.tags);
  });

  it("should handle response objects with text property (fallback from generatedText)", async () => {
    const mockResonance = {
      summary: "Event from object text.",
      tags: ["tag2"],
    };
    vi.mocked(llm_service.generate).mockResolvedValue({
      text: "```json\n" + JSON.stringify(mockResonance) + "\n```",
    });

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).not.toBeNull();
    expect(result.summary).toBe(mockResonance.summary);
    expect(result.vector_tags).toEqual(mockResonance.tags);
  });

  it("should parse the first object correctly when multiple JSON objects are returned (non-greedy regex)", async () => {
    const json1 = JSON.stringify({ summary: "First" });
    const json2 = JSON.stringify({ summary: "Second" });
    vi.mocked(llm_service.generate).mockResolvedValue(`${json1}\nSome noise\n${json2}`);

    const result = await consolidate_vector({ name: "Viper" }, []);

    // With non-greedy regex, it should correctly isolate and parse the first object
    expect(result).not.toBeNull();
    expect(result.summary).toBe("First");
  });
});
