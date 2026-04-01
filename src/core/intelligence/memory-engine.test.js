import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { consolidate_vector } from "./memory-engine.js";
import { llm_service } from "./llm-service.js";
import { dynamics_engine } from "./dynamics-engine.js";
import { prompt_builder } from "./prompt-builder.js";

// Mock app state
vi.mock("@state/app.svelte.js", () => ({
  app: {
    start_stream: vi.fn(),
    update_stream: vi.fn(),
    end_stream: vi.fn(),
    streaming: { active: false },
  },
}));

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
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
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

  it("should return resonance object on valid JSON response", async () => {
    const mockResonance = {
      summary: "A significant event happened.",
      vector_tags: ["event", "significant"]
    };
    vi.mocked(llm_service.generate).mockResolvedValue(JSON.stringify(mockResonance));
    vi.mocked(dynamics_engine.dynamics_scan).mockReturnValue([{ id: "DYNAMICS_TAG" }]);

    const result = await consolidate_vector({ name: "Viper" }, []);

    expect(result).not.toBeNull();
    expect(result.summary).toBe(mockResonance.summary);
    expect(result.vector_tags).toEqual(mockResonance.vector_tags);
    expect(result.dynamics_tags).toEqual(["DYNAMICS_TAG"]);
    expect(result.timestamp).toBeDefined();
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
