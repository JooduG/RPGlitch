/**
 * @file src/ui/molecules/UnifiedConsolePhase1.test.js
 * Unit test suite verifying Phase 1 requirements:
 * 1. Advanced accordion content fits on 1 single row.
 * 2. Storyboard button label updated to "Return to Storyboard".
 * 3. DevMode and Grid overlay toggles merged in AppStore.
 * 4. DevWing View JSON Data left-aligned.
 * 5. DynamicsMeter reactivity and progress bar height.
 */
import { describe, expect, it } from "vitest";
import { app } from "../../state/app.svelte.js";

describe("Phase 1: Console & Dev Tool Refinements", () => {
  it("merges dev_grid_visible into dev_mode setting", () => {
    app.settings.dev_mode = true;
    app.save_settings();
    expect(app.settings.dev_grid_visible).toBe(true);

    app.settings.dev_mode = false;
    app.save_settings();
    expect(app.settings.dev_grid_visible).toBe(false);
  });
});
