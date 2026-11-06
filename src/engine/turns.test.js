import { describe, it, expect } from "vitest";
import {
  calculate_turn_tempo,
  resolve_caretaker_target,
  execute_turn_1_director,
  execute_turn_2_character,
  execute_turn_3_caretaker,
  execute_round,
} from "./turns.js";
import { create_contract_fixtures } from "../intelligence/prompt-verification.js";

describe("src/engine/turns.js — Pure Functional Turn Orchestrator", () => {
  const { entities, history } = create_contract_fixtures();

  it("calculates dynamic turn tempo based on history length", () => {
    expect(calculate_turn_tempo([{ text: "Hi" }])).toBe(1);
    expect(calculate_turn_tempo([{ text: "Let us proceed down the corridor cautiously." }])).toBe(2);
    expect(calculate_turn_tempo([{ text: "A".repeat(300) }])).toBe(3);
    expect(calculate_turn_tempo([{ text: "A".repeat(600) }])).toBe(4);
    expect(calculate_turn_tempo([])).toBe(2);
  });

  it("executes Turn 1 Director quick shot and parses structured JSON", async () => {
    const mock_transport = {
      async stream() {
        return JSON.stringify({
          _thought_process: "Tension rising.",
          next_action: "MAIN_CHARACTER",
          directors_note: "Keep your hand near your weapon.",
          dynamics_deltas: { chaos: 5, intensity: 10, openness: -5, affinity: 0 },
        });
      },
    };

    const staging = await execute_turn_1_director({
      transport: mock_transport,
      round: 1,
      entities,
      history,
    });

    expect(staging.next_action).toBe("MAIN_CHARACTER");
    expect(staging.directors_note).toBe("Keep your hand near your weapon.");
    expect(staging.dynamics_deltas.intensity).toBe(10);
  });

  it("executes Turn 2 Character narrative shot and extracts <think> block", async () => {
    const mock_transport = {
      async stream() {
        return `<think>
1. Intent: Stay watchful.
2. Subtext: Distrust Bob's reckless speed.
</think>
Alice steps into the shadow of the rusted girder, her hand resting on her holster.`;
      },
    };

    const characterResult = await execute_turn_2_character({
      transport: mock_transport,
      round: 1,
      entities,
      history: [{ text: "We move now." }],
    });

    expect(characterResult.think).toContain("Distrust Bob's reckless speed.");
    expect(characterResult.prose).toBe("Alice steps into the shadow of the rusted girder, her hand resting on her holster.");
    expect(characterResult.turn_tempo).toBe(1);
  });

  it("executes complete 1-shot round without Director staging by default", async () => {
    const mock_transport = {
      async stream() {
        return "Alice nods silently.";
      },
    };

    const result = await execute_round({
      transport: mock_transport,
      round: 1,
      entities,
      history: [{ text: "Ready?" }],
      director_enabled: false,
    });

    expect(result.director_staging).toBeNull();
    expect(result.character_turn.prose).toBe("Alice nods silently.");
  });

  it("executes full 2-shot dance when director_enabled is true", async () => {
    let call_count = 0;
    const mock_transport = {
      async stream(prompt) {
        call_count++;
        if (prompt.includes('identity="director"')) {
          return JSON.stringify({
            directors_note: "Whisper your reply.",
            dynamics_deltas: {},
          });
        }
        return "Alice whispers, 'Almost.'";
      },
    };

    const result = await execute_round({
      transport: mock_transport,
      round: 1,
      entities,
      history: [{ text: "Ready?" }],
      director_enabled: true,
    });

    expect(call_count).toBe(2);
    expect(result.director_staging?.directors_note).toBe("Whisper your reply.");
    expect(result.character_turn.prose).toBe("Alice whispers, 'Almost.'");
  });

  it("rotates Caretaker target across AI -> USER -> FRACTAL in round-robin sequence", () => {
    expect(resolve_caretaker_target(1)).toBe("AI");
    expect(resolve_caretaker_target(2)).toBe("USER");
    expect(resolve_caretaker_target(3)).toBe("FRACTAL");
    expect(resolve_caretaker_target(4)).toBe("AI");
  });

  it("executes Turn 3 Caretaker memory synthesis and parses extracted brackets", async () => {
    const mock_transport = {
      async stream() {
        return JSON.stringify({
          _thought_process: "Target observed the perimeter and gathered tools.",
          eternal_physical: "",
          eternal_non_physical: "",
          present_physical: "[INVENTORY: rusted lockpick]",
          present_non_physical: "[MOOD: vigilant]",
          future: "[GOAL: breach security hub]",
          past: "[FACT: heard strange frequency on radio | w: 8]",
        });
      },
    };

    const result = await execute_turn_3_caretaker({
      transport: mock_transport,
      round: 1, // Round 1 targets AI in round-robin
      entities,
      history,
    });

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

    const turn = await execute_turn_2_character({
      transport: mock_transport,
      round: 1,
      entities,
      history: [{ text: "Hi" }], // len < 25 -> tempo 1
    });

    expect(turn.turn_tempo).toBe(1);
    expect(turn.prose).toBe("First beat sentence. Second beat sentence that is preserved in full.");
  });

  it("rejects execute_turn_3_caretaker immediately when signal is already aborted", async () => {
    const mock_transport = {
      async stream() {
        throw new Error("Should not be called");
      },
    };
    const controller = new AbortController();
    controller.abort();

    await expect(
      execute_turn_3_caretaker({
        transport: mock_transport,
        round: 1,
        entities,
        history,
        signal: controller.signal,
      }),
    ).rejects.toThrow("Stream aborted by user.");
  });
});
