import { beforeEach, describe, expect, it, vi } from "vitest";
import { VisualEngine } from "./visual.svelte.js";
import { llm_service } from "@platform";

vi.mock("@data", () => ({
  db: {
    stories: { get: vi.fn().mockResolvedValue(null) },
    simulation_log: {},
  },
  detox_prose: (text) => text,
  entities: {},
  VISUAL_STYLES: {
    none: { id: "none", name: "No Visual Style", category: "None", tags: ["none"], visual_engine: "", negative_prompt: "" },
  },
}));

vi.mock("@platform", () => ({
  llm_service: { generate: vi.fn() },
  sanitize_llm: (text) => text,
}));

vi.mock("@utils", () => ({
  generate_secure_seed: vi.fn(() => 42),
  strip_cognition_blocks: (text) => text,
  escape_xml: (text) =>
    String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      .replace(/\[/g, "&#91;")
      .replace(/\]/g, "&#93;"),
  prompt_escape: (text) =>
    String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;"),
  safe_parse_pseudo_json: (raw) => {
    if (typeof raw !== "string") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return { __raw_prose__: raw };
    }
  },
  PROTOCOL_LIBRARY: {
    OPTICS: {
      NEGATIVE_PROMPT: "blurry, low quality, watermark, distorted",
      BUILDER_PROTOCOL: "<VISUAL_ENGINE>Emit a structured visual build directive.</VISUAL_ENGINE>",
    },
    FORMATS: { JSON_ONLY: "Return ONLY valid JSON." },
  },
  state_bridge: {
    runtime: {
      active_story: null,
      active_ai: { id: "ai-1", name: "Viper", type: "character" },
      active_user: { id: "user-1", name: "Ghost", type: "user" },
      active_fractal: { id: "fx-1", name: "Void", type: "fractal" },
    },
    app: { selected_ai: null, selected_user: null, selected_fractal: null, settings: {} },
    simulation_state: { start_typing: vi.fn() },
    simulation_log: { update: vi.fn() },
  },
}));

describe("VisualEngine.visualize — solo_entity _entity propagation", () => {
  let engine;

  beforeEach(() => {
    engine = new VisualEngine();
    engine.generate = vi.fn().mockResolvedValue({ url: "https://img.test/solo.png", metadata: {} });
    vi.mocked(llm_service.generate).mockResolvedValue(
      JSON.stringify({ prompt: "A moody solo portrait of Viper, dramatic lighting", negative_prompt: "blurry" }),
    );
  });

  it("propagates the resolved entity as generate_options._entity for solo_entity tiers", async () => {
    const result = await engine.visualize("story-1", "A tense pause in the neon rain.", "solo_entity", { silent: true });

    expect(result.imageUrl).toBe("https://img.test/solo.png");
    expect(engine.generate).toHaveBeenCalledTimes(1);
    expect(engine.generate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        mode: "solo_entity",
        _entity: expect.objectContaining({ id: "ai-1", name: "Viper" }),
      }),
    );
  });

  it("does not attach _entity for story tiers, keeping story style resolution intact", async () => {
    await engine.visualize("story-1", "The vault door slams shut.", "story_scene", { silent: true });

    expect(engine.generate).toHaveBeenCalledTimes(1);
    const [, generate_options] = engine.generate.mock.calls[0];
    expect(generate_options.mode).toBe("story_scene");
    expect(generate_options).not.toHaveProperty("_entity");
  });
});
