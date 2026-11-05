import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  create_live_stream_fn,
  reconstruct_history_from_feed,
  write_back_kernel_state,
  dispatch_caretaker_consolidation,
  execute_greenfield_turn,
} from "./bridge.js";
import { Kernel } from "./kernel.svelte.js";
import { register_state_accessors } from "../utils/index.js";
import { session_driver } from "../data/index.js";

describe("src/engine/bridge.js - Greenfield-to-Legacy Bridge Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Gap 1 & 2: create_live_stream_fn streaming, prompt format & deduplication", () => {
    it("accepts both string and function prompt parameters and passes them cleanly", async () => {
      const original_gen = window.generate_text;
      const received_instructions = [];

      window.generate_text = vi.fn(async (params) => {
        const inst = typeof params.instruction === "function" ? params.instruction() : params.instruction;
        received_instructions.push(inst);
        return `Resolved: ${inst}`;
      });

      try {
        const stream_fn = create_live_stream_fn();

        // Test string prompt
        const res_str = await stream_fn("Hello world");
        expect(res_str).toBe("Resolved: Hello world");

        // Test function prompt
        const res_fn = await stream_fn(() => "Function prompt");
        expect(res_fn).toBe("Resolved: Function prompt");

        expect(received_instructions).toEqual(["Hello world", "Function prompt"]);
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("prevents double-counting when both onToken and onChunk fire", async () => {
      const original_gen = window.generate_text;
      const chunks_emitted = [];

      window.generate_text = vi.fn(({ onToken, onChunk }) => {
        // Plugin firing both onToken and onChunk for the same data
        onToken("chunk1");
        onChunk("chunk1");
        onToken("chunk2");
        onChunk("chunk2");
        return Promise.resolve("chunk1chunk2");
      });

      try {
        const stream_fn = create_live_stream_fn();
        const res = await stream_fn("test", {
          onChunk: (c) => chunks_emitted.push(c),
        });

        // Chunks should only be delivered once, not twice
        expect(chunks_emitted).toEqual(["chunk1", "chunk2"]);
        expect(res).toBe("chunk1chunk2");
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("Gap 5: reconstruct_history_from_feed role and origin preservation", () => {
    it("preserves fractal, system, user, and model roles with proper origin attribution", () => {
      const mock_feed = [
        { role: "system", text: "The air smells of ozone.", origin: "SYSTEM" },
        { role: "user", text: "I open the rusty airlock.", character_name: "John" },
        { role: "fractal", text: "Steam hisses from the ceiling pipe.", origin: "Deep Station" },
        { role: "ai", text: "Stay behind me.", character_name: "Viper" },
        { role: "unknown", text: "Echo in the dark." },
      ];

      const cast = {
        user: { name: "John" },
        ai: { name: "Viper" },
        fractal: { name: "Deep Station" },
      };

      const history = reconstruct_history_from_feed(mock_feed, cast);

      expect(history).toHaveLength(5);
      expect(history[0]).toEqual({
        role: "system",
        origin: "SYSTEM",
        text: "The air smells of ozone.",
        round: 1,
      });
      expect(history[1]).toEqual({
        role: "user",
        origin: "John",
        text: "I open the rusty airlock.",
        round: 1,
      });
      expect(history[2]).toEqual({
        role: "fractal",
        origin: "Deep Station",
        text: "Steam hisses from the ceiling pipe.",
        round: 1,
      });
      expect(history[3]).toEqual({
        role: "model",
        origin: "Viper",
        text: "Stay behind me.",
        round: 1,
      });
      expect(history[4]).toEqual({
        role: "model",
        origin: "Viper",
        text: "Echo in the dark.",
        round: 1,
      });
    });

    it("handles empty or null feed gracefully", () => {
      expect(reconstruct_history_from_feed(null)).toEqual([]);
      expect(reconstruct_history_from_feed([])).toEqual([]);
    });
  });

  describe("Gap 3: director_enabled toggle from app settings", () => {
    it("respects app.settings.director_enabled flag", async () => {
      const mock_app = {
        settings: { director_enabled: false },
        start_stream: vi.fn(),
        update_stream: vi.fn(),
        end_stream: vi.fn(),
      };
      const mock_runtime = {
        active_ai: { name: "Viper", dynamics: { chaos: 50, intensity: 50 } },
        active_user: { name: "John", dynamics: {} },
        active_fractal: { name: "Station", dynamics: { velocity: 50 } },
        round: 3,
        story_id: "story-1",
        save_entity: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true),
      };
      register_state_accessors({
        app: mock_app,
        runtime: mock_runtime,
        simulation_log: { feed: [] },
      });

      vi.spyOn(session_driver, "log_message").mockResolvedValue({ id: 1 });

      const outcome = await execute_greenfield_turn("Move forward");

      // With director_enabled = false, 1-shot mode runs and director_staging is null
      expect(outcome.director_staging).toBeNull();
      expect(outcome.character_turn).toBeDefined();
    });
  });

  describe("Gap 4: write_back_kernel_state updates and persists dynamics, round and Caretaker diffs", () => {
    it("writes back updated dynamics and round to runtime and persistence", async () => {
      const mock_runtime = {
        round: 1,
        active_ai: { id: "ai-1", dynamics: { chaos: 50, intensity: 50, openness: 50, affinity: 50 } },
        ai_physics: { chaos: 50, intensity: 50, openness: 50, affinity: 50 },
        active_fractal: { id: "f-1", dynamics: { velocity: 50, entropy: 50 } },
        fractal_physics: { velocity: 50, entropy: 50 },
        save_entity: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true),
      };
      register_state_accessors({
        runtime: mock_runtime,
      });

      const kernel = new Kernel({
        ai: { id: "ai-1", dynamics: { chaos: 65, intensity: 75, openness: 50, affinity: 50 } },
        fractal: { id: "f-1", dynamics: { velocity: 80, entropy: 40 } },
        round: 2,
      });

      const outcome = {
        director_staging: {
          dynamics_deltas: { chaos: 15, intensity: 25, velocity: 30, entropy: -10 },
        },
      };

      const mock_transport = {
        stream: vi.fn().mockResolvedValue('{"_thought_process":"test","present_physical":"[POSTURE: tense]"}'),
      };

      await write_back_kernel_state(kernel, outcome, mock_transport);

      // Verify AI dynamics write-back
      expect(mock_runtime.active_ai.dynamics.chaos).toBe(65);
      expect(mock_runtime.active_ai.dynamics.intensity).toBe(75);
      expect(mock_runtime.ai_physics.chaos).toBe(65);

      // Verify Fractal dynamics write-back
      expect(mock_runtime.active_fractal.dynamics.velocity).toBe(80);
      expect(mock_runtime.fractal_physics.velocity).toBe(80);

      // Verify round write-back
      expect(mock_runtime.round).toBe(2);

      // Verify persistence calls
      expect(mock_runtime.save_entity).toHaveBeenCalledWith("character", mock_runtime.active_ai);
      expect(mock_runtime.save_entity).toHaveBeenCalledWith("fractal", mock_runtime.active_fractal);
      expect(mock_runtime.save).toHaveBeenCalledWith(2);
    });

    it("persists all 4 quadrants (present_physical, present_non_physical, future, past) during Caretaker consolidation", async () => {
      const mock_runtime = {
        active_ai: {
          id: "ai-1",
          present: { physical: "[CLOTHING: jacket]", non_physical: "[MOOD: calm]" },
          future: "[AGENDA: wait]",
          past: "[MEMORY: met the traveler]",
        },
        save_entity: vi.fn().mockResolvedValue(true),
      };
      register_state_accessors({ runtime: mock_runtime });

      const kernel = new Kernel({
        ai: { id: "ai-1", name: "AI" },
        round: 1, // Round 1 targets AI in CARETAKER_ROTATION
      });

      const mock_transport = {
        stream: vi.fn().mockResolvedValue(
          JSON.stringify({
            _thought_process: "synthesizing all quadrants",
            target: "AI",
            present_physical: "[INJURY: bruised knee]",
            present_non_physical: "[MOOD: alert]",
            future: "[AGENDA: scout the perimeter]",
            past: "[MEMORY: heard strange noises near the gate]",
          }),
        ),
      };

      await dispatch_caretaker_consolidation(kernel, mock_transport);

      expect(mock_runtime.active_ai.present.physical).toContain("[INJURY: bruised knee]");
      expect(mock_runtime.active_ai.present.non_physical).toContain("[MOOD: alert]");
      expect(mock_runtime.active_ai.future).toContain("[AGENDA: scout the perimeter]");
      expect(mock_runtime.active_ai.past).toContain("[MEMORY: heard strange noises near the gate]");
      expect(mock_runtime.save_entity).toHaveBeenCalledWith("character", mock_runtime.active_ai);
    });
  });
});
