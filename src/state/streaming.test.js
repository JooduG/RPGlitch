import { beforeEach, describe, expect, it, vi } from "vitest";
import { StreamingStore, streaming } from "./streaming.svelte.js";
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
    streaming.abort_controller = { abort: mock_abort };

    streaming.trigger_interrupt();
    expect(mock_abort).toHaveBeenCalledTimes(1);
  });

  it("handles trigger_interrupt safely when abort_controller is null", () => {
    streaming.abort_controller = null;
    expect(() => streaming.trigger_interrupt()).not.toThrow();
  });
});
