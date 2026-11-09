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
  resolve_story_beat_style,
  compose_story_beat_prompt,
} from "./visual.js";
import { llm_service } from "@engine";

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

  describe("visual_engine.envision", () => {
    it("bypasses LLM refinement when style has llm_refine === false", async () => {
      const spy = vi.spyOn(llm_service, "generate");
      const result = await visual_engine.envision("A raw photographic snapshot", "character", {
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

      const result = await visual_engine.envision("Rough concept of a hero", "character", {
        name: "Aria",
        visual_style: "cinematic",
      });

      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          role: "model",
          system: expect.stringContaining("Aesthetic Direction"),
          startWith: "<think>\n",
        }),
        expect.any(Object),
      );
      expect(result.prompt).toBe("A detailed cinematic portrait of the protagonist with ambient backlighting");
      expect(result.negative_prompt).toContain("blurry, low quality");
      expect(result.negative_prompt).toContain("amateur photo");
      expect(result.resolution).toBe("512x768");
      spy.mockRestore();
    });

    it("passes bare prefill to llm_service.generate when camera_note has no style cues or is empty", async () => {
      // Direct unit check on PURPOSE_CORES.visualizer.start_with
      const { PURPOSE_CORES } = await import("../engine/prompts.js");
      expect(PURPOSE_CORES.visualizer.start_with()).toBe("<think>\n");
      expect(PURPOSE_CORES.visualizer.start_with({})).toBe("<think>\n");
      expect(PURPOSE_CORES.visualizer.start_with({ camera_note: "" })).toBe("<think>\n");
      expect(PURPOSE_CORES.visualizer.start_with({ camera_note: "   " })).toBe("<think>\n");
      expect(PURPOSE_CORES.visualizer.start_with({ camera_note: "Hero | Aesthetic Style: photo" })).toBe("<think>\n");
    });

    it("respects explicit app_style parameter over entity.visual_style precedence", async () => {
      const mock_json = JSON.stringify({
        _thought_process: "Photographic portrait",
        prompt: "RAW candid photograph of the protagonist",
        negative_prompt: "studio lighting",
        resolution: "512x768",
      });
      const spy = vi.spyOn(llm_service, "generate").mockResolvedValue(mock_json);

      const result = await visual_engine.envision(
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

    it("strips prefill echo with raw newlines in continuation and returns parsed prose", async () => {
      const prefill = '{"_thought_process": "Hero | Aesthetic Style: photo. ';
      // Continuation contains raw newlines in the thought process and a valid prompt
      const continuation = `Evaluating character traits...
Line 2 of thoughts
Line 3 of thoughts",
  "prompt": "Authentic candid snapshot of the hero in sunlight",
  "negative_prompt": "blurry, low quality"
}`;
      const full_response = prefill + continuation;
      const spy = vi.spyOn(llm_service, "generate").mockResolvedValue(full_response);

      const result = await visual_engine.envision("Hero", "character", {
        name: "Aria",
        visual_style: "photo",
      });

      expect(result.prompt).toBe("Authentic candid snapshot of the hero in sunlight");
      expect(result.prompt).not.toContain("_thought_process");
      expect(result.negative_prompt).toContain("blurry, low quality");
      spy.mockRestore();
    });

    it("falls back to original draft when model only echoes prefill or contains unusable thought markers", async () => {
      const prefill_echo_only = '{"_thought_process": "Some unusable thought process. ';
      const spy = vi.spyOn(llm_service, "generate").mockResolvedValue(prefill_echo_only);

      const result = await visual_engine.envision("Draft character concept", "character", {
        name: "Aria",
        visual_style: "photo",
      });

      expect(result.prompt).toBe("Draft character concept");
      expect(result.prompt).not.toContain("_thought_process");
      spy.mockRestore();
    });

    it("derives resolution deterministically from tier mapping ignoring model's conflicting choice", async () => {
      const mock_json = JSON.stringify({
        _thought_process: "Portrait thought",
        prompt: "A warrior",
        negative_prompt: "blurry",
        resolution: "768x512", // Model conflictingly picked landscape for solo character
      });
      const spy = vi.spyOn(llm_service, "generate").mockResolvedValue(mock_json);

      // 1. solo_entity / character -> always portrait 512x768
      const char_result = await visual_engine.envision("A warrior", "solo_entity");
      expect(char_result.resolution).toBe("512x768");

      // 2. scene / fractal -> always landscape 768x512
      const scene_result = await visual_engine.envision("Ancient ruins", "story_scene");
      expect(scene_result.resolution).toBe("768x512");

      spy.mockRestore();
    });

    it("renders place-focused prompt instructions when subject is a place/fractal", async () => {
      let captured_system = "";
      const spy = vi.spyOn(llm_service, "generate").mockImplementation(async ({ system }) => {
        captured_system = system;
        return JSON.stringify({
          _thought_process: "Observing geometry and architecture",
          prompt: "Vast neon skyline under torrential rain with soaring spires",
          negative_prompt: "blurry",
        });
      });

      const result = await visual_engine.envision("Nova City skyline", "fractal", {
        name: "Nova City",
        type: "fractal",
        visual_style: "cinematic",
        eternal: { physical: "[FOUNDATION: built by Dr. Kaelen and corporate overlords]", non_physical: "Cyberpunk metropolis" },
      });

      expect(captured_system).toContain("The location and environment itself is the primary focal subject.");
      expect(captured_system).toContain("Place Staging Mandate");
      expect(result.prompt).toBe("Vast neon skyline under torrential rain with soaring spires");
      spy.mockRestore();
    });

    it("strips @TARGET tokens from model output preserving the display name", async () => {
      const mock_json = JSON.stringify({
        _thought_process: "Character interaction scene",
        prompt: "A dramatic confrontation between @ORION and @GLITCH in the dark alleyway",
        negative_prompt: "blurry",
      });
      const spy = vi.spyOn(llm_service, "generate").mockResolvedValue(mock_json);

      const result = await visual_engine.envision("Street showdown", "story_scene", {
        visual_style: "cinematic",
      });

      expect(result.prompt).toBe("A dramatic confrontation between ORION and GLITCH in the dark alleyway");
      expect(result.prompt).not.toContain("@ORION");
      expect(result.prompt).not.toContain("@GLITCH");
      spy.mockRestore();
    });

    it("composes story beat prompt with visual staging and style tokens", () => {
      const composed = compose_story_beat_prompt("A knight in an alleyway", "cyberpunk", "blurry");
      expect(composed.prompt).toContain("A knight in an alleyway");
      expect(composed.prompt).toContain("neon");
      expect(composed.negative_prompt).toContain("blurry");
    });

    it("resolves story beat visual style with proper precedence", () => {
      expect(resolve_story_beat_style({ style: "noir" })).toBe("noir");
      expect(resolve_story_beat_style({ entity: { visual_style: "manga" } })).toBe("manga");
      expect(resolve_story_beat_style({})).toBe("none");
    });
  });
});
