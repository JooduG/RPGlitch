import { describe, expect, it, vi } from "vitest";
import {
  continue_generation_step,
  resolve_continuation_separator,
  run_generation_step,
  run_image_prompt_step,
  run_memory_consolidation_step,
  run_planner_step,
  run_round,
  run_schema_extraction_step,
} from "./steps.js";

function create_step_fixtures() {
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

  const history = [
    { role: "user", text: "We move at dawn." },
    { role: "ai", text: "Alice nods." },
  ];

  return { entities, history };
}

describe("src/engine/steps.js", () => {
  const { entities, history } = create_step_fixtures();

  it("resolve_continuation_separator distinguishes terminal punctuation from inline fragments", () => {
    expect(resolve_continuation_separator("She paused.")).toEqual({ ends_with_terminal: true, separator: "\n\n" });
    expect(resolve_continuation_separator("She reached for")).toEqual({ ends_with_terminal: false, separator: " " });
  });

  it("run_planner_step parses structured JSON, clamps deltas, and extracts <think>", async () => {
    let captured_start_with = null;
    const mock_transport = {
      async stream(_prompt, options = {}) {
        captured_start_with = options.startWith;
        return `<think>
Causality: Player is attempting an infiltration.
</think>
{
  "next_action": "MAIN_CHARACTER",
  "directors_note": "Keep your hand near your weapon.",
  "dynamics_deltas": { "chaos": 5, "intensity": 99, "openness": -5, "affinity": 0 },
  "camera_note": "Tight framing on holster"
}`;
      },
    };

    const staging = await run_planner_step({ transport: mock_transport, round: 1, entities, history });

    expect(captured_start_with).toBe("<think>\n");
    expect(staging._thought_process).toContain("Causality: Player is attempting an infiltration.");
    expect(staging.next_action).toBe("MAIN_CHARACTER");
    expect(staging.directors_note).toBe("Keep your hand near your weapon.");
    expect(staging.dynamics_deltas.intensity).toBe(20);
    expect(staging.camera_note).toBe("Tight framing on holster");
  });

  it("run_generation_step extracts <think> and preserves full prose on small tempo", async () => {
    const mock_transport = {
      async stream() {
        return "<think>quick thought</think>\nFirst beat sentence. Second beat sentence that is preserved in full.";
      },
    };

    const turn = await run_generation_step({ transport: mock_transport, round: 1, entities, history: [{ text: "Hi" }] });

    expect(turn.turn_tempo).toBe(1);
    expect(turn.think).toBe("quick thought");
    expect(turn.prose).toBe("First beat sentence. Second beat sentence that is preserved in full.");
  });

  it("run_round executes Turn 1 Director + Turn 2 Character", async () => {
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

  it("run_memory_consolidation_step parses brackets across quadrants and rejects pre-aborted signals", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(run_memory_consolidation_step({ transport: { stream: vi.fn() }, round: 1, entities, history, signal: controller.signal })).rejects.toThrow(
      "Stream aborted by user.",
    );

    const mock_transport = {
      async stream() {
        return `<think>
Delta: Infiltrated perimeter, found lockpick.
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

    const result = await run_memory_consolidation_step({ transport: mock_transport, round: 1, entities, history });

    expect(result.target).toBe("AI");
    expect(result.parse_succeeded).toBe(true);
    expect(result.present.physical[0].key).toBe("INVENTORY");
    expect(result.present.non_physical[0].key).toBe("MOOD");
    expect(result.future[0].key).toBe("GOAL");
    expect(result.past[0].flags.weight).toBe(8);
    expect(result.brackets).toHaveLength(4);
  });

  it("continue_generation_step preserves paragraph breaks and retries on 0-token EOS", async () => {
    const calls = [];
    const existing_prose = "First paragraph.\n\nSecond paragraph.";
    const mock_transport = {
      async stream(prompt, options = {}) {
        calls.push({ prompt, startWith: options.startWith });
        if (calls.length === 1) return options.startWith.trimEnd();
        return `${options.startWith}Third paragraph.`;
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
    expect(result.continuation_prose).toBe("Third paragraph.");
    expect(result.prose).toBe(`${existing_prose}\n\nThird paragraph.`);
  });

  it("run_image_prompt_step strips @ handles and brackets from diffusion output", async () => {
    const mock_transport = {
      async stream() {
        return JSON.stringify({ _thought_process: "Framing alley.", prompt: "Neon alley, @ALICE [in shadow] {rain}", negative_prompt: "blurry [text]" });
      },
    };

    const result = await run_image_prompt_step({ transport: mock_transport, round: 1, entities, camera_note: "Neon alley" });

    expect(result.prompt).toBe("Neon alley, ALICE in shadow rain");
    expect(result.negative_prompt).toBe("blurry text");
    expect(result._thought_process).toBe("Framing alley.");
  });

  it("run_schema_extraction_step extracts structured profile JSON", async () => {
    const mock_transport = {
      async stream() {
        return JSON.stringify({ eternal_physical: "[BUILD: wiry]", present_non_physical: "[MOOD: calm]" });
      },
    };

    const result = await run_schema_extraction_step({ transport: mock_transport, input_data: "Wiry scout", type: "character" });

    expect(result).toEqual({ eternal_physical: "[BUILD: wiry]", present_non_physical: "[MOOD: calm]" });
  });
});
