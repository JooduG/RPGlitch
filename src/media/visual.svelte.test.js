import { beforeEach, describe, expect, it, vi } from "vitest";
import { VisualEngine, reset_cached_image_engine } from "./visual.svelte.js";
import { llm_service } from "@platform";

vi.mock("@data", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    db: {
      stories: { get: vi.fn().mockResolvedValue(null) },
      simulation_log: {},
    },
    detox_prose: (text) => text,
    entities: {},
    VISUAL_STYLES: {
      none: {
        id: "none",
        name: "No Visual Style",
        tags: ["none"],
        engine: {},
        negative_prompt: "blurry, low resolution, bad anatomy, distorted features",
      },
    },
    resolve_portrait_visual_style_key: vi.fn().mockReturnValue("none"),
    resolve_story_visual_style_key: vi.fn().mockReturnValue("none"),
    SIGNATURE_COLORS: [
      "Adrenaline Pink",
      "Crimson Red",
      "Deep Indigo",
      "Electric Cyan",
      "Emerald Green",
      "Forest Green",
      "Lemon Yellow",
      "Proud Purple",
      "Pumpkin Amber",
      "Rusty Orange",
      "Scientific Teal",
      "Soft Rose",
      "Space Blue",
      "Toxic Green",
      "Twilight Violet",
    ],
  };
});

vi.mock("@platform", () => ({
  llm_service: { generate: vi.fn() },
  sanitize_llm: (text) => text,
}));

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
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
  };
});

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

describe("VisualEngine.generate — fractal profile pictures render in landscape", () => {
  let engine;

  beforeEach(() => {
    reset_cached_image_engine();
    engine = new VisualEngine();
    window.generate_image = vi.fn().mockResolvedValue({ dataUrl: "data:image/png;base64,AA==" });
  });

  it("requests landscape 768x512 for a fractal solo_entity profile picture", async () => {
    await engine.generate("a neon-soaked alley at night", {
      mode: "solo_entity",
      _entity: { id: "fx-9", name: "Void", type: "fractal", modifiers: { prompt: "a neon-soaked alley at night" } },
      returnPayload: true,
    });

    expect(window.generate_image).toHaveBeenCalledTimes(1);
    expect(window.generate_image).toHaveBeenCalledWith(expect.objectContaining({ resolution: "768x512" }));
  });

  it("keeps portrait 512x768 for a character solo_entity profile picture", async () => {
    await engine.generate("a brooding solo portrait", {
      mode: "solo_entity",
      _entity: { id: "ai-1", name: "Viper", type: "character", modifiers: { prompt: "a brooding solo portrait" } },
      returnPayload: true,
    });

    expect(window.generate_image).toHaveBeenCalledTimes(1);
    expect(window.generate_image).toHaveBeenCalledWith(expect.objectContaining({ resolution: "512x768" }));
  });

  it("excludes character negative tokens for story_scene mode (R2, T3)", async () => {
    await engine.generate("an expansive mountain landscape with aurora", {
      mode: "story_scene",
      returnPayload: true,
    });

    expect(window.generate_image).toHaveBeenCalledTimes(1);
    const call_args = window.generate_image.mock.calls[0][0];
    expect(call_args.negativePrompt).not.toContain("empty background");
    expect(call_args.negativePrompt).not.toContain("landscape without characters");
    expect(call_args.negativePrompt).not.toContain("no humans");
  });

  it("includes character negative tokens for story_character mode", async () => {
    await engine.generate("a close up of the warrior", {
      mode: "story_character",
      returnPayload: true,
    });

    expect(window.generate_image).toHaveBeenCalledTimes(1);
    const call_args = window.generate_image.mock.calls[0][0];
    expect(call_args.negativePrompt).toContain("empty background");
    expect(call_args.negativePrompt).toContain("landscape without characters");
    expect(call_args.negativePrompt).toContain("no humans");
  });

  it("includes VISUAL_STYLES.none negative tokens as baseline floor for all styled generations (F2, T5)", async () => {
    await engine.generate("an ancient temple", {
      mode: "story_scene",
      returnPayload: true,
    });

    expect(window.generate_image).toHaveBeenCalledTimes(1);
    const call_args = window.generate_image.mock.calls[0][0];
    expect(call_args.negativePrompt).toContain("blurry");
    expect(call_args.negativePrompt).toContain("bad anatomy");
    expect(call_args.negativePrompt).toContain("distorted features");
  });

  it("deduplicates negative tokens with case-folding and punctuation stripping (F5, T5)", async () => {
    await engine.generate("a cyberpunk street", {
      mode: "story_scene",
      negative_prompt: "3D render, 3d render, scanlines., scanlines, blurry",
      returnPayload: true,
    });

    expect(window.generate_image).toHaveBeenCalledTimes(1);
    const call_args = window.generate_image.mock.calls[0][0];
    const tokens = call_args.negativePrompt.split(",").map((t) => t.trim());
    const lower_tokens = tokens.map((t) => t.toLowerCase());
    const unique_tokens = new Set(lower_tokens);
    expect(tokens.length).toBe(unique_tokens.size);
    expect(lower_tokens.filter((t) => t === "3d render").length).toBe(1);
    expect(lower_tokens.filter((t) => t.startsWith("scanlines")).length).toBe(1);
  });
});
