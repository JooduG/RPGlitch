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

  it("tracks storyboard slot selections and clears claimed selections", () => {
    app.select_entity("ai", { id: "ai-1", name: "Orion", type: "character" });
    app.select_entity("user", { id: "user-1", name: "You", type: "character" });
    app.select_entity("fractal", { id: "frac-1", name: "Nova", type: "fractal" });

    expect(app.selected_ai?.id).toBe("ai-1");
    expect(app.selected_user?.id).toBe("user-1");
    expect(app.selected_fractal?.id).toBe("frac-1");

    app.claimed_entity_ids.add("ai-1");
    app.clean_claimed_selections();
    expect(app.selected_ai).toBeNull();
  });
});
