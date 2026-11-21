import { beforeEach, describe, expect, it } from "vitest";
import { app, InterfaceStore } from "./interface.svelte.js";

describe("InterfaceStore (app)", () => {
  beforeEach(() => {
    app.selected_ai = null;
    app.selected_user = null;
    app.selected_fractal = null;
    app.claimed_entity_ids.clear();
    app.view = "storyboard";
    app.ghostwrite_request = 0;
  });

  it("exports a singleton app instance with clean default state", () => {
    expect(app).toBeInstanceOf(InterfaceStore);
    expect(app.view).toBe("storyboard");
    expect(app.settings).toEqual({ call_mode: false, auto_scroll: true, dev_mode: false, dev_grid_visible: false, visual_style: "none" });
  });

  it("tracks storyboard slot readiness and clears claimed selections", () => {
    expect(app.selected_count).toBe(0);
    expect(app.is_ready).toBe(false);

    app.select_entity("ai", { id: "ai-1", name: "Orion", type: "character" });
    app.select_entity("user", { id: "user-1", name: "You", type: "character" });
    app.select_entity("fractal", { id: "frac-1", name: "Nova", type: "fractal" });

    expect(app.selected_count).toBe(3);
    expect(app.is_ready).toBe(true);

    app.claimed_entity_ids.add("ai-1");
    app.clean_claimed_selections();
    expect(app.selected_ai).toBeNull();
    expect(app.selected_count).toBe(2);
    expect(app.is_ready).toBe(false);
  });

  it("increments ghostwrite_request via request_ghostwrite()", () => {
    app.request_ghostwrite();
    app.request_ghostwrite();
    expect(app.ghostwrite_request).toBe(2);
  });
});
