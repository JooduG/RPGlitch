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
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("No valid JSON object found"));
  });

  it("should return null and error if JSON parsing fails", async () => {
    vi.mocked(llm_service.generate).mockResolvedValue("{ malformed: json }");

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Resonance condensation failed"), expect.any(Error));
  });

  it("should return resonance object on valid JSON response and verify dependency calls", async () => {
    const mockEntity = { name: "Viper" };
    const mockHistory = [{ role: "user", content: "test message" }];
    const mockResonance = {
      summary: "A significant event happened.",
      vector_tags: ["event", "significant"]
    };
    const mockPayload = { system: "mock prompt", messages: [] };

    vi.mocked(prompt_builder.build_memory_prompt).mockReturnValue(mockPayload);
    vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify(mockResonance));
    vi.mocked(dynamics_engine.dynamics_scan).mockReturnValue([{ id: "DYNAMICS_TAG" }]);

    const result = await consolidate_vector(mockEntity, mockHistory, "character");

    // Verify dependency interactions
    expect(prompt_builder.build_memory_prompt).toHaveBeenCalledWith("character", mockEntity, mockHistory);
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

  it("should handle response objects with generatedText property", async () => {
    const mockResonance = {
      summary: "Event from object.",
      tags: ["tag1"]
    };
    vi.mocked(llm_service.generate).mockResolvedValue({
      generatedText: "```json\n" + JSON.stringify(mockResonance) + "\n```"
    });

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).not.toBeNull();
    expect(result.summary).toBe(mockResonance.summary);
    expect(result.vector_tags).toEqual(mockResonance.tags);
  });
});
