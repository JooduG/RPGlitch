import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  create_live_stream_fn,
  write_back_kernel_state,
  dispatch_caretaker_consolidation,
  execute_greenfield_turn,
  execute_greenfield_continue,
  get_shared_transport,
  reset_shared_transport,
} from "./bridge.js";
import { reconstruct_history_from_feed } from "./turns.js";
import { Kernel } from "./kernel.svelte.js";
import { register_state_accessors } from "../utils/index.js";
import * as storage_db from "../data/db.js";
import * as media_module from "../media/index.js";

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

    it("passes startWith and stopSequences down to the underlying generator", async () => {
      const original_gen = window.generate_text;
      let captured_params = null;

      window.generate_text = vi.fn(async (params) => {
        captured_params = params;
        return "Continuation text";
      });

      try {
        const stream_fn = create_live_stream_fn();
        await stream_fn("System prompt", {
          startWith: "<think>My thoughts</think>\nFirst line",
          stopSequences: ["\n\n"],
        });

        expect(captured_params.startWith).toBe("<think>My thoughts</think>\nFirst line");
        expect(captured_params.stopSequences).toEqual(["\n\n"]);
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
    it("preserves fractal, system, user, and ai roles with proper origin attribution", () => {
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
        role: "ai",
        origin: "Viper",
        text: "Stay behind me.",
        round: 1,
      });
      expect(history[4]).toEqual({
        role: "ai",
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

      vi.spyOn(storage_db, "log_message").mockResolvedValue({ id: 1 });

      const outcome = await execute_greenfield_turn("Move forward");

      // With director_enabled = false, 1-shot mode runs and director_staging is null
      expect(outcome.director_staging).toBeNull();
      expect(outcome.character_turn).toBeDefined();
    });
  });

  describe("B03: Turn stage transitions on Director and Speaker", () => {
    it("invokes set_delegated_speaker and start_stream_stage during execute_greenfield_turn", async () => {
      const mock_app = {
        settings: { director_enabled: false },
        start_stream: vi.fn(),
        update_stream: vi.fn(),
        end_stream: vi.fn(),
      };
      const mock_simulation_state = {
        set_delegated_speaker: vi.fn(),
        start_stream_stage: vi.fn(),
      };
      const mock_runtime = {
        active_ai: { name: "Viper", profile_picture: "data:img", signature_color: "#ff0055", dynamics: {} },
        active_user: { name: "John", dynamics: {} },
        active_fractal: { name: "Station", dynamics: {} },
        round: 1,
        story_id: "story-stage",
        save_entity: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true),
      };
      register_state_accessors({
        app: mock_app,
        simulation_state: mock_simulation_state,
        runtime: mock_runtime,
        simulation_log: { feed: [] },
      });

      vi.spyOn(storage_db, "log_message").mockResolvedValue({ id: 1 });

      await execute_greenfield_turn("Step into the light");

      expect(mock_simulation_state.set_delegated_speaker).toHaveBeenCalledWith({
        type: "ai",
        name: "Viper",
        avatar: "data:img",
        color: "#ff0055",
      });
      expect(mock_simulation_state.start_stream_stage).toHaveBeenCalled();
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

    it("skips dispatch_caretaker_consolidation when signal is aborted or character prose is empty", async () => {
      const mock_runtime = {
        active_ai: { id: "ai-1", present: {}, future: "", past: "" },
        save_entity: vi.fn(),
      };
      register_state_accessors({ runtime: mock_runtime });

      const kernel = new Kernel({
        ai: { id: "ai-1", name: "AI" },
        round: 1,
      });

      const mock_transport = { stream: vi.fn() };
      const controller = new AbortController();
      controller.abort();

      await dispatch_caretaker_consolidation(kernel, mock_transport, controller.signal);
      expect(mock_transport.stream).not.toHaveBeenCalled();
      expect(mock_runtime.save_entity).not.toHaveBeenCalled();
    });
  });

  describe("execute_greenfield_continue streaming deduplication", () => {
    it("does not duplicate target_prose in update_stream when ai-text-plugin echoes startWith chunk", async () => {
      const original_gen = window.generate_text;
      const streamed_chunks = [];

      window.generate_text = vi.fn(({ startWith, onChunk }) => {
        // Simulate Perchance ai-text-plugin emitting startWith first with isFromStartWith: true
        onChunk({ textChunk: startWith, isFromStartWith: true });
        onChunk({ textChunk: "Next paragraph beat.", isFromStartWith: false });
        return Promise.resolve({
          text: `${startWith}Next paragraph beat.`,
          generatedText: "Next paragraph beat.",
        });
      });

      const mock_app = {
        settings: { director_enabled: false },
        start_stream: vi.fn(),
        update_stream: vi.fn((c) => streamed_chunks.push(c)),
        end_stream: vi.fn(),
      };
      const target_entry = {
        id: "msg-42",
        role: "ai",
        text: "Initial paragraph.",
        round: 1,
        meta: { think: "Initial thought." },
      };
      const edit_entry = vi.fn().mockResolvedValue(true);

      register_state_accessors({
        app: mock_app,
        runtime: {
          active_ai: { id: "ai-1", name: "Orion" },
          active_user: { id: "u-1", name: "Glitch" },
          active_fractal: { id: "f-1", name: "Nova" },
          round: 1,
        },
        simulation_log: {
          feed: [target_entry],
          edit_entry,
        },
      });

      try {
        const outcome = await execute_greenfield_continue(target_entry);
        expect(streamed_chunks.join("")).toBe("Initial paragraph.\n\nNext paragraph beat.");
        expect(outcome.prose).toBe("Initial paragraph.\n\nNext paragraph beat.");
        expect(edit_entry).toHaveBeenCalledWith("msg-42", "Initial paragraph.\n\nNext paragraph beat.");
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("B03 coverage: execute_greenfield_continue transitions stages via set_delegated_speaker and start_stream_stage", async () => {
      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async () => "Extended paragraph.");

      const mock_app = {
        settings: { director_enabled: false },
        start_stream: vi.fn(),
        update_stream: vi.fn(),
        end_stream: vi.fn(),
      };
      const mock_simulation_state = {
        set_delegated_speaker: vi.fn(),
        start_stream_stage: vi.fn(),
      };
      const target_entry = {
        id: "msg-99",
        role: "ai",
        text: "Existing text.",
        round: 1,
        meta: {},
      };
      const edit_entry = vi.fn().mockResolvedValue(true);

      register_state_accessors({
        app: mock_app,
        simulation_state: mock_simulation_state,
        runtime: {
          active_ai: { id: "ai-1", name: "Lyra", profile_picture: "avatar.png", signature_color: "#00ffee" },
          active_user: { id: "u-1", name: "Glitch" },
          active_fractal: { id: "f-1", name: "Station" },
          round: 1,
        },
        simulation_log: {
          feed: [target_entry],
          edit_entry,
        },
      });

      try {
        await execute_greenfield_continue(target_entry);
        expect(mock_simulation_state.set_delegated_speaker).toHaveBeenCalledWith({
          type: "ai",
          name: "Lyra",
          avatar: "avatar.png",
          color: "#00ffee",
        });
        expect(mock_simulation_state.start_stream_stage).toHaveBeenCalled();
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("B13: Shared Preemptive Transport Singleton", () => {
    it("returns singleton transport instance across multiple calls and resets cleanly", () => {
      reset_shared_transport();
      const t1 = get_shared_transport();
      const t2 = get_shared_transport();
      expect(t1).toBe(t2);

      reset_shared_transport();
      const t3 = get_shared_transport();
      expect(t3).not.toBe(t1);
    });

    it("foreground preempts background job through the shared gate without killing other queued background work", async () => {
      reset_shared_transport();
      const original_gen = window.generate_text;

      window.generate_text = vi.fn(({ instruction, signal }) => {
        const prompt = typeof instruction === "function" ? instruction() : instruction;
        if (prompt.includes("background-job")) {
          return new Promise((_, reject) => {
            if (signal) {
              signal.addEventListener("abort", () => {
                const err = new Error("Background preempted by foreground");
                err.name = "AbortError";
                reject(err);
              });
            }
          });
        }
        return Promise.resolve(`Foreground answer: ${prompt}`);
      });

      try {
        const transport = get_shared_transport();

        // 1. Launch background job
        const background_promise = transport.stream("background-job-1", { priority: "background" });

        // Let background job occupy the single gate slot
        await new Promise((r) => setTimeout(r, 10));

        // 2. Launch foreground job
        const foreground_promise = transport.stream("foreground-job-1", { priority: "foreground" });

        // Background should be preempted by foreground
        await expect(background_promise).rejects.toThrow();

        const foreground_result = await foreground_promise;
        expect(foreground_result).toContain("foreground-job-1");
      } finally {
        window.generate_text = original_gen;
        reset_shared_transport();
      }
    });
  });

  describe("B19: Automatic Visual Synthesis Wire-Up", () => {
    it("evaluates get_image_generation_queue and calls spawn_image_beat without blocking turn", async () => {
      const mock_app = {
        settings: { director_enabled: true },
        start_stream: vi.fn(),
        update_stream: vi.fn(),
        end_stream: vi.fn(),
      };
      const mock_simulation_state = {
        set_delegated_speaker: vi.fn(),
        start_stream_stage: vi.fn(),
      };
      const mock_runtime = {
        active_ai: { name: "Lyra", dynamics: { chaos: 60, intensity: 60, openness: 50, affinity: 50 } },
        active_user: { name: "Glitch", dynamics: {} },
        active_fractal: { name: "Station", dynamics: { velocity: 50, entropy: 50 } },
        round: 1,
        story_id: "story-visual-test",
        save_entity: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true),
      };

      register_state_accessors({
        app: mock_app,
        simulation_state: mock_simulation_state,
        runtime: mock_runtime,
        simulation_log: { feed: [] },
      });

      vi.spyOn(storage_db, "log_message").mockResolvedValue({ id: 1 });
      const spawn_spy = vi.spyOn(media_module, "spawn_image_beat").mockResolvedValue({ id: "img-1" });
      const queue_spy = vi.spyOn(media_module, "get_image_generation_queue").mockReturnValue([]);
      const trigger_spy = vi.spyOn(media_module, "resolve_image_trigger").mockReturnValue({
        active: true,
        tier: "story_scene",
        source: "director",
        director_explicit: true,
        next_director_round: 1,
      });

      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async ({ instruction }) => {
        const text = typeof instruction === "function" ? instruction() : instruction;
        if (text.includes("orchestrating simulation mechanics and staging")) {
          return JSON.stringify({
            _thought_process: "Scene shifts to ruined hall.",
            next_action: "MAIN_CHARACTER",
            directors_note: "Look around.",
            camera_note: "Wide establishing shot of the overgrown observatory.",
            dynamics_deltas: { chaos: 5 },
          });
        }
        return "<think>Observe carefully.</think>The dust hangs frozen in the air.";
      });

      try {
        const outcome = await execute_greenfield_turn("Enter the observatory.");
        expect(outcome.character_turn.prose).toBe("The dust hangs frozen in the air.");

        // Queue checked and spawn_image_beat dispatched
        expect(queue_spy).toHaveBeenCalled();
        expect(trigger_spy).toHaveBeenCalled();
        expect(spawn_spy).toHaveBeenCalledWith(
          "story_scene",
          expect.objectContaining({
            explicit: true,
            source: "director",
            prompt: "The dust hangs frozen in the air.",
            visual_staging: "Wide establishing shot of the overgrown observatory.",
          }),
        );

        // Verify DYNAMICS_DELTA log message includes director thoughts
        expect(storage_db.log_message).toHaveBeenCalledWith(
          "",
          "system",
          "Director",
          expect.objectContaining({
            meta: expect.objectContaining({
              type: "DYNAMICS_DELTA",
              thoughts: "Scene shifts to ruined hall.",
            }),
          }),
        );
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("fails silently and never blocks the turn when spawn_image_beat rejects", async () => {
      const mock_app = {
        settings: { director_enabled: false },
        start_stream: vi.fn(),
        update_stream: vi.fn(),
        end_stream: vi.fn(),
      };
      const mock_runtime = {
        active_ai: { name: "Lyra", dynamics: {} },
        active_user: { name: "Glitch", dynamics: {} },
        active_fractal: { name: "Station", dynamics: {} },
        round: 1,
        story_id: "story-fail-test",
        save_entity: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true),
      };

      register_state_accessors({
        app: mock_app,
        runtime: mock_runtime,
        simulation_log: { feed: [] },
      });

      vi.spyOn(storage_db, "log_message").mockResolvedValue({ id: 1 });
      vi.spyOn(media_module, "resolve_image_trigger").mockReturnValue({
        active: true,
        tier: "story_character",
        source: "dynamics",
      });
      vi.spyOn(media_module, "get_image_generation_queue").mockReturnValue([]);
      vi.spyOn(media_module, "spawn_image_beat").mockRejectedValue(new Error("Visual plugin timeout"));

      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async () => "<think>Thinking</think>Safe prose.");

      try {
        const outcome = await execute_greenfield_turn("Walk forward.");
        expect(outcome.character_turn.prose).toBe("Safe prose.");
      } finally {
        window.generate_text = original_gen;
      }
    });
  });
});
