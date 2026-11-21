/**
 * @file src/media/image-generation.test.js
 * Unit tests verifying Perchance image dispatcher, VisualEngine, queue/in-flight bookkeeping, and ghost sweeps.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clear_generation_in_flight,
  count_pending_ghosts,
  dispatch_visual_generation,
  find_image_engine,
  get_image_generation_queue,
  is_generation_in_flight,
  mark_generation_in_flight,
  mark_placeholder_failed,
  reset_cached_image_engine,
  reset_generation_in_flight,
  reset_image_generation_queue,
  spawn_image_beat,
  sweep_stale_ghosts,
  visual_engine,
} from "./image-generation.js";

describe("image-generation", () => {
  beforeEach(() => {
    reset_cached_image_engine();
    reset_generation_in_flight();
    reset_image_generation_queue();
  });

  afterEach(() => {
    delete window.generate_image;
    vi.restoreAllMocks();
  });

  it("discovers and caches host image engine on window", () => {
    const mock_fn = vi.fn();
    window.generate_image = mock_fn;
    expect(find_image_engine()).toBe(mock_fn);

    delete window.generate_image;
    expect(find_image_engine()).toBe(mock_fn);

    reset_cached_image_engine();
    expect(find_image_engine()).toBeNull();
  });

  it("returns an offline SVG fallback when no host engine is available", async () => {
    const res = await dispatch_visual_generation({ prompt: "Neon {city} [alley] @USER", resolution: "512x768" });
    expect(res.image_url.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(res.metadata.offline).toBe(true);
    expect(res.metadata.resolution).toBe("512x768");
  });

  it("dispatches sanitized prompt payloads to the host engine and returns snake_case fields", async () => {
    const engine = vi.fn().mockResolvedValue({ dataUrl: "data:image/png;base64,AAA" });
    const res = await visual_engine.visualize("A {rainy} [street] @AI", "story_scene", { engine }, {});
    expect(engine).toHaveBeenCalledTimes(1);
    const sent = engine.mock.calls[0][0];
    expect(sent.prompt).not.toContain("{");
    expect(sent.prompt).not.toContain("}");
    expect(sent.prompt).not.toContain("[");
    expect(sent.prompt).not.toContain("]");
    expect(res.image_url).toBe("data:image/png;base64,AAA");
    expect(typeof res.refined_prompt).toBe("string");
  });

  it("tracks in-flight generation keys cleanly", () => {
    mark_generation_in_flight("msg-1", 0);
    expect(is_generation_in_flight("msg-1", 0)).toBe(true);
    expect(is_generation_in_flight("msg-1", 1)).toBe(false);
    clear_generation_in_flight("msg-1", 0);
    expect(is_generation_in_flight("msg-1", 0)).toBe(false);
  });

  it("counts pending ghosts and sweeps stale empty placeholders while sparing in-flight beats", async () => {
    const stale_ts = Date.now() - 200_000;
    const entries = [
      { id: "empty-stale", text: "", created_at: stale_ts, attachments: [{ src: null, metadata: { requested_at: stale_ts } }] },
      { id: "text-stale", text: "Narrative", created_at: stale_ts, attachments: [{ src: null, metadata: { requested_at: stale_ts } }] },
      { id: "in-flight", text: "", created_at: stale_ts, attachments: [{ src: null, metadata: { requested_at: stale_ts } }] },
    ];
    mark_generation_in_flight("in-flight", 0);

    const ctx = {
      session: {
        active_id: "s1",
        load_log: vi.fn().mockResolvedValue(entries),
        delete_entry: vi.fn().mockResolvedValue(true),
        update_attachment: vi.fn().mockResolvedValue(true),
        remove: vi.fn(),
      },
    };

    expect(await count_pending_ghosts(ctx)).toBe(3);
    await sweep_stale_ghosts(ctx);
    expect(ctx.session.delete_entry).toHaveBeenCalledWith("empty-stale");
    expect(ctx.session.delete_entry).not.toHaveBeenCalledWith("in-flight");
    expect(ctx.session.update_attachment).toHaveBeenCalledWith(
      "text-stale",
      0,
      expect.objectContaining({ src: null, metadata: expect.objectContaining({ failed: true, image_ghost_swept: true }) }),
    );
  });

  it("marks narrative placeholder as failed without deleting text entry", async () => {
    const ctx = {
      session: {
        active_id: "s1",
        feed: [{ id: 42, story_id: "s1", text: "Keep this prose" }],
        remove: vi.fn(),
        update_attachment: vi.fn(),
        delete_entry: vi.fn(),
      },
    };
    await mark_placeholder_failed(42, { mode: "story_scene" }, ctx);
    expect(ctx.session.update_attachment).toHaveBeenCalledWith(42, 0, expect.objectContaining({ src: null }));
    expect(ctx.session.delete_entry).not.toHaveBeenCalled();
  });

  it("spawns and resolves an image beat via injected engine", async () => {
    const custom_engine = {
      visualize: vi.fn().mockResolvedValue({ image_url: "data:image/png;base64,OK", refined_prompt: "refined", metadata: { resolution: "512x768" } }),
    };
    const ctx = {
      app: { settings: {} },
      session: {
        active_id: "s1",
        active_fractal: { name: "Nova" },
        load_log: vi.fn().mockResolvedValue([]),
        log_message: vi.fn().mockResolvedValue({ id: "beat-1" }),
        update_attachment: vi.fn().mockResolvedValue(true),
        remove: vi.fn(),
      },
    };

    await spawn_image_beat("story_scene", { prompt: "A glowing console", engine: custom_engine }, ctx);
    await vi.waitFor(() => {
      expect(ctx.session.update_attachment).toHaveBeenCalledWith("beat-1", 0, expect.objectContaining({ src: "data:image/png;base64,OK" }));
    });
    expect(get_image_generation_queue()).toHaveLength(0);
    expect(is_generation_in_flight("beat-1", 0)).toBe(false);
  });
});
