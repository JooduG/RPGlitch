import { jest } from "@jest/globals";
import { Warden } from "../../../../src/warden/index.js";
import { ContextBuilder } from "../../../../src/scholar/index.js";

// --- MOCKS ---
// We mock the store and entities to isolate the logic from the database/browser
jest.mock("../../../../src/gamemaster/bus.js", () => ({
  state: {
    story: {
      byId: {
        "story-1": {
          id: "story-1",
          aiCharacterId: "char-ai",
          userCharacterId: "char-user",
          fractalId: "world-1",
        },
      },
    },
    messages: {
      byStoryId: {
        "story-1": [
          { role: "user", text: "Hello" },
          { role: "ai", text: "Hi there." },
        ],
      },
    },
    settings: {
      model: "test-model",
    },
  },
  events: {
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    removeEventListener: jest.fn(),
  },
  EVENTS: {
    DB_UPDATED: "DB_UPDATED",
  },
}));

jest.mock("../../../../src/scholar/database/repository.js", () => ({
  entities: {
    get: jest.fn(),
    getSnapshot: jest.fn(),
    createSnapshot: jest.fn(),
  },
}));

// Import the mocked entities to configure return values in tests
import { entities } from "../../../../src/scholar/database/repository.js";

describe("PROMETHEUS ENGINE V5", () => {
  // ==========================================
  // LAYER 1: THE LAWS OF PHYSICS (Unit Tests)
  // ==========================================
  describe("Physics Engine (Warden.applyLaws)", () => {
    // --- VELOCITY LAWS ---
    test("Law 1: Adrenaline Shield (Vel > 90)", () => {
      // Effect: Perm -10, Res -5
      const input = {
        entropy: 50,
        permeability: 50,
        velocity: 95,
        resonance: 50,
      };
      const output = Warden.applyLaws(input);
      expect(output.permeability).toBe(43);
      // Res: 50 - 5 = 45. Gravity(50) -> 45 + (50-45)*0.25 = 46.25 -> 46.
      expect(output.resonance).toBe(46);
      expect(output._flags.adrenalineShield).toBeTruthy();
    });

    test("Law: Deep Breath (Vel < 10)", () => {
      // Effect: Res +10, Ent -5
      const input = {
        entropy: 50,
        permeability: 50,
        velocity: 5,
        resonance: 50,
      };
      const output = Warden.applyLaws(input);

      // Res: 50 + 10 = 60. Gravity -> 60 + (50-60)*0.25 = 57.5 -> 58.
      expect(output.resonance).toBe(58);
      // Ent: 50 - 5 = 45. Gravity -> 45 + 1.25 = 46.25 -> 46.
      expect(output.entropy).toBe(46);
      expect(output._flags.deepBreath).toBeTruthy();
    });

    // --- ENTROPY LAWS ---
    test("Law: Fog of War (Ent > 90)", () => {
      // Effect: Res -5, Vel +10
      const input = {
        entropy: 95,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      };
      const output = Warden.applyLaws(input);

      // Res: 45 -> 46.25 -> 46.
      expect(output.resonance).toBe(46);
      // Vel: 60 -> 57.5 -> 58.
      expect(output.velocity).toBe(58);
      expect(output._flags.fogOfWar).toBeTruthy();
    });

    test("Law: Crystallization (Ent < 10)", () => {
      // Effect: Perm -10, Vel -5
      const input = {
        entropy: 5,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      };
      const output = Warden.applyLaws(input);

      // Perm: 40 -> 42.5 -> 43.
      expect(output.permeability).toBe(43);
      // Vel: 45 -> 46.25 -> 46.
      expect(output.velocity).toBe(46);
      expect(output._flags.crystallization).toBeTruthy();
    });

    // --- PERMEABILITY LAWS ---
    test("Law: Glass Cannon (Perm > 90)", () => {
      // Effect: Flag Only (Director handles multipliers)
      const input = {
        entropy: 50,
        permeability: 95,
        velocity: 50,
        resonance: 50,
      };
      const output = Warden.applyLaws(input);
      expect(output._flags.glassCannon).toBeTruthy();
    });

    test("Law: Iron Bunker (Perm < 10)", () => {
      // Effect: Flag Only
      const input = {
        entropy: 50,
        permeability: 5,
        velocity: 50,
        resonance: 50,
      };
      const output = Warden.applyLaws(input);
      expect(output._flags.ironBunker).toBeTruthy();
    });

    // --- RESONANCE LAWS ---
    test("Law: Obsession (Res > 90)", () => {
      // Effect: Ent -10, Perm -5
      const input = {
        entropy: 50,
        permeability: 50,
        velocity: 50,
        resonance: 95,
      };
      const output = Warden.applyLaws(input);

      // Ent: 40 -> 42.5 -> 43.
      expect(output.entropy).toBe(43);
      // Perm: 45 -> 46.25 -> 46.
      expect(output.permeability).toBe(46);
      expect(output._flags.obsession).toBeTruthy();
    });

    test("Law: Apathy (Res < 10)", () => {
      // Effect: Vel -10, Ent +5
      const input = {
        entropy: 50,
        permeability: 50,
        velocity: 50,
        resonance: 5,
      };
      const output = Warden.applyLaws(input);

      // Vel: 40 -> 42.5 -> 43.
      expect(output.velocity).toBe(43);
      // Ent: 55 -> 53.75 -> 54.
      expect(output.entropy).toBe(54);
      expect(output._flags.apathy).toBeTruthy();
    });

    // --- SPECIAL CASES ---
    test("Special: The Echo Chamber (Res > 80, Ent < 20)", () => {
      const input = {
        entropy: 10,
        permeability: 50,
        velocity: 50,
        resonance: 85,
      };
      const output = Warden.applyLaws(input);
      expect(output._flags.echoChamber).toBeTruthy();
    });

    test("Special: The Venus (Vel < 20, Perm > 80)", () => {
      const input = {
        entropy: 50,
        permeability: 85,
        velocity: 10,
        resonance: 50,
      };
      const output = Warden.applyLaws(input);
      expect(output._flags.theVenus).toBeTruthy();
    });

    // --- GRAVITY ---
    test("Gravity: Universal Baseline (50)", () => {
      const input = {
        entropy: 100,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      };
      const output = Warden.applyLaws(input);
      // 100 -> 87.5 -> 88.
      expect(output.entropy).toBe(88);
      // Note: Fog of War at 100
      // Res: 45 -> 46.25 -> 46.
      // Vel: 60 -> 57.5 -> 58.
      expect(output.resonance).toBe(46);
      expect(output.velocity).toBe(58);
    });

    test("Gravity: Custom Baseline", () => {
      const input = {
        entropy: 50,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      };
      // Baseline 80.
      const baseline = { entropy: 80 };
      const output = Warden.applyLaws(input, baseline);
      // 50 + (80-50)*0.25 = 57.5 -> 58.
      expect(output.entropy).toBe(58);
    });

    test("Bounds Clamping", () => {
      const input = {
        entropy: -50,
        permeability: 150,
        velocity: 50,
        resonance: 50,
      };
      const output = Warden.applyLaws(input);
      // Clamped to 0 and 100 before Gravity? No, usually calculate then clamp final.
      // But implementation applies laws THEN gravity THEN clamp.
      // Ent (-50) -> Gravity toward 50?
      // Implementation doesn't clamp inputs.
      // Ent -50. Diff = 100. Pull = 10. New = -40. Clamped = 0.
      expect(output.entropy).toBe(0);
      expect(output.permeability).toBe(100);
    });
  });

  describe("LLM Response Parser (Warden.parse)", () => {
    test("Standard Parse: JSON + HUD + Explanations", () => {
      const input = `
        [STATUS_HUD]
        Entropy: 50 (Stable)
        Velocity: 10 (Slow)
        [/STATUS_HUD]
        {
          "dynamics": { "entropy": 50 }
        }
      `;
      const result = Warden.parse(input);
      expect(result.error).toBeNull();
      expect(result.updates.dynamics.entropy).toBe(50);
      expect(result.explanations.entropy).toBe("(Stable)");
    });

    test("Resilience: Handles // Comments (The Fix)", () => {
      const input = `
        {
          "dynamics": {
            "entropy": 50 // This comment used to break JSON.parse
          }
        }
      `;
      const result = Warden.parse(input);
      expect(result.error).toBeNull();
      expect(result.updates.dynamics.entropy).toBe(50);
    });

    test("Resilience: Strips <think> tags", () => {
      const input = `
        <think>
        This should be ignored.
        </think>
        { "valid": true }
      `;
      const result = Warden.parse(input);
      expect(result.updates.valid).toBe(true);
    });

    test("Error Handling: Returns error on malformed JSON", () => {
      const input = "{ bad json ";
      const result = Warden.parse(input);
      expect(result.error).toBeDefined();
      expect(result.updates).toEqual({});
    });
  });
});

// ==========================================
// LAYER 2: THE BRIDGE (Context Integration)
// ==========================================
describe("ContextBuilder (Physics Injection)", () => {
  let builder;

  beforeEach(() => {
    builder = new ContextBuilder("story-1");
    jest.clearAllMocks();

    // Mock Entity Resolution
    entities.get.mockResolvedValue({
      id: "char-ai",
      name: "AI",
      type: "character",
    });
  });

  test("buildWardenPrompt injects basic context", async () => {
    const mockEntity = {
      id: "char-ai",
      name: "AI",
      type: "character",
      dynamics: {
        entropy: 55,
        velocity: 33,
      },
      customData: { plot: { active: [] } }, // Ensure activeThreads are mocked if accessed
    };

    const history = [{ role: "user", text: "HI" }];

    // New Signature: (target, others, history, activeThreads)
    const payload = await builder.buildWardenPrompt(
      mockEntity,
      [],
      history,
      [],
    );

    // V5.6 Check: Ensure system prompt is correct
    expect(payload.system).toContain("[SYSTEM: PROMETHEUS_WARDEN]");
    expect(payload.system).toContain("Target: AI");

    // Check that history is represented (though specific format depends on implementation)
    // In our case it's joined in historyStr and passed to Strategies.warden
    expect(payload.system).toContain("[User]: HI");
  });

  test("buildWardenPrompt output schema check", async () => {
    const mockEntity = { name: "AI", dynamics: {} };
    // New Signature
    const payload = await builder.buildWardenPrompt(mockEntity, [], [], []);

    // Updated for V5.2 Schema
    expect(payload.system).toContain("[JSON SCHEMA]");
    expect(payload.system).toContain(
      '"log_entry": "Short summary of events from AI\'s biased perspective."',
    );
    // Update to match new delta schema if necessary, or generic check
    expect(payload.system).toContain('"dynamics": {');
  });
});
