/**
 * src/media/visual-engine.test.js
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { visual_engine } from "./visual-engine.svelte.js";
import { llm_service } from "@core/intelligence/llm-service.js";
import { entities } from "@data/repository.js";

// Mock Perchance global
vi.stubGlobal("window", {
  pluginTextToImage: vi.fn(),
});

vi.mock("@core/intelligence/llm-service.js", () => ({
  llm_service: {
    generate: vi.fn(),
  },
}));

vi.mock("@data/repository.js", () => ({
  entities: {
    get: vi.fn(),
  },
}));

vi.mock("@data/db.js", () => ({
  db: {
    entities: {
      update: vi.fn().mockResolvedValue(true),
    },
  },
}));

vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    updateEntity: vi.fn().mockResolvedValue(true),
    story: { byId: {} },
  },
}));

describe("VisualEngine (Reactive)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visual_engine.error = null;
    visual_engine.isLoading = false;
    visual_engine.breaker.state = "CLOSED";
    visual_engine.breaker.failureCount = 0;
  });

  it("should generate an image from a direct prompt", async () => {
    vi.mocked(window.pluginTextToImage).mockResolvedValue({ dataUrl: "data:image/png;base64,123" });

    const result = await visual_engine.generate(
      "A photorealistic portrait of a Nordic investigator",
      { noCache: true },
    );

    expect(result).toBe("data:image/png;base64,123");
    expect(visual_engine.isLoading).toBe(false);
    expect(visual_engine.error).toBe(null);
  });

  it("should handle service failures with retries and circuit breaker", async () => {
    vi.mocked(window.pluginTextToImage).mockRejectedValue(new Error("GPU Offline"));

    // failureThreshold is 3
    await expect(visual_engine.generate("test prompt")).rejects.toThrow("GPU Offline");

    expect(visual_engine.attempts).toBe(2); // Retries 2 times (total 3 attempts)
    expect(visual_engine.breaker.failureCount).toBe(1); // One high-level failure reported to breaker
  });

  it("should optimize a character description using Optics", async () => {
    vi.mocked(llm_service.generate).mockResolvedValue(
      '"Subject: A man in a cold facility, sharp focus, 8k."',
    );

    const result = await visual_engine.optimize("A tired scientist");

    expect(result).toBe("Subject: A man in a cold facility, sharp focus, 8k.");
    expect(llm_service.generate).toHaveBeenCalled();
  });

  it("should resolve entities and use them for prompt generation", async () => {
    vi.mocked(entities.get).mockResolvedValue({ name: "Kai", description: "A rugged survivor" });
    vi.mocked(llm_service.generate).mockResolvedValue("Kai, rugged survivor, cinematic");
    vi.mocked(window.pluginTextToImage).mockResolvedValue("Kai_Image_URL");

    const result = await visual_engine.generate("Kai_Entity_ID", { noCache: true });

    expect(entities.get).toHaveBeenCalledWith("character", "Kai_Entity_ID");
    expect(result).toBe("Kai_Image_URL");
  });
});
