import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  register_state_accessors,
  state_bridge,
  register_stream_handlers,
  stream_bridge,
  stories_bridge,
  reset_bridges_for_testing,
} from "./bridges.js";

describe("bridges.js (Cross-Layer Decoupling Bridges)", () => {
  beforeEach(() => {
    reset_bridges_for_testing();
  });

  describe("state_bridge", () => {
    it("returns null properties before registration", () => {
      expect(state_bridge.app).toBeNull();
      expect(state_bridge.runtime).toBeNull();
      expect(state_bridge.simulation_state).toBeNull();
      expect(state_bridge.simulation_log).toBeNull();
      expect(state_bridge.session_driver).toBeNull();
    });

    it("registers and delegates to accessors correctly", () => {
      const mock_app = { id: "app" };
      const mock_runtime = { id: "runtime" };
      const mock_simulation_state = { id: "simulation_state" };
      const mock_simulation_log = { id: "simulation_log" };
      const mock_session_driver = { id: "session_driver" };

      register_state_accessors({
        app: mock_app,
        runtime: mock_runtime,
        simulation_state: mock_simulation_state,
        simulation_log: mock_simulation_log,
        session_driver: mock_session_driver,
      });

      expect(state_bridge.app).toBe(mock_app);
      expect(state_bridge.runtime).toBe(mock_runtime);
      expect(state_bridge.simulation_state).toBe(mock_simulation_state);
      expect(state_bridge.simulation_log).toBe(mock_simulation_log);
      expect(state_bridge.session_driver).toBe(mock_session_driver);
    });
  });

  describe("stream_bridge", () => {
    it("degrades gracefully to no-op when uninitialized", () => {
      expect(stream_bridge.is_active()).toBe(false);
      expect(() => stream_bridge.start("node-1", "ai")).not.toThrow();
      expect(() => stream_bridge.update("chunk")).not.toThrow();
      expect(() => stream_bridge.end()).not.toThrow();
    });

    it("delegates streaming lifecycle hooks to registered handlers", () => {
      const start = vi.fn();
      const update = vi.fn();
      const end = vi.fn();
      const is_active = vi.fn(() => true);

      register_stream_handlers({ start, update, end, is_active });

      expect(stream_bridge.is_active()).toBe(true);
      expect(is_active).toHaveBeenCalled();

      stream_bridge.start("node-42", "fractal");
      expect(start).toHaveBeenCalledWith("node-42", "fractal");

      stream_bridge.update("The storm gathers.");
      expect(update).toHaveBeenCalledWith("The storm gathers.");

      stream_bridge.end();
      expect(end).toHaveBeenCalled();
    });
  });

  describe("stories_bridge", () => {
    it("safely ignores bump before registration", () => {
      expect(() => stories_bridge.bump()).not.toThrow();
    });

    it("triggers registered bump callback when bumped", () => {
      const mock_bump = vi.fn();
      stories_bridge.register_bump(mock_bump);

      stories_bridge.bump();
      expect(mock_bump).toHaveBeenCalledTimes(1);

      stories_bridge.bump();
      expect(mock_bump).toHaveBeenCalledTimes(2);
    });
  });
});
