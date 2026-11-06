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
  visual_engine,
} from "./visual.js";
import { llm_service } from "@platform";

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

  describe("visual_engine.enhance", () => {
    it("bypasses LLM refinement when style has llm_refine === false", async () => {
      const spy = vi.spyOn(llm_service, "generate");
      const result = await visual_engine.enhance("A raw photographic snapshot", "character", {
        visual_style: "none",
      });

      expect(spy).not.toHaveBeenCalled();
      expect(result.prompt).toBe("A raw photographic snapshot");
      expect(result.negative_prompt).toBeDefined();
    });

    it("routes through LLM visualizer core and parses structured JSON output", async () => {
      const mock_json = JSON.stringify({
        _thought_process: "Framing close portrait",
        prompt: "A detailed cinematic portrait of the protagonist with ambient backlighting",
        negative_prompt: "blurry, low quality",
        resolution: "512x768",
      });
      const spy = vi.spyOn(llm_service, "generate").mockResolvedValue(mock_json);

      const result = await visual_engine.enhance("Rough concept of a hero", "character", {
        name: "Aria",
        visual_style: "cinematic",
      });

      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          role: "model",
          system: expect.stringContaining("Aesthetic Direction"),
          startWith: expect.stringContaining("Aesthetic Style:"),
        }),
        expect.any(Object),
      );
      expect(spy.mock.lastCall[0].startWith).toContain("Rough concept of a hero");
      expect(result.prompt).toBe("A detailed cinematic portrait of the protagonist with ambient backlighting");
      expect(result.negative_prompt).toContain("blurry, low quality");
      expect(result.negative_prompt).toContain("amateur photo");
      expect(result.resolution).toBe("512x768");
      spy.mockRestore();
    });

    it("passes bare prefill to llm_service.generate when camera_note has no style cues or is empty", async () => {
      // Direct unit check on PURPOSE_CORES.visualizer.start_with
      const { PURPOSE_CORES } = await import("../engine/prompts.js");
      expect(PURPOSE_CORES.visualizer.start_with()).toBe('{"_thought_process": "');
      expect(PURPOSE_CORES.visualizer.start_with({})).toBe('{"_thought_process": "');
      expect(PURPOSE_CORES.visualizer.start_with({ camera_note: "" })).toBe('{"_thought_process": "');
      expect(PURPOSE_CORES.visualizer.start_with({ camera_note: "   " })).toBe('{"_thought_process": "');
      expect(PURPOSE_CORES.visualizer.start_with({ camera_note: "Hero | Aesthetic Style: photo" })).toContain("Aesthetic Style: photo");
    });

    it("respects explicit app_style parameter over entity.visual_style precedence", async () => {
      const mock_json = JSON.stringify({
        _thought_process: "Photographic portrait",
        prompt: "RAW candid photograph of the protagonist",
        negative_prompt: "studio lighting",
        resolution: "512x768",
      });
      const spy = vi.spyOn(llm_service, "generate").mockResolvedValue(mock_json);

      const result = await visual_engine.enhance(
        "A photo",
        "character",
        {
          name: "Orion",
          visual_style: "pulp", // entity specifies pulp
        },
        "photo", // app-level explicitly requests photo
      );

      expect(result.prompt).toBe("RAW candid photograph of the protagonist");
      expect(result.negative_prompt).toContain("studio lighting");
      // Negative prompt should retain photo's style definition exclusions
      expect(result.negative_prompt).toContain("anime, illustration");
      spy.mockRestore();
    });
  });
});
