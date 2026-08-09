/**
 * @file src/ui/console/Console.test.js
 * Unit test suite verifying Console & settings state.
 */
import { describe, expect, it } from "vitest";

import { app } from "../../state/app.svelte.js";

describe("Console & Settings State", () => {
  it("merges dev_grid_visible into dev_mode setting", () => {
    app.settings.dev_mode = true;
    app.save_settings();
    expect(app.settings.dev_grid_visible).toBe(true);

    app.settings.dev_mode = false;
    app.save_settings();
    expect(app.settings.dev_grid_visible).toBe(false);
  });
});
