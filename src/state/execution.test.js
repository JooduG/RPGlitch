import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExecutionStore, execution, install_freeze_watchdog, uninstall_freeze_watchdog } from "./execution.svelte.js";
import { TIMING_MS } from "@config";
import { Audio } from "@media";

vi.mock("@media", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Audio: {
      voice: { apply_stream_role: vi.fn(), queue_stream_sentence: vi.fn(), flush_stream_remainder: vi.fn(), reset_stream: vi.fn(), stop: vi.fn() },
      is_role_enabled: vi.fn(() => true),
    },
  };
});

describe("ExecutionStore (execution)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execution.complete();
    execution.set_intent_active(false);
    execution.set_loading(false);
    execution.end_stream();
    execution.stream.abort_controller = null;
  });

  it("exports a singleton execution instance", () => {
    expect(execution).toBeInstanceOf(ExecutionStore);
    expect(execution.phase).toBe("idle");
    expect(execution.busy).toBe(false);
  });

  it("unifies phase, intent_active, and loading under busy", () => {
    execution.set_loading(true);
    expect(execution.busy).toBe(true);
    execution.set_loading(false);
    expect(execution.busy).toBe(false);

    execution.set_intent_active(true);
    expect(execution.busy).toBe(true);
    execution.set_intent_active(false);
    expect(execution.busy).toBe(false);

    execution.start_generation("ai");
    expect(execution.phase).toBe("generating");
    expect(execution.busy).toBe(true);
    execution.complete();
    expect(execution.phase).toBe("idle");
    expect(execution.busy).toBe(false);
  });

  it("coordinates director, delegated speaker, media, and stream stages", () => {
    execution.start_director_stage();
    expect(execution.director_thinking).toBe(true);
    expect(execution.generating_entity.name).toBe("Director");

    execution.set_delegated_speaker({ type: "npc", name: "Sylvia", avatar: "data:avatar", color: "#00ffff" });
    expect(execution.director_thinking).toBe(false);
    expect(execution.speaker_thinking).toBe(true);
    expect(execution.generating_entity.name).toBe("Sylvia");

    execution.start_stream_stage();
    expect(execution.speaker_thinking).toBe(false);

    execution.start_media_stage({ type: "ai", name: "Glitch" });
    expect(execution.media_generating).toBe(true);
    expect(execution.director_thinking).toBe(false);

    execution.complete();
    expect(execution.media_generating).toBe(false);
    expect(execution.generating_entity.name).toBeNull();
  });

  it("manages stream lifecycle and TTS sentence queueing", () => {
    execution.start_stream("msg-1", "ai");
    expect(execution.stream.active).toBe(true);
    expect(Audio.voice.apply_stream_role).toHaveBeenCalledWith("ai", "msg-1");

    execution.update_stream("Hello world. ");
    expect(execution.stream.content).toBe("Hello world. ");
    expect(Audio.voice.queue_stream_sentence).toHaveBeenCalledWith("Hello world. ");

    execution.end_stream();
    expect(Audio.voice.flush_stream_remainder).toHaveBeenCalledWith("Hello world. ");
    expect(Audio.voice.reset_stream).toHaveBeenCalled();
    expect(execution.stream.active).toBe(false);
    expect(execution.stream.content).toBe("");
    expect(execution.stream.node_id).toBeNull();
  });

  it("interrupts active AbortController and stops voice", () => {
    const mock_abort = vi.fn();
    // @ts-ignore
    execution.stream.abort_controller = { abort: mock_abort };
    execution.interrupt();
    expect(mock_abort).toHaveBeenCalledTimes(1);
    expect(Audio.voice.stop).toHaveBeenCalledTimes(1);
  });

  it("recover() resets locks, aborts stream, and clears loading", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    execution.lock();
    execution.set_intent_active(true);
    execution.set_loading(true);
    execution.start_stream("node-1", "ai");
    execution.update_stream("partial");
    const mock_abort = vi.fn();
    // @ts-ignore
    execution.stream.abort_controller = { abort: mock_abort };

    execution.recover("Unit test forced unstick");

    expect(execution.phase).toBe("idle");
    expect(execution.intent_active).toBe(false);
    expect(execution.loading).toBe(false);
    expect(execution.stream.active).toBe(false);
    expect(execution.stream.content).toBe("");
    expect(mock_abort).toHaveBeenCalled();
    expect(execution.stream.abort_controller).toBeNull();
  });

  describe("freeze watchdog", () => {
    afterEach(() => {
      uninstall_freeze_watchdog();
    });

    it("exports calibrated timing constants and installs/uninstalls cleanly", () => {
      expect(TIMING_MS.HEARTBEAT).toBe(15000);
      expect(TIMING_MS.CEILING).toBe(120000);
      expect(TIMING_MS.LIFETIME).toBe(240000);
      expect(() => install_freeze_watchdog()).not.toThrow();
      expect(() => uninstall_freeze_watchdog()).not.toThrow();
    });
  });
});
