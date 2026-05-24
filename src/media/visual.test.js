/**
 * src/media/visual-engine.test.js
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { visual_engine } from "@media/visual.svelte.js";
import { llm_service } from "@platform/transport.js";
import { entities } from "@data/repository.js";

// Mock Perchance global
vi.stubGlobal("window", {
  pluginTextToImage: vi.fn(),
});

vi.mock("@platform/transport.js", () => ({
  llm_service: {
    generate: vi.fn().mockResolvedValue("Mocked prompt contribution"),
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
    update_entity: vi.fn().mockResolvedValue(true),
    simulation: {
      story: { by_id: {} },
    },
  },
}));

vi.mock("@state/status.svelte.js", () => ({
  simulationState: {
    start_typing: vi.fn(),
    stop_typing: vi.fn(),
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
    vi.mocked(/** @type {any} */ (window).pluginTextToImage).mockResolvedValue({
      dataUrl: "data:image/png;base64,123",
    });

    const result = await visual_engine.generate(
      "A photorealistic portrait of a Nordic investigator",
    );

    expect(result).toBe("data:image/png;base64,123");
    expect(visual_engine.isLoading).toBe(false);
    expect(visual_engine.error).toBe(null);
  });

  it("should distinguish short prompts from UUIDs", async () => {
    vi.mocked(/** @type {any} */ (window).pluginTextToImage).mockResolvedValue("image_url");

    // Case 1: Short prompt (previously failed)
    await visual_engine.generate("A cat");
    expect(entities.get).not.toHaveBeenCalled();

    // Case 2: UUID (should resolve)
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    await visual_engine.generate(uuid);
    expect(entities.get).toHaveBeenCalledWith("character", uuid);
  });

  it("should handle service failures with retries and circuit breaker", async () => {
    vi.mocked(/** @type {any} */ (window).pluginTextToImage).mockRejectedValue(
      new Error("GPU Offline"),
    );

    // failureThreshold is 3
    await expect(visual_engine.generate("test prompt")).rejects.toThrow("GPU Offline");

    expect(visual_engine.attempts).toBe(2); // Retries 2 times (total 3 attempts)
    expect(visual_engine.breaker.failureCount).toBe(1); // One high-level failure reported to breaker
  });

  it("should enhance a prompt using Optics", async () => {
    vi.mocked(llm_service.generate).mockResolvedValue(
      '"Subject: A man in a cold facility, sharp focus, 8k."',
    );

    const result = await visual_engine.enhance("A tired scientist");

    expect(result).toBe("Subject: A man in a cold facility, sharp focus, 8k.");
    expect(llm_service.generate).toHaveBeenCalled();
  });

  it("should retry enhancement on failure", async () => {
    vi.mocked(llm_service.generate)
      .mockRejectedValueOnce(new Error("LLM Timeout"))
      .mockResolvedValueOnce("Successful prompt");

    const result = await visual_engine.enhance("text");

    expect(result).toBe("Successful prompt");
    expect(llm_service.generate).toHaveBeenCalledTimes(2);
  });

  it("should handle null LLM responses in visualize safely", async () => {
    vi.mocked(llm_service.generate).mockResolvedValue("");

    const result = await visual_engine.visualize("test-story", "text", "character");

    expect(result.imageUrl).toBe(null);
    expect(result.refinedPrompt).toBe(null);
  });

  it("should resolve entities and use them for prompt generation", async () => {
    vi.mocked(entities.get).mockResolvedValue({ name: "Kai", description: "A rugged survivor" });
    vi.mocked(llm_service.generate).mockResolvedValue("Kai, rugged survivor, cinematic");
    vi.mocked(/** @type {any} */ (window).pluginTextToImage).mockResolvedValue("Kai_Image_URL");

    const uuid = "550e8400-e29b-41d4-a716-446655440001";
    const result = await visual_engine.generate(uuid);

    expect(entities.get).toHaveBeenCalledWith("character", uuid);
    expect(result).toBe("Kai_Image_URL");
  });
});
