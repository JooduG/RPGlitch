import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  force_recover_simulation,
  FREEZE_WATCHDOG_CHUNK_STALL_MS,
  FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS,
  FREEZE_WATCHDOG_IDLE_GRACE_MS,
  FREEZE_WATCHDOG_INTERVAL_MS,
  FREEZE_WATCHDOG_MAX_MS,
} from "./freeze-watchdog.js";
import { app } from "./interface.svelte.js";
import { simulation_state } from "./status.svelte.js";

describe("freeze-watchdog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports calibrated watchdog timing thresholds", () => {
    expect(FREEZE_WATCHDOG_INTERVAL_MS).toBe(15000);
    expect(FREEZE_WATCHDOG_IDLE_GRACE_MS).toBe(90000);
    expect(FREEZE_WATCHDOG_CHUNK_STALL_MS).toBe(90000);
    expect(FREEZE_WATCHDOG_MAX_MS).toBe(300000);
    expect(FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS).toBe(240000);
  });

  it("force_recover_simulation unlocks simulation_state and resets app streaming/loading", () => {
    simulation_state.lock();
    simulation_state.set_intent_active(true);
    app.simulation.loading = true;
    app.streaming.active = true;
    app.streaming.content = "partial stream";
    app.streaming.node_id = "node-1";

    const mock_abort = vi.fn();
    // @ts-ignore
    app.streaming.abort_controller = { abort: mock_abort };

    force_recover_simulation("Unit test forced unstick");

    expect(simulation_state.phase).toBe("idle");
    expect(simulation_state.intent_active).toBe(false);
    expect(app.simulation.loading).toBe(false);
    expect(app.streaming.active).toBe(false);
    expect(app.streaming.content).toBe("");
    expect(app.streaming.node_id).toBeNull();
    expect(mock_abort).toHaveBeenCalled();
    expect(app.streaming.abort_controller).toBeNull();
  });
});
