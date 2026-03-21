/**
 * @file src/core/intelligence/DynamicsEngine.test.js
 * @description Unit tests for the Dynamics Engine (RPGlitch Engine v2).
 * Verifies Physics triggers, Tone resolution, and Prompt assembly.
 */
import { describe, expect, it } from "vitest";
import { DynamicsEngine } from "./DynamicsEngine.js";
describe("Dynamics Engine v2 (Refactored)", () => {
  describe("Mechanics: simulation_dynamics", () => {
    const createBaseState = () => ({
      ai: {
        dynamics: { intensity: 50, chaos: 50, openness: 50, affinity: 50 },
      },
      fractal: {
        dynamics: { velocity: 50, entropy: 50 },
      },
      flags: [],
      signals: {},
      signal_prompts: [],
    });
    it("should resole Default Dynamics correctly", () => {
      const state = createBaseState();
      const triggered = [];
      DynamicsEngine.simulation_dynamics(state, null, triggered);
      expect(state.ai.dynamics.intensity).toBe(50);
      expect(state.signal_prompts.length).toBe(0);
    });
    it("should trigger reflexes on high-intensity input", () => {
      const state = createBaseState();
      state.ai.dynamics.intensity = 70;
      const prevState = createBaseState();
      prevState.ai.dynamics.intensity = 70;
      const triggered = DynamicsEngine.dynamics_scan("I run towards the exit");
      DynamicsEngine.simulation_dynamics(state, prevState, triggered);
      // 70 + 10 (KINETICS reflex) = 80
      // Gravity: (50 - 80) * 0.25 = -7.5
      // 80 - 7.5 = 72.5 -> Round to 73
      expect(state.ai.dynamics.intensity).toBe(73);
      expect(state.signal_prompts.some((i) => i.includes("Pacing fast"))).toBe(
        true,
      );
      expect(state.signals.ADRENALINE).toBe(true);
    });
    it("should trigger VIOLENCE reflex on combat input", () => {
      const state = createBaseState();
      const triggered = DynamicsEngine.dynamics_scan("I punch him in the face");
      DynamicsEngine.simulation_dynamics(state, null, triggered);
      // 50 + 15 (VIOLENCE) = 65
      // Gravity: (50 - 65) * 0.25 = -3.75
      // 65 - 3.75 = 61.25 -> Round to 61
      expect(state.ai.dynamics.intensity).toBe(61);
      expect(state.ai.dynamics.chaos).toBe(50);
      expect(state.ai.dynamics.openness).toBe(43); // 50 - 10 = 40. Gravity: 40 + (50-40)*.25 = 42.5 -> 43
    });
    it("should trigger Passive Natural Force (INTENSITY_AUTO_LOCK)", () => {
      const state = createBaseState();
      state.ai.dynamics.intensity = 95; // Above 90 — triggers PHYSICS LAW threshold
      DynamicsEngine.simulation_dynamics(state, null, []);
      // Law: Intensity > 90 -> Openness -10
      // Openness: 50 - 10 = 40. Gravity: 40 + (50-40)*.25 = 42.5 -> 43
      expect(state.ai.dynamics.openness).toBe(43);
    });
  });
  describe("Simulation Orchestration", () => {
    it("should simulate a full payload", () => {
      const payload = {
        input: "I run fast",
        entities: {
          AI: {
            dynamics: { intensity: 70, chaos: 50, openness: 50, affinity: 50 },
          },
          FRACTAL: {
            dynamics: { velocity: 50, entropy: 50 },
          },
        },
        history: {
          dynamics: { intensity: 70, chaos: 50, openness: 50, affinity: 50 },
        },
      };
      const snapshot = DynamicsEngine.simulate(payload);
      expect(snapshot.ai.dynamics.intensity).toBe(73);
      expect(snapshot.signal_prompts.length).toBeGreaterThan(0);
    });
  });
  describe("Skeptic's Toll: SUSPICIOUS reflex", () => {
    const createTollState = (openness = 50) => ({
      ai: {
        dynamics: {
          intensity: 50,
          chaos: 50,
          openness: openness,
          affinity: 50,
        },
      },
      fractal: { dynamics: { velocity: 50, entropy: 50 } },
      flags: [],
      signals: {},
      signal_prompts: [],
    });
    it("should SILENTLY PASS if openness >= 30", () => {
      const state = createTollState(50);
      const triggered = [
        {
          id: "SUSPICIOUS",
          config: {
            filter: { below: { openness: 30 } },
            effect: { ai: { affinity: -10, intensity: 10 } },
          },
        },
      ];
      DynamicsEngine.simulation_dynamics(state, null, triggered);
      expect(state.ai.dynamics.openness).toBe(50);
      expect(state.ai.dynamics.affinity).toBe(50);
      expect(state.signal_prompts.length).toBe(0);
    });
    it("should TRIGGER REFLEX if openness < 30", () => {
      const state = createTollState(10);
      const triggered = [
        {
          id: "SUSPICIOUS",
          config: {
            filter: { below: { openness: 30 } },
            effect: {
              ai: { affinity: -10, intensity: 10 },
              text: "You don't believe them.",
            },
          },
        },
      ];
      DynamicsEngine.simulation_dynamics(state, null, triggered);
      expect(state.ai.dynamics.openness).toBe(20);
      expect(state.ai.dynamics.intensity).toBe(58);
      expect(state.ai.dynamics.affinity).toBe(43);
      expect(
        state.signal_prompts.some((p) => p.includes("You don't believe them")),
      ).toBe(true);
    });
  });
  describe("Trigger Matching & Semantic Grouping", () => {
    const scan = (text) => DynamicsEngine.dynamics_scan(text);
    it("resolves 'kissing' to root 'affection'", () => {
      const matches = scan("She was kissing him.");
      const match = matches.find((m) => m.scan === "affection");
      expect(match).toBeDefined();
      expect(match.id).toBe("VULNERABILITY");
    });
    it("resolves 'fought' to root 'combat'", () => {
      const matches = scan("They fought bravely.");
      const match = matches.find((m) => m.scan === "combat");
      expect(match).toBeDefined();
      expect(match.id).toBe("VIOLENCE");
    });
    it("resolves 'screamed' to root 'horror'", () => {
      const matches = scan("She screamed in terror.");
      const match = matches.find((m) => m.scan === "horror");
      expect(match).toBeDefined();
      expect(match.id).toBe("ANOMALY");
    });
    it("resolves 'ran' to root 'athletics'", () => {
      const matches = scan("He ran away.");
      const reflexes_found = matches.filter((m) => m.scan === "athletics");
      expect(reflexes_found.length).toBe(1);
      expect(reflexes_found[0].id).toBe("KINETICS");
    });
    it("resolves 'barrier' to root 'armor'", () => {
      const matches = scan("A shimmering barrier appeared.");
      const match = matches.find((m) => m.scan === "armor");
      expect(match).toBeDefined();
      expect(match.id).toBe("FORTIFICATION");
    });
    it("resolves 'hidden' to root 'hide' in BOTH FORTIFICATION and ANOMALY", () => {
      const matches = scan("She kept her feelings hidden.");
      const hide_matches = matches.filter((m) => m.scan === "hide");
      expect(hide_matches.length).toBe(2);
      const ids = hide_matches.map((m) => m.id);
      expect(ids).toContain("FORTIFICATION");
      expect(ids).toContain("ANOMALY");
    });
  });
});
