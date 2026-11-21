import * as dataModule from "@data";
import * as media_module from "@media";
// Phase 5: runner.js merges turns.js + runs.js; canonical turn physics/history live in @simulation.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { execution, session } from "@state";
import * as simulation_module from "@simulation";
import { build_turn_summary, calculate_turn_tempo, reconstruct_history_from_feed, resolve_caretaker_target, step_dynamics } from "@simulation";
import {
  continue_generation_step,
  continue_turn,
  dispatch_consolidation,
  generate_user_draft,
  maybe_spawn_turn_image,
  reset_turn_scope_for_testing,
  run_generation_step,
  run_memory_consolidation_step,
  run_planner_step,
  run_round,
  run_turn,
  write_back_turn_state,
} from "./runner.js";

function create_contract_fixtures() {
  const entities = {
    AI: {
      id: "ALICE",
      name: "Alice",
      type: "character",
      pov: "1st_person",
      eternal: { physical: "[BUILD: tall and athletic]", non_physical: "Analytical cybernetic specialist." },
      present: { physical: "[JACKET: worn leather] [POSTURE: alert]", non_physical: "Guarded vigilance. [@BOB: guarded trust]" },
      future: "Infiltrate the mainframe.",
      past: [],
      dynamics: { chaos: 30, intensity: 70, openness: 40, affinity: 20 },
    },
    USER: {
      id: "BOB",
      name: "Bob",
      type: "character",
      pov: "1st_person",
      eternal: { physical: "[BUILD: broad shoulders]", non_physical: "Veteran decker." },
      present: { physical: "[COAT: dark trench coat]", non_physical: "Patient. [@ALICE: protective ally]" },
      future: "Provide tactical cover.",
      past: [],
      dynamics: { chaos: 20, intensity: 50, openness: 60, affinity: 70 },
    },
    FRACTAL: {
      id: "SECTOR_FOUR",
      name: "Sector Four",
      type: "fractal",
      eternal: { physical: "[LANDMARKS: rusted catwalks] [ATMOSPHERE: neon haze]", non_physical: "Degraded industrial district." },
      present: { physical: "[WEATHER: acid drizzle]", non_physical: "Hostile and oppressive." },
      future: "Decay under acid rain.",
      past: [],
      dynamics: { velocity: 50, entropy: 80 },
    },
  };

  const npc = {
    id: "MERCHANT",
    name: "Merchant",
    type: "npc",
    pov: "1st_person",
    eternal: { physical: "[BUILD: stooped]", non_physical: "Scavenger." },
    present: { physical: "[CLOTHING: rags]", non_physical: "Suspicious. [@ALICE: wary curiosity]" },
    future: "Survive.",
    past: [],
    dynamics: { chaos: 15, intensity: 25, openness: 15, affinity: 10 },
  };

  const snapshot = { ai: { dynamics: entities.AI.dynamics }, fractal: { dynamics: entities.FRACTAL.dynamics }, flags: {} };
  const history = [
    { role: "user", text: "We move at dawn." },
    { role: "ai", text: "Alice nods." },
  ];

  return { entities, npc, snapshot, history };
}

describe("src/engine/runner.js - Engine Runner Unit Tests (Phase 5: turns + runs merge)", () => {
  const { entities, history } = create_contract_fixtures();

  beforeEach(() => {
    vi.restoreAllMocks();
    session.active_ai = null;
    session.active_user = null;
    session.active_fractal = null;
    session.round = 0;
    session.back_shot_cursor = 0;
    session.story_id = null;
    session.last_director_beat_round = -1;
    session.last_dynamics_beat_round = -1;
    session.clear_feed();
    reset_turn_scope_for_testing();
  });

  it("calculates dynamic turn tempo based on history length (canonical @simulation)", () => {
    expect(calculate_turn_tempo([{ text: "Hi" }])).toBe(1);
    expect(calculate_turn_tempo([{ text: "Let us proceed down the corridor cautiously." }])).toBe(2);
    expect(calculate_turn_tempo([{ text: "A".repeat(300) }])).toBe(3);
    expect(calculate_turn_tempo([{ text: "A".repeat(600) }])).toBe(4);
    expect(calculate_turn_tempo([])).toBe(2);
  });

  it("executes planner step (Turn 1 Director) and parses structured JSON with separate <think>", async () => {
    let captured_start_with = null;
    const mock_transport = {
      async stream(prompt, options = {}) {
        captured_start_with = options.startWith;
        return `<think>
Causality: Player is attempting an infiltration.
Dynamics: Intensity +10, chaos +5.
Routing: Active companion responds.
</think>
{
  "next_action": "MAIN_CHARACTER",
  "directors_note": "Keep your hand near your weapon.",
  "dynamics_deltas": { "chaos": 5, "intensity": 10, "openness": -5, "affinity": 0 },
  "camera_note": "Tight framing on holster"
}`;
      },
    };

    const staging = await run_planner_step({ transport: mock_transport, round: 1, entities, history });

    expect(captured_start_with).toBe("<think>\n");
    expect(staging._thought_process).toContain("Causality: Player is attempting an infiltration.");
    expect(staging.next_action).toBe("MAIN_CHARACTER");
    expect(staging.directors_note).toBe("Keep your hand near your weapon.");
    expect(staging.dynamics_deltas.intensity).toBe(10);
    expect(staging.camera_note).toBe("Tight framing on holster");
  });

  it("executes generation step (Turn 2 Character) and extracts <think> block", async () => {
    const mock_transport = {
      async stream() {
        return `<think>
1. Intent: Stay watchful.
2. Subtext: Distrust Bob's reckless speed.
</think>
Alice steps into the shadow of the rusted girder, her hand resting on her holster.`;
      },
    };

    const characterResult = await run_generation_step({ transport: mock_transport, round: 1, entities, history: [{ text: "We move now." }] });

    expect(characterResult.think).toContain("Distrust Bob's reckless speed.");
    expect(characterResult.prose).toBe("Alice steps into the shadow of the rusted girder, her hand resting on her holster.");
    expect(characterResult.turn_tempo).toBe(1);
  });

  it("executes full 2-shot dance (Director + Character)", async () => {
    let call_count = 0;
    const mock_transport = {
      async stream(prompt) {
        call_count++;
        if (prompt.includes('identity="director"')) {
          return JSON.stringify({ directors_note: "Whisper your reply.", dynamics_deltas: {} });
        }
        return "Alice whispers, 'Almost.'";
      },
    };

    const result = await run_round({ transport: mock_transport, round: 1, entities, history: [{ text: "Ready?" }] });

    expect(call_count).toBe(2);
    expect(result.director_staging?.directors_note).toBe("Whisper your reply.");
    expect(result.character_turn.prose).toBe("Alice whispers, 'Almost.'");
  });

  it("rotates Caretaker target across AI -> USER -> FRACTAL in round-robin sequence (canonical @simulation)", () => {
    expect(resolve_caretaker_target(1)).toBe("AI");
    expect(resolve_caretaker_target(2)).toBe("USER");
    expect(resolve_caretaker_target(3)).toBe("FRACTAL");
    expect(resolve_caretaker_target(4)).toBe("AI");
  });

  it("executes memory consolidation step (Turn 3 Caretaker) and parses extracted brackets with separate <think>", async () => {
    let captured_start_with = null;
    const mock_transport = {
      async stream(prompt, options = {}) {
        captured_start_with = options.startWith;
        return `<think>
Delta: Infiltrated perimeter, found lockpick.
Routing: Present physical gets lockpick, mood vigilant.
</think>
{
  "eternal_physical": "",
  "eternal_non_physical": "",
  "present_physical": "[INVENTORY: rusted lockpick]",
  "present_non_physical": "[MOOD: vigilant]",
  "future": "[GOAL: breach security hub]",
  "past": "[FACT: heard strange frequency on radio | w: 8]"
}`;
      },
    };

    const result = await run_memory_consolidation_step({
      transport: mock_transport,
      round: 1, // Round 1 targets AI in round-robin
      entities,
      history,
    });

    expect(captured_start_with).toBe("<think>\n");
    expect(result._thought_process).toContain("Delta: Infiltrated perimeter, found lockpick.");
    expect(result.target).toBe("AI");
    expect(result.present_non_physical).toBe("[MOOD: vigilant]");
    expect(result.present_physical).toBe("[INVENTORY: rusted lockpick]");
    expect(result.future_text).toBe("[GOAL: breach security hub]");
    expect(result.past_text).toContain("[FACT: heard strange frequency on radio | w: 8]");
    expect(result.present.non_physical[0].key).toBe("MOOD");
    expect(result.present.physical[0].key).toBe("INVENTORY");
    expect(result.future[0].key).toBe("GOAL");
    expect(result.past[0].key).toBe("FACT");
    expect(result.past[0].flags.weight).toBe(8);
    expect(result.brackets).toHaveLength(4);
    expect(result.brackets[0].key).toBe("INVENTORY");
    expect(result.brackets[0].value).toBe("rusted lockpick");
    expect(result.brackets[1].key).toBe("MOOD");
    expect(result.brackets[1].value).toBe("vigilant");
    expect(result.brackets[2].key).toBe("GOAL");
    expect(result.brackets[3].key).toBe("FACT");
    expect(result.brackets[3].flags.weight).toBe(8);
  });

  it("preserves full multi-sentence prose on small tempo without post-hoc truncation", async () => {
    const mock_transport = {
      async stream() {
        return "<think>quick thought</think>\nFirst beat sentence. Second beat sentence that is preserved in full.";
      },
    };

    const turn = await run_generation_step({
      transport: mock_transport,
      round: 1,
      entities,
      history: [{ text: "Hi" }], // len < 25 -> tempo 1
    });

    expect(turn.turn_tempo).toBe(1);
    expect(turn.prose).toBe("First beat sentence. Second beat sentence that is preserved in full.");
  });

  it("rejects memory consolidation immediately when signal is already aborted", async () => {
    const mock_transport = {
      async stream() {
        throw new Error("Should not be called");
      },
    };
    const controller = new AbortController();
    controller.abort();

    await expect(run_memory_consolidation_step({ transport: mock_transport, round: 1, entities, history, signal: controller.signal })).rejects.toThrow(
      "Stream aborted by user.",
    );
  });

  it("appends Perchance-safe double-newline lead when continuing terminal-punctuated prose and preserves paragraph break", async () => {
    let captured_prompt = "";
    let captured_start_with = "";
    const mock_transport = {
      async stream(prompt, options = {}) {
        captured_prompt = prompt;
        captured_start_with = options.startWith;
        return `${options.startWith}He steps closer to the edge.`;
      },
    };

    const result = await continue_generation_step({
      transport: mock_transport,
      round: 1,
      entities,
      history,
      target_prose: '"Too slow to catch me!"',
      target_think: "Bait the hero.",
    });

    expect(captured_prompt).toContain('identity="character"');
    expect(captured_start_with).toBe('<think>Bait the hero.</think>\n"Too slow to catch me!"\n\n');
    expect(result.continuation_prose).toBe("He steps closer to the edge.");
    expect(result.prose).toBe('"Too slow to catch me!"\n\nHe steps closer to the edge.');
  });

  it("retries with fresh-buffer continuation fallback when long startWith returns 0 new tokens (EOS)", async () => {
    const calls = [];
    const existing_prose = "First paragraph of the scene.\n\nSecond paragraph after continue one.\n\nThird paragraph after continue two.";
    const mock_transport = {
      async stream(prompt, options = {}) {
        calls.push({ prompt, startWith: options.startWith });
        if (calls.length === 1) {
          // Simulate Perchance ai-text-plugin stripping trailing whitespace and model emitting 0 tokens (EOS)
          return options.startWith.trimEnd();
        }
        return `${options.startWith}Fourth paragraph generated by fresh-buffer fallback.`;
      },
    };

    const result = await continue_generation_step({
      transport: mock_transport,
      round: 1,
      entities,
      history,
      target_prose: existing_prose,
      target_think: "Original thought.",
    });

    expect(calls).toHaveLength(2);
    expect(calls[1].prompt).toContain(existing_prose);
    expect(result.continuation_prose).toBe("Fourth paragraph generated by fresh-buffer fallback.");
    expect(result.prose).toBe(`${existing_prose}\n\nFourth paragraph generated by fresh-buffer fallback.`);
  });

  describe("build_turn_summary() (canonical @simulation)", () => {
    it("formats summary of turn with role counts", () => {
      const feed = [
        { role: "user", text: "Hello" },
        { role: "ai", text: "Greetings." },
        { role: "fractal", text: "Wind howls." },
        { role: "system", text: "System marker" },
      ];
      const summary = build_turn_summary(feed, 3);
      expect(summary).toBe("Turn 3 complete - user×1, ai×1, fractal×1.");
    });

    it("handles empty feed gracefully", () => {
      expect(build_turn_summary([], 1)).toBe("Turn 1 complete - no messages recorded.");
      expect(build_turn_summary(null, 2)).toBe("Turn 2 complete - no messages recorded.");
    });
  });

  describe("Gap 5: reconstruct_history_from_feed role and origin preservation (canonical @simulation)", () => {
    it("preserves fractal, system, user, and ai roles with proper origin attribution", () => {
      const mock_feed = [
        { role: "system", text: "The air smells of ozone.", origin: "SYSTEM" },
        { role: "user", text: "I open the rusty airlock.", character_name: "John" },
        { role: "fractal", text: "Steam hisses from the ceiling pipe.", origin: "Deep Station" },
        { role: "ai", text: "Stay behind me.", character_name: "Viper" },
        { role: "unknown", text: "Echo in the dark." },
      ];

      const cast = { user: { name: "John" }, ai: { name: "Viper" }, fractal: { name: "Deep Station" } };

      const history = reconstruct_history_from_feed(mock_feed, cast);

      expect(history).toHaveLength(5);
      expect(history[0]).toEqual({ role: "system", origin: "SYSTEM", text: "The air smells of ozone.", round: 1 });
      expect(history[1]).toEqual({ role: "user", origin: "John", text: "I open the rusty airlock.", round: 1 });
      expect(history[2]).toEqual({ role: "fractal", origin: "Deep Station", text: "Steam hisses from the ceiling pipe.", round: 1 });
      expect(history[3]).toEqual({ role: "ai", origin: "Viper", text: "Stay behind me.", round: 1 });
      expect(history[4]).toEqual({ role: "ai", origin: "Viper", text: "Echo in the dark.", round: 1 });
    });

    it("handles empty or null feed gracefully", () => {
      expect(reconstruct_history_from_feed(null)).toEqual([]);
      expect(reconstruct_history_from_feed([])).toEqual([]);
    });
  });

  describe("B03: Turn stage transitions on Director and Speaker", () => {
    it("invokes set_delegated_speaker and start_stream_stage during run_turn", async () => {
      const speaker_spy = vi.spyOn(execution, "set_delegated_speaker").mockImplementation(() => {});
      const stage_spy = vi.spyOn(execution, "start_stream_stage").mockImplementation(() => {});

      await run_turn("Step into the light");

      expect(speaker_spy).toHaveBeenCalled();
      expect(stage_spy).toHaveBeenCalled();
      const speaker_arg = speaker_spy.mock.calls[0][0];
      expect(speaker_arg.type).toBe("ai");
    });
  });

  describe("Gap 4: write_back_turn_state updates and persists dynamics, round and Caretaker diffs", () => {
    it("writes back updated dynamics and round to session and persistence", async () => {
      session.active_ai = { id: "ai-1", name: "Viper", dynamics: { chaos: 50, intensity: 50, openness: 50, affinity: 50 } };
      session.active_fractal = { id: "f-1", name: "Station", dynamics: { velocity: 50, entropy: 50 } };
      session.round = 1;
      const save_entity_spy = vi.spyOn(session, "save_entity").mockResolvedValue(true);
      const save_spy = vi.spyOn(session, "save").mockResolvedValue(true);

      const outcome = {
        director_staging: { dynamics_deltas: { chaos: 15, intensity: 25, velocity: 30, entropy: -10 } },
        character_turn: { prose: "", think: "" },
      };

      await write_back_turn_state({
        ai: { id: "ai-1", name: "Viper", dynamics: { chaos: 65, intensity: 75, openness: 50, affinity: 50 } },
        fractal: { id: "f-1", name: "Station", dynamics: { velocity: 80, entropy: 40 } },
        user: session.active_user,
        round: 2,
        outcome,
        options: {},
      });

      // Verify AI dynamics write-back (active entity + live dynamics store)
      expect(session.active_ai.dynamics.chaos).toBe(65);
      expect(session.active_ai.dynamics.intensity).toBe(75);
      expect(session.ai_dynamics.chaos).toBe(65);

      // Verify Fractal dynamics write-back
      expect(session.active_fractal.dynamics.velocity).toBe(80);
      expect(session.fractal_dynamics.velocity).toBe(80);

      // Verify round write-back
      expect(session.round).toBe(2);

      // Verify persistence calls
      expect(save_entity_spy).toHaveBeenCalledWith("character", expect.objectContaining({ id: "ai-1" }));
      expect(save_entity_spy).toHaveBeenCalledWith("fractal", expect.objectContaining({ id: "f-1" }));
      expect(save_spy).toHaveBeenCalledWith(2);
    });

    it("persists all 4 quadrants (present_physical, present_non_physical, future, past) during Caretaker consolidation", async () => {
      session.active_ai = {
        id: "ai-1",
        name: "AI",
        present: { physical: "[CLOTHING: jacket]", non_physical: "[MOOD: calm]" },
        future: "[AGENDA: wait]",
        past: "[MEMORY: met the traveler]",
      };
      session.back_shot_cursor = 0;
      session.story_id = null;
      const save_entity_spy = vi.spyOn(session, "save_entity").mockResolvedValue(true);
      vi.spyOn(dataModule, "append_ledger_entries").mockResolvedValue([]);

      const mock_transport = {
        stream: vi
          .fn()
          .mockResolvedValue(
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

      await dispatch_consolidation({ ai: { id: "ai-1", name: "AI" }, round: 1 }, mock_transport);

      expect(session.active_ai.present.physical).toContain("[INJURY: bruised knee]");
      expect(session.active_ai.present.non_physical).toContain("[MOOD: alert]");
      expect(session.active_ai.future).toContain("[AGENDA: scout the perimeter]");
      expect(session.active_ai.past).toContain("[MEMORY: heard strange noises near the gate]");
      expect(save_entity_spy).toHaveBeenCalledWith("character", expect.objectContaining({ id: "ai-1" }));
    });

    it("skips dispatch_consolidation when signal is aborted or character prose is empty", async () => {
      session.active_ai = { id: "ai-1", name: "AI", present: {}, future: "", past: "" };
      const save_entity_spy = vi.spyOn(session, "save_entity").mockResolvedValue(true);

      const mock_transport = { stream: vi.fn() };
      const controller = new AbortController();
      controller.abort();

      await dispatch_consolidation({ ai: { id: "ai-1", name: "AI" }, round: 1 }, mock_transport, controller.signal);
      expect(mock_transport.stream).not.toHaveBeenCalled();
      expect(save_entity_spy).not.toHaveBeenCalled();
    });
  });

  describe("continue_turn streaming deduplication (Phase 5: meta.think persisted via 3-arg edit_entry)", () => {
    it("does not duplicate target_prose in update_stream when ai-text-plugin echoes startWith chunk", async () => {
      const original_gen = window.generate_text;
      const streamed_chunks = [];

      window.generate_text = vi.fn(({ startWith, onChunk }) => {
        // Simulate Perchance ai-text-plugin emitting startWith first with isFromStartWith: true
        onChunk({ textChunk: startWith, isFromStartWith: true });
        onChunk({ textChunk: "Next paragraph beat.", isFromStartWith: false });
        return Promise.resolve({ text: `${startWith}Next paragraph beat.`, generatedText: "Next paragraph beat." });
      });

      const target_entry = { id: "msg-42", role: "ai", text: "Initial paragraph.", round: 1, meta: { think: "Initial thought." } };

      session.active_ai = { id: "ai-1", name: "Orion" };
      session.active_user = { id: "u-1", name: "Glitch" };
      session.active_fractal = { id: "f-1", name: "Nova" };
      session.round = 1;
      session.feed = [target_entry];
      const edit_entry_spy = vi.spyOn(session, "edit_entry").mockResolvedValue(true);

      vi.spyOn(execution, "start_stream").mockImplementation(() => {});
      vi.spyOn(execution, "update_stream").mockImplementation((c) => streamed_chunks.push(c));
      vi.spyOn(execution, "end_stream").mockImplementation(() => {});

      try {
        const outcome = await continue_turn(target_entry);
        expect(streamed_chunks.join("")).toBe("Initial paragraph.\n\nNext paragraph beat.");
        expect(outcome.prose).toBe("Initial paragraph.\n\nNext paragraph beat.");
        // Phase 5: meta.think persisted via 3-arg edit_entry (id, fused, { think })
        expect(edit_entry_spy).toHaveBeenCalledWith(
          "msg-42",
          "Initial paragraph.\n\nNext paragraph beat.",
          expect.objectContaining({ think: expect.any(String) }),
        );
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("B03 coverage: continue_turn transitions stages via set_delegated_speaker and start_stream_stage", async () => {
      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async () => "Extended paragraph.");

      const target_entry = { id: "msg-99", role: "ai", text: "Existing text.", round: 1, meta: {} };

      session.active_ai = { id: "ai-1", name: "Lyra", profile_picture: "avatar.png", signature_color: "#00ffee" };
      session.active_user = { id: "u-1", name: "Glitch" };
      session.active_fractal = { id: "f-1", name: "Station" };
      session.round = 1;
      session.feed = [target_entry];
      vi.spyOn(session, "edit_entry").mockResolvedValue(true);

      vi.spyOn(execution, "start_stream").mockImplementation(() => {});
      vi.spyOn(execution, "update_stream").mockImplementation(() => {});
      vi.spyOn(execution, "end_stream").mockImplementation(() => {});
      const speaker_spy2 = vi.spyOn(execution, "set_delegated_speaker").mockImplementation(() => {});
      const stage_spy2 = vi.spyOn(execution, "start_stream_stage").mockImplementation(() => {});

      try {
        await continue_turn(target_entry);
        expect(speaker_spy2).toHaveBeenCalledWith({ type: "ai", name: "Lyra", avatar: "avatar.png", color: "#00ffee" });
        expect(stage_spy2).toHaveBeenCalled();
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("B19: Automatic Visual Synthesis Wire-Up (Phase 5: entity-keyed prev_dynamics)", () => {
    it("evaluates get_image_generation_queue and calls spawn_image_beat without blocking turn", async () => {
      session.active_ai = { id: "ai-1", name: "Lyra", dynamics: { chaos: 60, intensity: 60, openness: 50, affinity: 50 } };
      session.active_user = { id: "u-1", name: "Glitch", dynamics: {} };
      session.active_fractal = { id: "f-1", name: "Station", dynamics: { velocity: 50, entropy: 50 } };
      session.round = 1;
      session.story_id = "story-visual-test";
      session.last_director_beat_round = -1;
      session.last_dynamics_beat_round = -1;
      session.feed = [];
      vi.spyOn(session, "save_entity").mockResolvedValue(true);
      vi.spyOn(session, "save").mockResolvedValue(true);

      vi.spyOn(execution, "start_stream").mockImplementation(() => {});
      vi.spyOn(execution, "update_stream").mockImplementation(() => {});
      vi.spyOn(execution, "end_stream").mockImplementation(() => {});

      const log_spy = vi.spyOn(session, "log_message").mockResolvedValue({ id: 1 });
      const spawn_spy = vi.spyOn(media_module, "spawn_image_beat").mockResolvedValue({ id: "img-1" });
      const queue_spy = vi.spyOn(media_module, "get_image_generation_queue").mockReturnValue([]);
      const trigger_spy = vi
        .spyOn(simulation_module, "resolve_image_trigger")
        .mockReturnValue({ active: true, tier: "story_scene", source: "director", director_explicit: true, next_director_round: 1 });

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
        const outcome = await run_turn("Enter the observatory.");
        expect(outcome.character_turn.prose).toBe("The dust hangs frozen in the air.");

        // Queue checked and spawn_image_beat dispatched
        expect(queue_spy).toHaveBeenCalled();
        expect(trigger_spy).toHaveBeenCalled();
        // Phase 5: prev_dynamics is entity-keyed ({ ai, fractal }) so the trigger
        // compares each entity against its own previous values.
        expect(trigger_spy).toHaveBeenCalledWith(
          expect.objectContaining({ prev_dynamics: expect.objectContaining({ ai: expect.any(Object), fractal: expect.any(Object) }) }),
        );
        expect(spawn_spy).toHaveBeenCalledWith(
          "story_scene",
          expect.objectContaining({
            explicit: true,
            source: "director",
            prompt: "The dust hangs frozen in the air.",
            visual_staging: "Wide establishing shot of the overgrown observatory.",
          }),
          expect.objectContaining({ app: expect.anything(), session: expect.anything() }),
        );

        // Verify DYNAMICS_DELTA log message includes director thoughts
        expect(log_spy).toHaveBeenCalledWith(
          "",
          "system",
          "Director",
          expect.objectContaining({ meta: expect.objectContaining({ type: "DYNAMICS_DELTA", thoughts: "Scene shifts to ruined hall." }) }),
        );
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("fails silently and never blocks the turn when spawn_image_beat rejects", async () => {
      session.active_ai = { id: "ai-1", name: "Lyra", dynamics: {} };
      session.active_user = { id: "u-1", name: "Glitch", dynamics: {} };
      session.active_fractal = { id: "f-1", name: "Station", dynamics: {} };
      session.round = 1;
      session.story_id = "story-fail-test";
      session.feed = [];
      vi.spyOn(session, "save_entity").mockResolvedValue(true);
      vi.spyOn(session, "save").mockResolvedValue(true);

      vi.spyOn(execution, "start_stream").mockImplementation(() => {});
      vi.spyOn(execution, "update_stream").mockImplementation(() => {});
      vi.spyOn(execution, "end_stream").mockImplementation(() => {});

      vi.spyOn(session, "log_message").mockResolvedValue({ id: 1 });
      vi.spyOn(simulation_module, "resolve_image_trigger").mockReturnValue({ active: true, tier: "story_character", source: "dynamics" });
      vi.spyOn(media_module, "get_image_generation_queue").mockReturnValue([]);
      vi.spyOn(media_module, "spawn_image_beat").mockRejectedValue(new Error("Visual plugin timeout"));

      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async () => "<think>Thinking</think>Safe prose.");

      try {
        const outcome = await run_turn("Walk forward.");
        expect(outcome.character_turn.prose).toBe("Safe prose.");
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("forwards entity-keyed prev_dynamics through maybe_spawn_turn_image", async () => {
      const trigger_spy = vi.spyOn(simulation_module, "resolve_image_trigger").mockReturnValue({ active: false, tier: null, source: null });
      vi.spyOn(media_module, "get_image_generation_queue").mockReturnValue([]);
      session.story_id = "story-prev-shape";
      session.last_director_beat_round = -1;
      session.last_dynamics_beat_round = -1;

      const prev = { ai: { chaos: 10 }, fractal: { velocity: 20 } };
      await maybe_spawn_turn_image({
        prose: "Some prose.",
        outcome: { director_staging: null },
        ai_quadrant: { dynamics: { chaos: 12 } },
        fractal_quadrant: { dynamics: { velocity: 22 } },
        prev_dynamics: prev,
        turn_round: 3,
      });

      expect(trigger_spy).toHaveBeenCalledWith(expect.objectContaining({ prev_dynamics: prev }));
    });
  });

  describe("generate_user_draft (ghostwriter seed + incremental think-gated streaming)", () => {
    it("seeds a { role: 'user', text } history entry and returns cleaned prose", async () => {
      let _saw_user_seed = false;
      const mock_transport = {
        async stream(prompt, _options = {}) {
          if (typeof prompt === "string" && prompt.includes("Hello there")) _saw_user_seed = true;
          return "<think>Drafting the user's next beat.</think>\nHello there, traveler.";
        },
      };

      const draft = await generate_user_draft(mock_transport, "Hello there", null, null, {
        session: { active_user: { name: "Glitch" }, active_ai: { name: "Orion" }, active_fractal: { name: "Nova" }, round: 1 },
        app: {},
        feed: [],
      });

      expect(draft).toBe("Hello there, traveler.");
    });

    it("streams incrementally only after </think> closes (first emission is a full replace)", async () => {
      const mock_transport = {
        async stream(prompt, { onChunk } = {}) {
          // Split think across chunks, then prose in two parts.
          onChunk("<think>drafting");
          onChunk(" the beat</think>\n");
          onChunk("First half");
          onChunk(" second half");
          return "<think>drafting the beat</think>\nFirst half second half";
        },
      };

      const on_token = vi.fn();
      const draft = await generate_user_draft(mock_transport, "", null, on_token, {
        session: { active_user: { name: "Glitch" }, active_ai: { name: "Orion" }, active_fractal: { name: "Nova" }, round: 1 },
        app: {},
        feed: [],
      });

      expect(draft).toBe("First half second half");
      // No emission while think is open; first post-think emission is a full replace.
      expect(on_token).toHaveBeenCalledTimes(2);
      expect(on_token.mock.calls[0][1]).toBe(true);
      expect(on_token.mock.calls[0][0]).toBe("First half");
      expect(on_token.mock.calls[1][1]).toBe(false);
    });
  });

  describe("step_dynamics settling direction (canonical @simulation)", () => {
    it("settles toward baselines via gravity instead of naive addition", () => {
      const baselines_ai = { chaos: 50, intensity: 50, openness: 50, affinity: 50 };
      const { next } = step_dynamics({ chaos: 50 }, baselines_ai, { chaos: 10 }, { entropy: 50, scope: "somatic" });

      // Gravity pulls the +10 delta back toward baseline: settled below naive 60, above 50.
      expect(next.chaos).toBeLessThan(60);
      expect(next.chaos).toBeGreaterThan(50);
    });
  });
});
