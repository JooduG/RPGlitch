import { beforeEach, describe, expect, it, vi } from "vitest";
import { visual_engine } from "@media";
import {
  close_image_preview,
  close_regenerate,
  image_picker,
  image_preview,
  open_image_preview,
  open_picker,
  run_image_regeneration,
  select_candidate,
} from "./ImagePreview.svelte.js";

describe("ImagePreview.svelte.js controller", () => {
  beforeEach(() => {
    close_image_preview();
    close_regenerate();
    vi.restoreAllMocks();
  });

  it("opens and closes lightbox preview state", () => {
    open_image_preview("data:image/png;base64,ABC", "Caption");
    expect(image_preview.active).toBe(true);
    expect(image_preview.src).toBe("data:image/png;base64,ABC");
    expect(image_preview.caption).toBe("Caption");

    close_image_preview();
    expect(image_preview.active).toBe(false);
  });

  it("errors cleanly when regenerating without context or prompt", async () => {
    await run_image_regeneration({});
    expect(image_picker.error).toContain("No image context");

    await run_image_regeneration({ key: "msg-1:0", prompt: "" });
    expect(image_picker.error).toContain("No prompt found");
  });

  it("generates candidates, opens picker, and invokes on_select", async () => {
    vi.spyOn(visual_engine, "generate_candidates").mockResolvedValue([
      { index: 0, url: "url-1", metadata: { seed: 1 } },
      { index: 1, url: "url-2", metadata: { seed: 2 } },
    ]);
    const on_select = vi.fn();

    await run_image_regeneration({ key: "msg-1:0", prompt: "A detailed neon alleyway scene in the rain", mode: "story_scene", on_select });

    expect(image_picker.isReady("msg-1:0")).toBe(true);
    open_picker();
    expect(image_picker.picker_open).toBe(true);

    select_candidate(1);
    expect(on_select).toHaveBeenCalledWith(expect.objectContaining({ url: "url-2" }), 1);
  });
});
