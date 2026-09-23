import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  VisualEngine,
  reset_cached_image_engine,
  count_pending_ghosts,
  sweep_stale_ghosts,
  mark_placeholder_failed,
  spawn_image_beat,
  _image_generation_queue,
  _remove_from_image_generation_queue,
  get_image_generation_queue,
  reset_image_generation_queue,
  mark_generation_in_flight,
  clear_generation_in_flight,
  reset_generation_in_flight,
  IMAGE_GENERATION_QUEUE_CAPACITY,
  IMAGE_PLACEHOLDER_HARD_CAP,
  IMAGE_GHOST_MAX_AGE_MS,
  IMAGE_RESOLVE_TIMEOUT_MS,
} from "./visual.svelte.js";
import { llm_service } from "@platform";
import { register_state_accessors, reset_bridges_for_testing } from "@utils";

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
      get runtime() {
        return (
          actual.state_bridge.runtime ?? {
            active_story: null,
            active_ai: { id: "ai-1", name: "Viper", type: "character" },
            active_user: { id: "user-1", name: "Ghost", type: "user" },
            active_fractal: { id: "fx-1", name: "Void", type: "fractal" },
          }
        );
      },
      get app() {
        return actual.state_bridge.app ?? { selected_ai: null, selected_user: null, selected_fractal: null, settings: {} };
      },
      get simulation_state() {
        return actual.state_bridge.simulation_state ?? { start_typing: vi.fn() };
      },
      get simulation_log() {
        return actual.state_bridge.simulation_log ?? { update: vi.fn() };
      },
      get session_driver() {
        return actual.state_bridge.session_driver ?? null;
      },
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

describe("VisualEngine optics envelope — the compiled <TASK> reaches the LLM", () => {
  let engine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new VisualEngine();
    engine.generate = vi.fn().mockResolvedValue({ url: "https://img.test/scene.png", metadata: {} });
    vi.mocked(llm_service.generate).mockResolvedValue(
      JSON.stringify({ prompt: "A twilight forest below a marble palace", negative_prompt: "blurry" }),
    );
  });

  it("forwards the <TASK> package during visualize()", async () => {
    await engine.visualize("story-1", "The vault door slams shut.", "story_scene", { silent: true });

    expect(llm_service.generate).toHaveBeenCalledTimes(1);
    const [payload] = llm_service.generate.mock.calls[0];
    expect(payload.system).toContain('mode="optics"');
    expect(payload.task).toBeTruthy();
    expect(payload.task).toContain("<TASK>");
    expect(payload.task).toContain('<OUTPUT_FORMAT mode="json">');
    expect(payload.task).toContain('"negative_prompt"');
  });

  it("forwards the <TASK> package during enhance()", async () => {
    await engine.enhance("a lone wolf on a ridge", "story_character");

    expect(llm_service.generate).toHaveBeenCalledTimes(1);
    const [payload] = llm_service.generate.mock.calls[0];
    expect(payload.system).toContain('mode="optics"');
    expect(payload.task).toBeTruthy();
    expect(payload.task).toContain("<TASK>");
    expect(payload.task).toContain('<OUTPUT_FORMAT mode="json">');
  });
});

describe("VisualEngine image-beats (Placeholder & Generation Lifecycle)", () => {
  beforeEach(() => {
    reset_image_generation_queue();
    reset_generation_in_flight();
    reset_bridges_for_testing();
    vi.restoreAllMocks();
  });

  describe("constants & queue bounds", () => {
    it("exposes expected capacity bounds and timeouts", () => {
      expect(IMAGE_GENERATION_QUEUE_CAPACITY).toBe(5);
      expect(IMAGE_PLACEHOLDER_HARD_CAP).toBe(5);
      expect(IMAGE_GHOST_MAX_AGE_MS).toBe(120000);
      expect(IMAGE_RESOLVE_TIMEOUT_MS).toBe(120000);
    });

    it("get_image_generation_queue returns shallow snapshot and reset_image_generation_queue clears it", () => {
      _image_generation_queue.push({ id: 101, tier: "story_scene", source: "dynamics", metadata: {} });
      const snap = get_image_generation_queue();
      expect(snap).toHaveLength(1);
      expect(snap[0].id).toBe(101);

      reset_image_generation_queue();
      expect(get_image_generation_queue()).toHaveLength(0);
    });

    it("_remove_from_image_generation_queue removes entry by id", () => {
      _image_generation_queue.push({ id: 101, tier: "story_scene", source: "dynamics", metadata: {} });
      _image_generation_queue.push({ id: 102, tier: "story_character", source: "director", metadata: {} });

      _remove_from_image_generation_queue(101);
      expect(_image_generation_queue.length).toBe(1);
      expect(_image_generation_queue[0].id).toBe(102);

      _remove_from_image_generation_queue(999); // no-op
      expect(_image_generation_queue.length).toBe(1);
    });
  });

  describe("count_pending_ghosts", () => {
    it("returns 0 when runtime has no story_id", async () => {
      register_state_accessors({
        runtime: { story_id: null },
      });
      const count = await count_pending_ghosts();
      expect(count).toBe(0);
    });

    it("counts unresolved attachments without failed flag", async () => {
      const mock_entries = [
        { id: 1, attachments: [{ src: "https://example.com/a.png" }] },
        { id: 2, attachments: [{ src: null, metadata: {} }] },
        { id: 3, attachments: [{ src: null, metadata: { failed: true } }] },
        {
          id: 4,
          attachments: [
            { src: null, metadata: {} },
            { src: null, metadata: {} },
          ],
        },
      ];

      register_state_accessors({
        runtime: { story_id: "story-123" },
        session_driver: {
          load_log: vi.fn().mockResolvedValue(mock_entries),
        },
      });

      const count = await count_pending_ghosts();
      expect(count).toBe(3); // id 2 (1) + id 4 (2)
    });
  });

  describe("sweep_stale_ghosts", () => {
    it("deletes empty-text ghost rows and updates stale populated rows", async () => {
      const now = 200000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      const delete_mock = vi.fn().mockResolvedValue(true);
      const update_mock = vi.fn().mockResolvedValue(true);
      const remove_feed_mock = vi.fn();

      const mock_entries = [
        // Entry 1: Empty text and stale (> 120000ms) -> deleted
        { id: "ghost-1", text: "", created_at: now - 150000, attachments: [{ src: null, metadata: {} }] },
        // Entry 2: Populated text and stale -> updated with failed: true
        { id: "ghost-2", text: "Narrative description", created_at: now - 150000, attachments: [{ src: null, metadata: { mode: "story_scene" } }] },
        // Entry 3: Recent placeholder (< 120000ms) -> untouched
        { id: "ghost-3", text: "", created_at: now - 30000, attachments: [{ src: null, metadata: {} }] },
      ];

      register_state_accessors({
        runtime: { story_id: "story-123" },
        session_driver: {
          load_log: vi.fn().mockResolvedValue(mock_entries),
          delete_log_entry: delete_mock,
          update_log_attachment: update_mock,
        },
        simulation_log: {
          remove: remove_feed_mock,
        },
      });

      await sweep_stale_ghosts();

      expect(delete_mock).toHaveBeenCalledWith("ghost-1");
      expect(remove_feed_mock).toHaveBeenCalledWith("ghost-1");
      expect(update_mock).toHaveBeenCalledWith(
        "ghost-2",
        0,
        expect.objectContaining({
          src: null,
          metadata: expect.objectContaining({ failed: true, image_ghost_swept: true }),
        }),
      );
    });

    it("ages placeholders from requested_at, not the entry creation time", async () => {
      const now = 400000;
      vi.spyOn(Date, "now").mockReturnValue(now);
      const update_mock = vi.fn().mockResolvedValue(true);
      const mock_entries = [
        {
          id: "prologue",
          text: "A long prologue.",
          created_at: now - 180000,
          attachments: [{ src: null, metadata: { mode: "story_scene", requested_at: now - 5000 } }],
        },
      ];
      register_state_accessors({
        runtime: { story_id: "story-123" },
        session_driver: { load_log: vi.fn().mockResolvedValue(mock_entries), delete_log_entry: vi.fn(), update_log_attachment: update_mock },
        simulation_log: { remove: vi.fn() },
      });

      await sweep_stale_ghosts();

      expect(update_mock).not.toHaveBeenCalled();
    });

    it("never sweeps a placeholder whose generation is still in flight", async () => {
      const now = 400000;
      vi.spyOn(Date, "now").mockReturnValue(now);
      const update_mock = vi.fn().mockResolvedValue(true);
      const mock_entries = [
        { id: "inflight", text: "Narrative.", created_at: now - 300000, attachments: [{ src: null, metadata: { mode: "story_scene" } }] },
      ];
      register_state_accessors({
        runtime: { story_id: "story-123" },
        session_driver: { load_log: vi.fn().mockResolvedValue(mock_entries), delete_log_entry: vi.fn(), update_log_attachment: update_mock },
        simulation_log: { remove: vi.fn() },
      });
      mark_generation_in_flight("inflight", 0);

      await sweep_stale_ghosts();
      expect(update_mock).not.toHaveBeenCalled();

      clear_generation_in_flight("inflight", 0);
      await sweep_stale_ghosts();
      expect(update_mock).toHaveBeenCalledWith("inflight", 0, expect.objectContaining({ metadata: expect.objectContaining({ failed: true }) }));
    });
  });

  describe("mark_placeholder_failed", () => {
    it("updates attachment if the entry has narrative text", async () => {
      const update_mock = vi.fn().mockResolvedValue(true);
      register_state_accessors({
        simulation_log: {
          feed: [{ id: 42, text: "A detailed story description." }],
        },
        session_driver: {
          update_log_attachment: update_mock,
        },
      });

      await mark_placeholder_failed(42, { mode: "solo_entity" });

      expect(update_mock).toHaveBeenCalledWith(42, 0, {
        src: null,
        metadata: expect.objectContaining({ mode: "solo_entity", failed: true }),
      });
    });

    it("deletes entry entirely if entry has no narrative text", async () => {
      const delete_mock = vi.fn().mockResolvedValue(true);
      const remove_mock = vi.fn();

      register_state_accessors({
        simulation_log: {
          feed: [{ id: 99, text: "   " }],
          remove: remove_mock,
        },
        session_driver: {
          delete_log_entry: delete_mock,
        },
      });

      await mark_placeholder_failed(99);

      expect(delete_mock).toHaveBeenCalledWith(99);
      expect(remove_mock).toHaveBeenCalledWith(99);
    });
  });

  describe("spawn_image_beat", () => {
    it("refuses invalid or unregistered tier names", async () => {
      const log_message_mock = vi.fn();
      register_state_accessors({
        session_driver: { log_message: log_message_mock },
      });

      await spawn_image_beat("invalid_tier");
      expect(log_message_mock).not.toHaveBeenCalled();
    });

    it("spawns placeholder and resolves image via visual_engine", async () => {
      const log_message_mock = vi.fn().mockResolvedValue({ id: "entry-1" });
      const update_mock = vi.fn().mockResolvedValue(true);
      const engine_instance = new VisualEngine();
      vi.spyOn(engine_instance, "visualize").mockResolvedValue({
        imageUrl: "data:image/png;base64,mockImage",
        refinedPrompt: "Hero standing in the storm",
        metadata: { seed: 12345 },
      });

      register_state_accessors({
        runtime: { story_id: "story-1", active_fractal: { name: "Neon City" } },
        session_driver: {
          load_log: vi.fn().mockResolvedValue([]),
          log_message: log_message_mock,
          update_log_attachment: update_mock,
        },
        simulation_log: { feed: [] },
      });

      await spawn_image_beat("story_scene", { prompt: "A cyberpunk city street" });

      expect(log_message_mock).toHaveBeenCalledWith("", "fractal", "Neon City", {
        turn_type: "SYSTEM_TURN",
        attachments: [
          {
            src: null,
            metadata: { mode: "story_scene", image_source: "dynamics", image_explicit: false, requested_at: expect.any(Number) },
          },
        ],
      });
    });
  });
});
