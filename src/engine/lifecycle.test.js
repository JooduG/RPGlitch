import * as data_module from "@data";
import { app, execution, session } from "@state";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  capture_story_image,
  create_entity_with_profile,
  generate_closing,
  generate_image_candidates,
  generate_opening,
  generate_user_draft,
  ghostwrite_user_draft,
  import_entities,
  parse_entity_profile,
  refine_image_prompt,
  run_mock,
} from "./lifecycle.js";
import * as transport_module from "./transport.js";
import * as turns_module from "./turns.js";

describe("src/engine/lifecycle.js", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    session.active_ai = { id: "ai-1", name: "Orion", type: "character" };
    session.active_user = { id: "u-1", name: "Glitch", type: "character" };
    session.active_fractal = { id: "f-1", name: "Nova", type: "fractal", speaking_style: "casual" };
    session.round = 1;
    session.active_id = "story-1";
    session.clear_feed();
    execution.complete();
    execution.set_loading(false);
    app.settings.visual_style = "none";
  });

  describe("refine_image_prompt", () => {
    it("returns empty prompt for invalid input and bypasses LLM when llm_refine is false", async () => {
      expect(await refine_image_prompt("")).toEqual({ prompt: "", negative_prompt: "" });

      const result = await refine_image_prompt("  Moody rain alley  ", "fractal", null, "none");
      expect(result.prompt).toBe("Moody rain alley");
    });

    it("invokes visualizer step when active visual style enables LLM refinement", async () => {
      const mock_stream = vi.fn().mockResolvedValue(JSON.stringify({ prompt: "Cinematic neon street", negative_prompt: "blurry" }));
      vi.spyOn(transport_module, "get_transport").mockReturnValue({ stream: mock_stream });

      const result = await refine_image_prompt("Neon street", "fractal", null, "cinematic");
      expect(mock_stream).toHaveBeenCalled();
      expect(result.prompt).toBe("Cinematic neon street");
    });
  });

  describe("parse_entity_profile", () => {
    it("returns parsed profile JSON and falls back to null on transport error", async () => {
      vi.spyOn(transport_module, "get_transport").mockReturnValue({ stream: vi.fn().mockResolvedValue(JSON.stringify({ eternal_physical: "[BUILD: tall]" })) });
      const parsed = await parse_entity_profile("Tall scout", "character");
      expect(parsed).toEqual({ eternal_physical: "[BUILD: tall]" });

      vi.spyOn(transport_module, "get_transport").mockReturnValue({ stream: vi.fn().mockRejectedValue(new Error("boom")) });
      vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(await parse_entity_profile("Tall scout", "character")).toBeNull();
    });
  });

  describe("generate_opening & generate_closing", () => {
    it("streams prologue, forwards AbortSignal to transport & run_turn, and returns opening outcome", async () => {
      const controller = new AbortController();
      const stream_spy = vi.fn().mockResolvedValue("<think>Setting stage.</think>\nRain lashes the spire.");
      vi.spyOn(transport_module, "get_transport").mockReturnValue({ stream: stream_spy });
      vi.spyOn(session, "log_message").mockResolvedValue({ id: "prologue-1" });
      vi.spyOn(session, "edit_entry").mockResolvedValue(true);
      vi.spyOn(session, "update_attachment").mockResolvedValue(true);
      const run_turn_spy = vi.spyOn(turns_module, "run_turn").mockResolvedValue({ character_turn: { prose: "Orion looks up." } });

      const result = await generate_opening("story-1", { signal: controller.signal });

      expect(stream_spy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: controller.signal }));
      expect(run_turn_spy).toHaveBeenCalledWith("Rain lashes the spire.", { is_opening_turn: true, signal: controller.signal });
      expect(result.character_turn.prose).toBe("Orion looks up.");
      expect(execution.loading).toBe(false);
    });

    it("logs epilogue beat and locks execution in generate_closing", async () => {
      vi.spyOn(transport_module, "get_transport").mockReturnValue({ stream: vi.fn().mockResolvedValue("<think>Curtain.</think>\nThe station powers down.") });
      const log_spy = vi.spyOn(session, "log_message").mockResolvedValue({ id: "ep-1" });

      const prose = await generate_closing("story-1", "CONCLUDED");

      expect(prose).toBe("The station powers down.");
      expect(log_spy).toHaveBeenCalledWith(
        "The station powers down.",
        "fractal",
        "Nova",
        expect.objectContaining({ meta: expect.objectContaining({ is_epilogue: true, conclusion_status: "CONCLUDED" }) }),
      );
      expect(execution.phase).toBe("locked");
    });
  });

  describe("create_entity_with_profile", () => {
    it("persists entity without running portrait when generate_portrait is false", async () => {
      const upsert_spy = vi.spyOn(data_module, "upsert_entity").mockImplementation(async (e) => ({ ...e, id: "char-99" }));
      vi.spyOn(data_module, "get_story").mockResolvedValue({ id: "story-1", npc_ids: [] });
      const cast_spy = vi.spyOn(data_module, "update_cast").mockResolvedValue(true);

      const saved = await create_entity_with_profile(
        "character",
        { name: "Kael", eternal: { physical: "[BUILD: lean]", non_physical: "" }, present: { physical: "", non_physical: "" } },
        { run_sorter: false, generate_portrait: false, story_id: "story-1" },
      );

      expect(upsert_spy).toHaveBeenCalled();
      expect(cast_spy).toHaveBeenCalledWith("story-1", ["char-99"]);
      expect(saved.id).toBe("char-99");
    });
  });

  describe("generate_user_draft", () => {
    it("seeds user input and streams incrementally only after </think> closes", async () => {
      const mock_transport = {
        async stream(_prompt, { onChunk } = {}) {
          onChunk("<think>drafting");
          onChunk(" the beat</think>\n");
          onChunk("First half");
          onChunk(" second half");
          return "<think>drafting the beat</think>\nFirst half second half";
        },
      };

      const on_token = vi.fn();
      const draft = await generate_user_draft("Seed", {
        transport: mock_transport,
        on_token,
        session: { active_user: { name: "Glitch" }, active_ai: { name: "Orion" }, active_fractal: { name: "Nova" }, round: 1 },
        app: {},
        feed: [],
      });

      expect(draft).toBe("First half second half");
      expect(on_token).toHaveBeenCalledTimes(2);
      expect(on_token.mock.calls[0]).toEqual(["First half", true]);
      expect(on_token.mock.calls[1]).toEqual([" second half", false]);
    });
  });

  describe("ghostwrite_user_draft", () => {
    it("updates app.composer_draft with generated draft", async () => {
      vi.spyOn(transport_module, "get_transport").mockReturnValue({ stream: vi.fn().mockResolvedValue("<think>plan</think>You step forward.") });
      app.composer_draft = "";
      const draft = await ghostwrite_user_draft();
      expect(draft).toBe("You step forward.");
      expect(app.composer_draft).toBe("You step forward.");
    });
  });

  describe("capture_story_image", () => {
    it("logs placeholder and updates attachment upon generation", async () => {
      vi.spyOn(session, "log_message").mockResolvedValue({ id: "img-1", created_at: Date.now() });
      const update_spy = vi.spyOn(session, "update_attachment").mockResolvedValue();

      await capture_story_image({ subject: "ai", prompt: "A portrait", kind: "story_character" });
      expect(session.log_message).toHaveBeenCalled();
      expect(update_spy).toHaveBeenCalled();
    });
  });

  describe("additional lifecycle helpers", () => {
    it("generate_image_candidates and run_mock execute cleanly", async () => {
      const candidates = await generate_image_candidates("Prompt text");
      expect(Array.isArray(candidates)).toBe(true);
      await run_mock("ai");
      expect(execution.busy).toBe(false);
    });

    it("import_entities rejects empty input", async () => {
      await expect(import_entities("")).rejects.toThrow();
    });
  });
});
