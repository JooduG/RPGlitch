/**
 * src/media/visual-engine.test.js
 */
import { entities } from "@data";
import { visual_engine } from "@media";
import { llm_service } from "@platform";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@platform/security.js", () => ({
  Security: {
    sanitize: vi.fn((html) => html),
  },
  validateImage: vi.fn().mockResolvedValue(true),
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
    vi.useRealTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    visual_engine.error = null;
    visual_engine.isLoading = false;
    visual_engine.breaker.state = "CLOSED";
    visual_engine.breaker.failureCount = 0;
    visual_engine.retryer.initialDelay = 1;
    visual_engine.retryer.maxDelay = 5;
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("should pass removeBackground parameter to plugin when no_background is true", async () => {
    vi.mocked(/** @type {any} */ (window).pluginTextToImage).mockResolvedValue({
      dataUrl: "data:image/png;base64,abc",
    });

    const result = await visual_engine.generate("A photorealistic portrait", {
      no_background: true,
    });

    expect(result).toBe("data:image/png;base64,abc");
    expect(/** @type {any} */ (window).pluginTextToImage).toHaveBeenCalledWith(
      expect.objectContaining({
        removeBackground: true,
      }),
    );
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

  it("should handle timeout if text-to-image generator hangs indefinitely", async () => {
    const originalMaxAttempts = visual_engine.retryer.maxAttempts;
    visual_engine.retryer.maxAttempts = 1;
    vi.useFakeTimers();

    try {
      vi.mocked(/** @type {any} */ (window).pluginTextToImage).mockReturnValue(
        new Promise(() => {}),
      );

      const generatePromise = visual_engine.generate("test prompt");
      // Prevent unhandled promise rejection warnings in the event loop during timer advancement
      generatePromise.catch(() => {});

      await vi.advanceTimersByTimeAsync(45000);

      await expect(generatePromise).rejects.toThrow("Image generation timed out");
    } finally {
      vi.useRealTimers();
      visual_engine.retryer.maxAttempts = originalMaxAttempts;
    }
  });

  it("should handle failure status in resolved object", async () => {
    const originalMaxAttempts = visual_engine.retryer.maxAttempts;
    visual_engine.retryer.maxAttempts = 1;

    try {
      vi.mocked(/** @type {any} */ (window).pluginTextToImage).mockResolvedValue({
        status: "fetch_failure",
      });

      await expect(visual_engine.generate("test prompt")).rejects.toThrow(
        "Text-to-image failed: fetch_failure",
      );
    } finally {
      visual_engine.retryer.maxAttempts = originalMaxAttempts;
    }
  });

  it("should handle error field in resolved object", async () => {
    const originalMaxAttempts = visual_engine.retryer.maxAttempts;
    visual_engine.retryer.maxAttempts = 1;

    try {
      vi.mocked(/** @type {any} */ (window).pluginTextToImage).mockResolvedValue({
        error: "GPU temperature exceeded limit",
      });

      await expect(visual_engine.generate("test prompt")).rejects.toThrow(
        "Text-to-image failed: GPU temperature exceeded limit",
      );
    } finally {
      visual_engine.retryer.maxAttempts = originalMaxAttempts;
    }
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

  describe("upload()", () => {
    it("should successfully upload an image using the perchance plugin", async () => {
      const mockDataUrl = "data:image/png;base64,upload123";
      // @ts-ignore
      window.pluginUpload = vi.fn((callback) => {
        callback(mockDataUrl);
      });

      const result = await visual_engine.upload();

      expect(result).toBe(mockDataUrl);
      // @ts-ignore
      expect(window.pluginUpload).toHaveBeenCalled();
    });

    it("should return null gracefully when pluginUpload is missing and local picker cancels", async () => {
      // @ts-ignore
      const originalPluginUpload = window.pluginUpload;
      // @ts-ignore
      delete window.pluginUpload;

      // Mock document.createElement to simulate cancellation
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockImplementation((tagName) => {
        if (tagName === "input") {
          const input = {
            type: "",
            accept: "",
            oncancel: /** @type {Function | null} */ (null),
            click: vi.fn(() => {
              if (input.oncancel) input.oncancel();
            }),
          };
          return input;
        }
        return originalCreateElement.call(document, tagName);
      });

      const result = await visual_engine.upload();

      expect(result).toBeNull();

      // Restore
      document.createElement = originalCreateElement;
      // @ts-ignore
      window.pluginUpload = originalPluginUpload;
    });

    it("should successfully upload an image via local fallback if pluginUpload is missing", async () => {
      // @ts-ignore
      const originalPluginUpload = window.pluginUpload;
      // @ts-ignore
      delete window.pluginUpload;

      const mockDataUrl = "data:image/png;base64,local123";
      const mockFile = new File(["dummy content"], "avatar.png", { type: "image/png" });

      // Stub FileReader via vi.stubGlobal so globalThis.FileReader is intercepted
      vi.stubGlobal(
        "FileReader",
        class MockFileReader {
          onload = /** @type {any} */ (null);
          onerror = /** @type {any} */ (null);
          /** @param {File} _file */
          readAsDataURL(_file) {
            if (this.onload) this.onload({ target: { result: mockDataUrl } });
          }
        },
      );

      // Mock document.createElement to simulate selecting a file
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = vi.fn().mockImplementation((tagName) => {
        if (tagName === "input") {
          return {
            type: "",
            accept: "",
            onchange: /** @type {any} */ (null),
            oncancel: /** @type {any} */ (null),
            click() {
              if (this.onchange) this.onchange({ target: { files: [mockFile] } });
            },
          };
        }
        return originalCreateElement(tagName);
      });

      const result = await visual_engine.upload();

      expect(result).toBe(mockDataUrl);

      // Restore
      document.createElement = originalCreateElement;
      vi.unstubAllGlobals(); // only FileReader was stubbed here
      // @ts-ignore
      window.pluginUpload = originalPluginUpload;
    });

    it("should return null gracefully when pluginUpload throws an exception", async () => {
      // @ts-ignore
      window.pluginUpload = vi.fn(() => {
        throw new Error("File dialog cancelled or blocked");
      });

      const result = await visual_engine.upload();

      expect(result).toBeNull();
    });
  });
});
