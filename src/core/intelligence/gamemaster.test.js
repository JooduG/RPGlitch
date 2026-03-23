/**
 * @file src/core/intelligence/gamemaster.test.js
 * 🧪 TEST: Gamemaster Logic
 */

import { describe, it, expect } from "vitest";
import { gamemaster } from "./intelligence-kernel.js";

describe("Gamemaster Logic", () => {
  it("should generate narrative bridges for high entropy", () => {
    const state = {
      fractal: { dynamics: { entropy: 90 } },
      signal_prompts: ["Ambient chill."],
    };

    const bridges = gamemaster.generate_narrative_bridges(state);
    expect(bridges).toContain(
      "CRITICAL: Structural reality is collapsing. Describe environmental glitches and non-linear decay.",
    );
  });

  it("should generate narrative bridges for high intensity", () => {
    const state = {
      ai: { dynamics: { intensity: 90 } },
      signal_prompts: [],
    };

    const bridges = gamemaster.generate_narrative_bridges(state);
    expect(bridges).toContain(
      "CONDITION: The AI Character is hyper-adrenalized. Use short, sharp, sensory-heavy sentences.",
    );
  });

  it("should generate narrative bridges for low openness", () => {
    const state = {
      ai: { dynamics: { openness: 10 } },
      signal_prompts: [],
    };

    const bridges = gamemaster.generate_narrative_bridges(state);
    expect(bridges).toContain(
      "MECHANIC: The character is emotionally sealed. Deflect personal questions and maintain cold distance.",
    );
  });

  it("should combine existing signal prompts with GM bridges", () => {
    const state = {
      ai: { dynamics: { intensity: 90 } },
      signal_prompts: ["Existing signal."],
    };

    const bridges = gamemaster.generate_narrative_bridges(state);
    expect(bridges).toEqual([
      "Existing signal.",
      "CONDITION: The AI Character is hyper-adrenalized. Use short, sharp, sensory-heavy sentences.",
    ]);
  });
});
