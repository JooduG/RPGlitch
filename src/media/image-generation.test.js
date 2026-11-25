/**
 * @file src/media/image-generation.test.js
 * Unit tests verifying Perchance image dispatcher, visual_engine, in-flight bookkeeping, and ghost sweeps.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clear_generation_in_flight, mark_generation_in_flight, reset_generation_in_flight, sweep_stale_ghosts, visual_engine } from "./image-generation.js";

describe("image-generation", () => {
  beforeEach(() => {
    reset_generation_in_flight();
  });

  afterEach(() => {
    delete window.generate_image;
    vi.restoreAllMocks();
  });

  it("returns an offline SVG fallback with seed metadata when no host engine is available", async () => {
    const res = await visual_engine.generate("Neon {city} [alley] @USER", { resolution: "512x768" });
    expect(res.image_url.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(res.metadata.offline).toBe(true);
    expect(res.metadata.resolution).toBe("512x768");
    expect(typeof res.metadata.seed).toBe("number");
  });

  it("discovers window.generate_image, sanitizes payloads, and propagates inputs.seed", async () => {
    const mock_fn = vi.fn().mockResolvedValue({ dataUrl: "data:image/png;base64,AAA", inputs: { seed: 4242 } });
    window.generate_image = mock_fn;

    const res = await visual_engine.generate("A {rainy} [street] @AI", { mode: "story_scene" });
    expect(mock_fn).toHaveBeenCalledTimes(1);
    const sent = mock_fn.mock.calls[0][0];
    expect(sent.prompt).not.toContain("{");
    expect(sent.prompt).not.toContain("}");
    expect(sent.prompt).not.toContain("[");
    expect(sent.prompt).not.toContain("]");
    expect(sent.prompt).not.toContain("@");
    expect(res.image_url).toBe("data:image/png;base64,AAA");
    expect(res.seed).toBe(4242);
    expect(res.metadata.seed).toBe(4242);
  });

  it("rejects immediately with AbortError when signal is aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const engine = vi.fn();

    await expect(visual_engine.generate("A portrait", { signal: controller.signal, engine })).rejects.toMatchObject({ name: "AbortError" });
    expect(engine).not.toHaveBeenCalled();
  });

  it("sweeps stale placeholders in one pass while sparing in-flight beats and returning remaining pending count", async () => {
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
      },
    };

    expect(await sweep_stale_ghosts(ctx)).toBe(1);
    expect(ctx.session.delete_entry).toHaveBeenCalledWith("empty-stale");
    expect(ctx.session.delete_entry).not.toHaveBeenCalledWith("in-flight");
    expect(ctx.session.update_attachment).toHaveBeenCalledWith(
      "text-stale",
      0,
      expect.objectContaining({ src: null, metadata: expect.objectContaining({ failed: true, image_ghost_swept: true }) }),
    );

    clear_generation_in_flight("in-flight", 0);
    expect(await sweep_stale_ghosts(ctx)).toBe(0);
  });
});
