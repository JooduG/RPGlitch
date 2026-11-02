/**
 * @file src/media/visual.test.js
 * Unit tests for Sensory Cortex — Stateless Perchance Image Dispatcher
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  dispatch_visual_generation,
  find_image_engine,
  reset_cached_image_engine,
  mark_generation_in_flight,
  clear_generation_in_flight,
  is_generation_in_flight,
  reset_generation_in_flight,
  reset_image_generation_queue,
} from "./visual.js";

describe("visual.js — Stateless Perchance Image Dispatcher", () => {
  beforeEach(() => {
    reset_cached_image_engine();
    reset_generation_in_flight();
    reset_image_generation_queue();
    delete window.pluginGenerateImage;
    delete window.generate_image;
  });

  describe("host engine discovery", () => {
    it("returns null when window has no image plugins", () => {
      expect(find_image_engine()).toBeNull();
    });

    it("detects and caches window.pluginGenerateImage", () => {
      const mock_engine = vi.fn();
      window.pluginGenerateImage = mock_engine;
      expect(find_image_engine()).toBe(mock_engine);
    });

    it("detects and caches window.generate_image", () => {
      const mock_engine = vi.fn();
      window.generate_image = mock_engine;
      expect(find_image_engine()).toBe(mock_engine);
    });
  });

  describe("dispatch_visual_generation", () => {
    it("returns offline SVG fallback when no engine is available", async () => {
      const result = await dispatch_visual_generation({ prompt: "A dark cyberpunk alley" });
      expect(result.image_url).toMatch(/^data:image\/svg\+xml/);
      expect(result.metadata.offline).toBe(true);
      expect(result.seed).toBeDefined();
    });

    it("dispatches to injected mock engine and formats response", async () => {
      const mock_engine = vi.fn().mockResolvedValue("https://example.com/test.jpg");
      const result = await dispatch_visual_generation(
        { prompt: "Cybernetic warrior", resolution: "768x512", guidance_scale: 8, seed: 12345 },
        { engine: mock_engine },
      );

      expect(mock_engine).toHaveBeenCalledWith({
        prompt: "Cybernetic warrior",
        negativePrompt: "",
        resolution: "768x512",
        guidanceScale: 8,
        seed: 12345,
      });
      expect(result.image_url).toBe("https://example.com/test.jpg");
      expect(result.seed).toBe(12345);
      expect(result.metadata.offline).toBe(false);
    });

    it("handles AbortSignal cancellation", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(dispatch_visual_generation({ prompt: "Aborted request" }, { signal: controller.signal })).rejects.toThrow();
    });
  });

  describe("in-flight bookkeeping", () => {
    it("tracks in-flight generations accurately", () => {
      expect(is_generation_in_flight("entry-1", 0)).toBe(false);
      mark_generation_in_flight("entry-1", 0);
      expect(is_generation_in_flight("entry-1", 0)).toBe(true);
      clear_generation_in_flight("entry-1", 0);
      expect(is_generation_in_flight("entry-1", 0)).toBe(false);
    });

    it("resets all in-flight trackers", () => {
      mark_generation_in_flight("entry-1", 0);
      mark_generation_in_flight("entry-2", 0);
      reset_generation_in_flight();
      expect(is_generation_in_flight("entry-1", 0)).toBe(false);
      expect(is_generation_in_flight("entry-2", 0)).toBe(false);
    });
  });
});
