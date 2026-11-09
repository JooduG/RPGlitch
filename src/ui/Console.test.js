/**
 * @file src/ui/Console.test.js
 * Unit test suite verifying Console & settings state.
 */
import { describe, expect, it, vi } from "vitest";
import { render, act } from "@testing-library/svelte";

import { app } from "./interface.svelte.js";
import { runtime } from "@engine";
import { session_driver } from "@storage";
import Console from "./Console.svelte";
import * as engine from "@engine";

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

  it("triggers ghostwriter exactly once per request and prevents loop", async () => {
    const ghostwriter_spy = vi.spyOn(engine, "execute_ghostwriter").mockResolvedValue("Generated ghost text");
    app.view = "storymode";
    app.ghostwrite_request = 0;

    render(Console);

    // Initial state: not triggered
    expect(ghostwriter_spy).toHaveBeenCalledTimes(0);

    // Trigger request 1
    await act(() => {
      app.ghostwrite_request++;
    });

    expect(ghostwriter_spy).toHaveBeenCalledTimes(1);

    // Wait for resolution
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Verify it didn't re-fire on completion writes
    expect(ghostwriter_spy).toHaveBeenCalledTimes(1);

    // Trigger request 2
    await act(() => {
      app.ghostwrite_request++;
    });

    expect(ghostwriter_spy).toHaveBeenCalledTimes(2);

    ghostwriter_spy.mockRestore();
  });
});
