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

  it("continues an existing AI message in-place via continue_turn", async () => {
    let captured_start_with = null;
    const mock_transport = {
      async stream(prompt, options = {}) {
        captured_start_with = options.startWith;
        // Simulates model continuing after the pre-filled startWith
        return `${options.startWith} and smiles softly.`;
      },
    };

    const kernel = new Kernel({
      user: entities.USER,
      ai: entities.AI,
      fractal: entities.FRACTAL,
      transport: mock_transport,
    });

    kernel.round = 1;
    kernel.history = [
      { role: "user", text: "Look at me.", round: 1 },
      { role: "model", text: "She looks over", think: "Feel gentle", round: 1 },
    ];

    const outcome = await kernel.continue_turn({
      target_prose: "She looks over",
      target_think: "Feel gentle",
      target_round: 1,
      target_history_index: 1,
    });

    expect(captured_start_with).toBe("<think>Feel gentle</think>\nShe looks over ");
    expect(outcome.prose).toBe("She looks over and smiles softly.");
    expect(outcome.continuation_prose).toBe("and smiles softly.");
    expect(kernel.history[1].text).toBe("She looks over and smiles softly.");
    expect(kernel.phase).toBe("idle");
  });

  it("B01 regression: avoids duplicate user entry when user text is already at the tail of history", async () => {
    const mock_transport = {
      async stream() {
        return `<think>Focus.</think>Action completed.`;
      },
    };

    const kernel = new Kernel({
      user: entities.USER,
      ai: entities.AI,
      fractal: entities.FRACTAL,
      transport: mock_transport,
    });

    kernel.history = [{ role: "user", text: "Look around.", round: 1 }];

    await kernel.submit_turn("Look around.");

    // Exactly 1 user entry and 1 model entry, no duplicate user entry at tail
    expect(kernel.history).toHaveLength(2);
    expect(kernel.history[0]).toEqual({
      role: "user",
      text: "Look around.",
      round: 1,
    });
    expect(kernel.history[1].role).toBe("model");
  });

  it("B02 regression: retry-after-AI-turn produces an outcome without aborting with null and replaces model entry", async () => {
    const mock_transport = {
      async stream() {
        return `<think>Retry thought.</think>Regenerated reply.`;
      },
    };

    const kernel = new Kernel({
      user: entities.USER,
      ai: entities.AI,
      fractal: entities.FRACTAL,
      transport: mock_transport,
      round: 1,
    });

    kernel.history = [
      { role: "user", text: "First prompt", round: 1 },
      { role: "model", text: "First reply", round: 1 },
    ];

    const outcome = await kernel.retry();

    expect(outcome).not.toBeNull();
    expect(outcome.character_turn.prose).toBe("Regenerated reply.");
    // Retry should not advance round
    expect(kernel.round).toBe(1);
    expect(kernel.phase).toBe("idle");

    // Retry history hygiene: exactly one model entry for the round replacing the previous reply
    const round_1_model_entries = kernel.history.filter((h) => h.round === 1 && h.role === "model");
    expect(round_1_model_entries).toHaveLength(1);
    expect(round_1_model_entries[0].text).toBe("Regenerated reply.");
    expect(kernel.history).toHaveLength(2);
    expect(kernel.history[0]).toEqual({ role: "user", text: "First prompt", round: 1 });
  });

  it("B02 regression: targetless continue produces an outcome without aborting with null", async () => {
    const mock_transport = {
      async stream() {
        return `<think>Continuing.</think>Extended scene text.`;
      },
    };

    const kernel = new Kernel({
      user: entities.USER,
      ai: entities.AI,
      fractal: entities.FRACTAL,
      transport: mock_transport,
      round: 1,
    });

    kernel.history = [
      { role: "user", text: "First prompt", round: 1 },
      { role: "model", text: "First reply", round: 1 },
    ];

    const outcome = await kernel.continue();

    expect(outcome).not.toBeNull();
    expect(outcome.character_turn.prose).toBe("Extended scene text.");
    expect(kernel.round).toBe(1);
    expect(kernel.phase).toBe("idle");
  });
});
