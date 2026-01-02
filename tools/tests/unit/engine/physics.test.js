import { jest } from "@jest/globals";
import {
  calculateDynamics,
  parseLlmResponse,
} from "../../../../apps/rpglitch/js/engine/physics/main.js";
import { ContextBuilder } from "../../../../apps/rpglitch/js/engine/prompter.js";

// --- MOCKS ---
// We mock the store and entities to isolate the logic from the database/browser
jest.mock("../../../../apps/rpglitch/js/core/state.js", () => ({
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
}));

jest.mock("../../../../apps/rpglitch/js/data/repo.js", () => ({
  entities: {
    get: jest.fn(),
    getSnapshot: jest.fn(),
    createSnapshot: jest.fn(),
  },
}));

// Import the mocked entities to configure return values in tests
import { entities } from "../../../../apps/rpglitch/js/data/repo.js";

describe("PROMETHEUS ENGINE V5", () => {
  // ==========================================
  // LAYER 1: THE LAWS OF PHYSICS (Unit Tests)
  // ==========================================
  describe("Physics Engine (calculateDynamics)", () => {
    test("Law 1: Adrenaline Shield (High Velocity reduces Permeability)", () => {
      const input = {
        entropy: 10,
        permeability: 80,
        velocity: 95,
        resonance: 10,
      };
      const output = calculateDynamics(input);
      // DEBUGGING: Force fail to see actual values
      if (output.permeability !== 68 || output.velocity !== 91) {
        throw new Error(
          `DEBUG: Perm=${output.permeability}, Vel=${output.velocity}`,
        );
      }
      expect(output.permeability).toBeLessThan(75);
      expect(output.velocity).toBeGreaterThanOrEqual(90);
    });

    test("Law 2: Fog of War (High Entropy reduces Resonance)", () => {
      const input = {
        entropy: 90,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      };
      const output = calculateDynamics(input);

      // Dampening: 50 - 5 = 45.
      // Gravity: 45 + (50 - 45)*0.1 = 45.5 => Round to 46
      expect(output.resonance).toBe(46);
      expect(output._flags.fogOfWar).toBeTruthy();
    });

    test("Law 3: Cool-Down (Low Velocity reduces Entropy)", () => {
      const input = {
        entropy: 50,
        permeability: 50,
        velocity: 10,
        resonance: 50,
      };
      const output = calculateDynamics(input);

      // Cool-down: 50 - 10 = 40.
      // Gravity: 40 + (50 - 40)*0.1 = 41
      expect(output.entropy).toBe(41);
    });

    test("Law 4: Panic Spiral (Critical Entropy forces Velocity up)", () => {
      const input = {
        entropy: 99,
        permeability: 50,
        velocity: 40,
        resonance: 10,
      };
      const output = calculateDynamics(input);

      // Panic Boost: 40 + 15 = 55.
      // Gravity: 55 + (50 - 55)*0.1 = 54.5 => Round to 55
      expect(output.velocity).toBe(55);
      expect(output._flags.panicSpiral).toBeTruthy();
    });

    test("Law 5: Echo Chamber (Logic Flag Only)", () => {
      const input = {
        entropy: 10,
        permeability: 50,
        velocity: 10,
        resonance: 95,
      };
      const output = calculateDynamics(input);

      expect(output._flags.echoChamber).toBeTruthy();
    });

    test("Law 7: Relative Gravity (Universal)", () => {
      // Test Universal Baseline (50)
      const input = {
        entropy: 100,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      };
      const output = calculateDynamics(input);

      // 100 + (50-100)*0.1 = 95
      expect(output.entropy).toBe(95);
      expect(output._flags.gravityPull).toBeTruthy();
    });

    test("Law 7: Relative Gravity (Custom Baseline)", () => {
      const input = {
        entropy: 50,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      };
      const baseline = { entropy: 80 }; // Naturally chaotic

      const output = calculateDynamics(input, baseline);

      // 50 + (80-50)*0.1 = 53
      expect(output.entropy).toBe(53);
    });

    test("Bounds Clamping (0-100)", () => {
      const input = {
        entropy: -50,
        permeability: 150,
        velocity: 10,
        resonance: 10,
      };
      const output = calculateDynamics(input);

      // Notes on Logic Trace:
      // 1. Law 3 (Cool-Down): Velocity (10) < 15.
      //    Entropy (-50) -> -60 -> Clamped to 0.
      // 2. Gravity: Entropy (0) -> 0 + (50-0)*0.1 = 5.
      expect(output.entropy).toBe(5);

      // Permeability (150) -> Gravity (150 + (50-150)*0.1 = 140) -> Clamped to 100
      expect(output.permeability).toBe(100);
    });
  });

  describe("LLM Response Parser (parseLlmResponse)", () => {
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
      const result = parseLlmResponse(input);
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
      const result = parseLlmResponse(input);
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
      const result = parseLlmResponse(input);
      expect(result.updates.valid).toBe(true);
    });

    test("Error Handling: Returns error on malformed JSON", () => {
      const input = "{ bad json ";
      const result = parseLlmResponse(input);
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
    entities.getSnapshot.mockResolvedValue({
      id: "char-ai",
      name: "AI",
      type: "character",
      dynamics: {
        entropy: 10,
        permeability: 10,
        velocity: 10,
        resonance: 10,
      },
    });
    entities.get.mockResolvedValue({
      id: "char-ai",
      name: "AI",
      type: "character",
    });
  });

  test("buildPulse injects dynamics into INPUT_CONTEXT", async () => {
    const mockEntity = {
      id: "char-ai",
      name: "AI",
      type: "character",
      dynamics: {
        entropy: 55,
        permeability: 44,
        velocity: 33,
        resonance: 22,
      },
      present: {
        physical: "Test Physical",
        mental: "Test Mental",
      },
    };

    const history = [{ role: "user", text: "HI" }];
    const activeThreads = ["Thread 1"];

    const payload = await builder.buildPulse(
      mockEntity,
      history,
      activeThreads,
    );

    // V1 Check: Ensure system prompt is correct
    expect(payload.system).toContain("[SYSTEM: SIMULATION_PULSE_V1]");

    // Check that dynamics are injected
    expect(payload.system).toContain('"entropy": 55');
    expect(payload.system).toContain('"permeability": 44');

    // Check plot injection
    expect(payload.system).toContain('[Index 0] "Thread 1"');

    // Check state injection
    expect(payload.system).toContain("Test Physical");
    expect(payload.system).toContain("Test Mental");
  });

  test("buildPulse mandates strict JSON schema", async () => {
    const mockEntity = { dynamics: {} };
    const payload = await builder.buildPulse(mockEntity, []);

    expect(payload.system).toContain("<OUTPUT_SCHEMA>");
    expect(payload.params.response_format.type).toBe("json_object");
  });
});

// ==========================================
// LAYER 3: THE ARCHIVIST (Memory Logic)
// ==========================================
describe("The Archivist", () => {
  let builder;

  beforeEach(() => {
    builder = new ContextBuilder("story-1");
  });

  test("buildArchivist generates compression prompt", async () => {
    const mockEntity = {
      name: "TestChar",
      type: "character",
      past: "A very long log...",
    };

    const payload = await builder.buildArchivist(mockEntity);

    // V5 Check
    expect(payload.system).toContain("[SYSTEM: PROMETHEUS_ARCHIVIST_V5]");
    expect(payload.system).toContain("Do NOT delete Proper Nouns");
    expect(payload.system).toContain("TestChar");
    // Ensure temp is lowered for precision
    expect(payload.params.temperature).toBeLessThan(0.5);
  });
});
