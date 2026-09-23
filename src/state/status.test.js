import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  force_recover_simulation,
  FREEZE_WATCHDOG_CHUNK_STALL_MS,
  FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS,
  FREEZE_WATCHDOG_IDLE_GRACE_MS,
  FREEZE_WATCHDOG_INTERVAL_MS,
  FREEZE_WATCHDOG_MAX_MS,
  SimulationStateStore,
  simulation_state,
  StreamingStore,
  streaming,
  UIStateStore,
  ui_state,
} from "./status.svelte.js";
import { Audio } from "@media";

vi.mock("@media", () => ({
  Audio: {
    voice: {
      apply_stream_role: vi.fn(),
      queue_stream_sentence: vi.fn(),
      flush_stream_remainder: vi.fn(),
      reset_stream: vi.fn(),
    },
    is_role_enabled: vi.fn(() => true),
  },
}));

describe("SimulationStateStore", () => {
  beforeEach(() => {
    simulation_state.complete();
    simulation_state.set_intent_active(false);
  });

  it("exports a singleton simulation_state instance", () => {
    expect(simulation_state).toBeInstanceOf(SimulationStateStore);
  });

  it("handles generation lifecycle transitions", () => {
    expect(simulation_state.phase).toBe("idle");
    expect(simulation_state.role).toBeNull();
    expect(simulation_state.busy).toBe(false);

    simulation_state.start_generation("ai");
    expect(simulation_state.phase).toBe("generating");
    expect(simulation_state.role).toBe("ai");
    expect(simulation_state.busy).toBe(true);

    simulation_state.complete();
    expect(simulation_state.phase).toBe("idle");
    expect(simulation_state.role).toBeNull();
    expect(simulation_state.busy).toBe(false);
  });

  it("handles lock and unlock operations", () => {
    simulation_state.lock();
    expect(simulation_state.phase).toBe("locked");

    simulation_state.unlock();
    expect(simulation_state.phase).toBe("idle");
  });

  it("handles intent lock and is_consolidating state", () => {
    expect(simulation_state.is_consolidating).toBe(false);

    simulation_state.set_intent_active(true);
    expect(simulation_state.intent_active).toBe(true);
    expect(simulation_state.busy).toBe(true);
    expect(simulation_state.is_consolidating).toBe(true);

    simulation_state.start_generation("ai");
    expect(simulation_state.is_consolidating).toBe(false); // phase is "generating", not "idle"
    expect(simulation_state.busy).toBe(true);

    simulation_state.complete();
    expect(simulation_state.is_consolidating).toBe(true); // phase is "idle" with intent still held

    simulation_state.set_intent_active(false);
    expect(simulation_state.is_consolidating).toBe(false);
    expect(simulation_state.busy).toBe(false);
  });

  it("handles typing indicator lifecycle", () => {
    simulation_state.start_typing("fractal");
    expect(simulation_state.role).toBe("fractal");

    simulation_state.stop_typing();
    expect(simulation_state.role).toBeNull();
  });

  it("tracks and clears delegated generating entity metadata", () => {
    simulation_state.set_generating_entity({
      type: "npc",
      name: "Mira",
      avatar: "data:image/png;base64,123",
      color: "#ff5500",
    });

    expect(simulation_state.generating_entity_type).toBe("npc");
    expect(simulation_state.generating_entity_name).toBe("Mira");
    expect(simulation_state.generating_entity_avatar).toBe("data:image/png;base64,123");
    expect(simulation_state.generating_entity_color).toBe("#ff5500");

    simulation_state.clear_generating_entity();
    expect(simulation_state.generating_entity_type).toBeNull();
    expect(simulation_state.generating_entity_name).toBeNull();
    expect(simulation_state.generating_entity_avatar).toBeNull();
    expect(simulation_state.generating_entity_color).toBeNull();
  });
});

describe("UIStateStore", () => {
  beforeEach(() => {
    ui_state.set_loading(false);
  });

  it("exports a singleton ui_state instance", () => {
    expect(ui_state).toBeInstanceOf(UIStateStore);
  });

  it("manages loading state", () => {
    expect(ui_state.loading).toBe(false);
    ui_state.set_loading(true);
    expect(ui_state.loading).toBe(true);
    ui_state.set_loading(false);
    expect(ui_state.loading).toBe(false);
  });
});

describe("StreamingStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streaming.end_stream();
    streaming.abort_controller = null;
  });

  it("exports a singleton streaming instance", () => {
    expect(streaming).toBeInstanceOf(StreamingStore);
  });

  it("starts a stream and applies audio role", () => {
    expect(streaming.active).toBe(false);

    streaming.start_stream("msg-101", "ai");

    expect(streaming.active).toBe(true);
    expect(streaming.node_id).toBe("msg-101");
    expect(streaming.role).toBe("ai");
    expect(streaming.content).toBe("");
    expect(Audio.voice.apply_stream_role).toHaveBeenCalledWith("ai", "msg-101");
  });

  it("updates stream content and queues sentence when role is enabled", () => {
    streaming.start_stream("msg-101", "ai");
    streaming.update_stream("Hello world. ");

    expect(streaming.content).toBe("Hello world. ");
    expect(Audio.voice.queue_stream_sentence).toHaveBeenCalledWith("Hello world. ");

    streaming.update_stream("How are you?");
    expect(streaming.content).toBe("Hello world. How are you?");
    expect(Audio.voice.queue_stream_sentence).toHaveBeenCalledWith("Hello world. How are you?");
  });

  it("does not queue sentences if audio role is disabled", () => {
    Audio.is_role_enabled.mockReturnValueOnce(false);

    streaming.start_stream("msg-101", "fractal");
    streaming.update_stream("The wind howls.");

    expect(streaming.content).toBe("The wind howls.");
    expect(Audio.voice.queue_stream_sentence).not.toHaveBeenCalled();
  });

  it("ends stream, flushes remainder, and resets stream parameters", () => {
    streaming.start_stream("msg-101", "ai");
    streaming.update_stream("Ending sentence.");

    streaming.end_stream();

    expect(Audio.voice.flush_stream_remainder).toHaveBeenCalledWith("Ending sentence.");
    expect(Audio.voice.reset_stream).toHaveBeenCalled();
    expect(streaming.active).toBe(false);
    expect(streaming.content).toBe("");
    expect(streaming.node_id).toBeNull();
    expect(streaming.role).toBe("ai");
  });

  it("triggers abort controller on interrupt", () => {
    const mock_abort = vi.fn();
    // @ts-ignore
    streaming.abort_controller = { abort: mock_abort };

    streaming.trigger_interrupt();
    expect(mock_abort).toHaveBeenCalledTimes(1);
  });

  it("handles trigger_interrupt safely when abort_controller is null", () => {
    streaming.abort_controller = null;
    expect(() => streaming.trigger_interrupt()).not.toThrow();
  });
});

describe("Freeze Watchdog & Recovery", () => {
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

  it("force_recover_simulation unlocks simulation_state and resets streaming/loading", () => {
    simulation_state.lock();
    simulation_state.set_intent_active(true);
    ui_state.set_loading(true);
    streaming.active = true;
    streaming.content = "partial stream";
    streaming.node_id = "node-1";

    const mock_abort = vi.fn();
    // @ts-ignore
    streaming.abort_controller = { abort: mock_abort };

    force_recover_simulation("Unit test forced unstick");

    expect(simulation_state.phase).toBe("idle");
    expect(simulation_state.intent_active).toBe(false);
    expect(ui_state.loading).toBe(false);
    expect(streaming.active).toBe(false);
    expect(streaming.content).toBe("");
    expect(streaming.node_id).toBeNull();
    expect(mock_abort).toHaveBeenCalled();
    expect(streaming.abort_controller).toBeNull();
  });
});
