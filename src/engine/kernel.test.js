import { describe, it, expect } from "vitest";
import { Kernel } from "./kernel.svelte.js";
import { dev_log } from "./dev.svelte.js";
import { create_contract_fixtures } from "../intelligence/prompt-verification.js";

describe("src/engine/kernel.svelte.js — Sovereign Simulation Kernel", () => {
  const { entities } = create_contract_fixtures();

  it("initializes with default state values", () => {
    const kernel = new Kernel({
      user: entities.USER,
      ai: entities.AI,
      fractal: entities.FRACTAL,
    });

    expect(kernel.round).toBe(0);
    expect(kernel.phase).toBe("idle");
    expect(kernel.history).toEqual([]);
    expect(kernel.user.name).toBe("Bob");
  });

  it("submits a user turn, increments round, and updates history", async () => {
    const mock_transport = {
      async stream() {
        return `<think>Stay vigilant.</think>Alice moves forward through the fog.`;
      },
    };

    const kernel = new Kernel({
      user: entities.USER,
      ai: entities.AI,
      fractal: entities.FRACTAL,
      transport: mock_transport,
    });

    const outcome = await kernel.submit_turn("Check the corner.");

    expect(kernel.round).toBe(1);
    expect(kernel.phase).toBe("idle");
    expect(kernel.history).toHaveLength(2);
    expect(kernel.history[0]).toEqual({
      role: "user",
      text: "Check the corner.",
      round: 1,
    });
    expect(kernel.history[1].text).toBe("Alice moves forward through the fog.");
    expect(kernel.history[1].think).toBe("Stay vigilant.");
    expect(outcome.character_turn.prose).toBe("Alice moves forward through the fog.");

    // Check DevMode log recording
    const tempoEvents = dev_log.get_by_type("TURN_TEMPO");
    expect(tempoEvents.length).toBeGreaterThan(0);
  });

  it("rewinds simulation to a previous round", async () => {
    const kernel = new Kernel({
      user: entities.USER,
      ai: entities.AI,
      fractal: entities.FRACTAL,
    });

    kernel.round = 3;
    kernel.history = [
      { role: "user", text: "Turn 1", round: 1 },
      { role: "model", text: "Reply 1", round: 1 },
      { role: "user", text: "Turn 2", round: 2 },
      { role: "model", text: "Reply 2", round: 2 },
      { role: "user", text: "Turn 3", round: 3 },
      { role: "model", text: "Reply 3", round: 3 },
    ];

    kernel.rewind_to_round(1);

    expect(kernel.round).toBe(1);
    expect(kernel.history).toHaveLength(2);
    expect(kernel.history.every((h) => h.round <= 1)).toBe(true);
  });
});
