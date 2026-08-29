import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  count_pending_ghosts,
  sweep_stale_ghosts,
  mark_placeholder_failed,
  spawn_image_beat,
  _image_generation_queue,
  _remove_from_image_generation_queue,
  get_image_generation_queue,
  reset_image_generation_queue,
  IMAGE_GENERATION_QUEUE_CAPACITY,
  IMAGE_PLACEHOLDER_HARD_CAP,
  IMAGE_GHOST_MAX_AGE_MS,
  IMAGE_RESOLVE_TIMEOUT_MS,
} from "./image-beats.js";
import { register_state_accessors, reset_bridges_for_testing } from "@utils";
import { visual_engine } from "./visual.svelte.js";

describe("image-beats (Media Layer Placeholder & Generation Lifecycle)", () => {
  beforeEach(() => {
    reset_image_generation_queue();
    reset_bridges_for_testing();
    vi.restoreAllMocks();
  });

  describe("constants & queue bounds", () => {
    it("exposes expected capacity bounds and timeouts", () => {
      expect(IMAGE_GENERATION_QUEUE_CAPACITY).toBe(5);
      expect(IMAGE_PLACEHOLDER_HARD_CAP).toBe(5);
      expect(IMAGE_GHOST_MAX_AGE_MS).toBe(120000);
      expect(IMAGE_RESOLVE_TIMEOUT_MS).toBe(120000);
    });

    it("get_image_generation_queue returns shallow snapshot and reset_image_generation_queue clears it", () => {
      _image_generation_queue.push({ id: 101, tier: "story_scene", source: "dynamics", metadata: {} });
      const snap = get_image_generation_queue();
      expect(snap).toHaveLength(1);
      expect(snap[0].id).toBe(101);

      reset_image_generation_queue();
      expect(get_image_generation_queue()).toHaveLength(0);
    });

    it("_remove_from_image_generation_queue removes entry by id", () => {
      _image_generation_queue.push({ id: 101, tier: "story_scene", source: "dynamics", metadata: {} });
      _image_generation_queue.push({ id: 102, tier: "story_character", source: "director", metadata: {} });

      _remove_from_image_generation_queue(101);
      expect(_image_generation_queue.length).toBe(1);
      expect(_image_generation_queue[0].id).toBe(102);

      _remove_from_image_generation_queue(999); // no-op
      expect(_image_generation_queue.length).toBe(1);
    });
  });

  describe("count_pending_ghosts", () => {
    it("returns 0 when runtime has no story_id", async () => {
      register_state_accessors({
        runtime: { story_id: null },
      });
      const count = await count_pending_ghosts();
      expect(count).toBe(0);
    });

    it("counts unresolved attachments without failed flag", async () => {
      const mock_entries = [
        { id: 1, attachments: [{ src: "https://example.com/a.png" }] },
        { id: 2, attachments: [{ src: null, metadata: {} }] },
        { id: 3, attachments: [{ src: null, metadata: { failed: true } }] },
        {
          id: 4,
          attachments: [
            { src: null, metadata: {} },
            { src: null, metadata: {} },
          ],
        },
      ];

      register_state_accessors({
        runtime: { story_id: "story-123" },
        session_driver: {
          load_log: vi.fn().mockResolvedValue(mock_entries),
        },
      });

      const count = await count_pending_ghosts();
      expect(count).toBe(3); // id 2 (1) + id 4 (2)
    });
  });

  describe("sweep_stale_ghosts", () => {
    it("deletes empty-text ghost rows and updates stale populated rows", async () => {
      const now = 200000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      const delete_mock = vi.fn().mockResolvedValue(true);
      const update_mock = vi.fn().mockResolvedValue(true);
      const remove_feed_mock = vi.fn();

      const mock_entries = [
        // Entry 1: Empty text and stale (> 120000ms) -> deleted
        { id: "ghost-1", text: "", created_at: now - 150000, attachments: [{ src: null, metadata: {} }] },
        // Entry 2: Populated text and stale -> updated with failed: true
        { id: "ghost-2", text: "Narrative description", created_at: now - 150000, attachments: [{ src: null, metadata: { mode: "story_scene" } }] },
        // Entry 3: Recent placeholder (< 120000ms) -> untouched
        { id: "ghost-3", text: "", created_at: now - 30000, attachments: [{ src: null, metadata: {} }] },
      ];

      register_state_accessors({
        runtime: { story_id: "story-123" },
        session_driver: {
          load_log: vi.fn().mockResolvedValue(mock_entries),
          delete_log_entry: delete_mock,
          update_log_attachment: update_mock,
        },
        simulation_log: {
          remove: remove_feed_mock,
        },
      });

      await sweep_stale_ghosts();

      expect(delete_mock).toHaveBeenCalledWith("ghost-1");
      expect(remove_feed_mock).toHaveBeenCalledWith("ghost-1");
      expect(update_mock).toHaveBeenCalledWith(
        "ghost-2",
        0,
        expect.objectContaining({
          src: null,
          metadata: expect.objectContaining({ failed: true, image_ghost_swept: true }),
        }),
      );
    });
  });

  describe("mark_placeholder_failed", () => {
    it("updates attachment if the entry has narrative text", async () => {
      const update_mock = vi.fn().mockResolvedValue(true);
      register_state_accessors({
        simulation_log: {
          feed: [{ id: 42, text: "A detailed story description." }],
        },
        session_driver: {
          update_log_attachment: update_mock,
        },
      });

      await mark_placeholder_failed(42, { mode: "solo_entity" });

      expect(update_mock).toHaveBeenCalledWith(42, 0, {
        src: null,
        metadata: expect.objectContaining({ mode: "solo_entity", failed: true }),
      });
    });

    it("deletes entry entirely if entry has no narrative text", async () => {
      const delete_mock = vi.fn().mockResolvedValue(true);
      const remove_mock = vi.fn();

      register_state_accessors({
        simulation_log: {
          feed: [{ id: 99, text: "   " }],
          remove: remove_mock,
        },
        session_driver: {
          delete_log_entry: delete_mock,
        },
      });

      await mark_placeholder_failed(99);

      expect(delete_mock).toHaveBeenCalledWith(99);
      expect(remove_mock).toHaveBeenCalledWith(99);
    });
  });

  describe("spawn_image_beat", () => {
    it("refuses invalid or unregistered tier names", async () => {
      const log_message_mock = vi.fn();
      register_state_accessors({
        session_driver: { log_message: log_message_mock },
      });

      await spawn_image_beat("invalid_tier");
      expect(log_message_mock).not.toHaveBeenCalled();
    });

    it("spawns placeholder and resolves image via visual_engine", async () => {
      const log_message_mock = vi.fn().mockResolvedValue({ id: "entry-1" });
      const update_mock = vi.fn().mockResolvedValue(true);
      vi.spyOn(visual_engine, "visualize").mockResolvedValue({
        imageUrl: "data:image/png;base64,mockImage",
        refinedPrompt: "Hero standing in the storm",
        metadata: { seed: 12345 },
      });

      register_state_accessors({
        runtime: { story_id: "story-1", active_fractal: { name: "Neon City" } },
        session_driver: {
          load_log: vi.fn().mockResolvedValue([]),
          log_message: log_message_mock,
          update_log_attachment: update_mock,
        },
        simulation_log: { feed: [] },
      });

      await spawn_image_beat("story_scene", { prompt: "A cyberpunk city street" });

      expect(log_message_mock).toHaveBeenCalledWith("", "fractal", "Neon City", {
        turn_type: "SYSTEM_TURN",
        attachments: [
          {
            src: null,
            metadata: { mode: "story_scene", image_source: "dynamics", image_explicit: false },
          },
        ],
      });

      // Wait a tick for async background worker
      await new Promise((r) => setTimeout(r, 20));

      expect(update_mock).toHaveBeenCalledWith("entry-1", 0, {
        src: "data:image/png;base64,mockImage",
        metadata: expect.objectContaining({
          mode: "story_scene",
          prompt: "Hero standing in the storm",
          seed: 12345,
        }),
      });
    });
  });
});
