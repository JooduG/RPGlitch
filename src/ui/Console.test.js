/**
 * @file src/ui/console/Console.test.js
 * Unit test suite verifying Console & settings state.
 */
import { describe, expect, it } from "vitest";

import { app } from "@state/interface.svelte.js";
import { runtime } from "@state/runtime.svelte.js";
import { session_driver } from "@data";

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

  it("preserves active story session when returning to storyboard view", async () => {
    const mock_story_id = "test-active-story-123";
    runtime.story_id = mock_story_id;
    await session_driver.set_active(mock_story_id);

    // Switch view to storyboard (same action triggered by Return to Storyboard)
    await app.set_view("storyboard");

    expect(app.view).toBe("storyboard");
    expect(runtime.story_id).toBe(mock_story_id);
    expect(session_driver.active_id).toBe(mock_story_id);
  });
});
