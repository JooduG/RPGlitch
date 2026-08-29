/**
 * @file src/ui/console/Console.test.js
 * Unit test suite verifying Console & settings state.
 */
import { describe, expect, it } from "vitest";

import { app } from "@state/interface.svelte.js";

describe("Console & Settings State", () => {
  it("keeps dev_grid_visible decoupled from dev_mode (independent toggles)", async () => {
    app.settings.dev_mode = true;
    app.settings.dev_grid_visible = false;
    await app.save_settings();
    expect(app.settings.dev_grid_visible).toBe(false);

    app.settings.dev_mode = false;
    app.settings.dev_grid_visible = true;
    await app.save_settings();
    expect(app.settings.dev_grid_visible).toBe(true);
  });
});
