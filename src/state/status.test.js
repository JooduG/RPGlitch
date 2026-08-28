import { beforeEach, describe, expect, it } from "vitest";
import { SimulationStateStore, simulation_state, UIStateStore, ui_state } from "./status.svelte.js";

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
