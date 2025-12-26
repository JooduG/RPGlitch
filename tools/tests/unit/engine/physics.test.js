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
        velocity: 95, // Increased to trigger new threshold (90)
        resonance: 10,
      };
      const output = calculateDynamics(input);

      // 80 - 10 = 70 (New Penalty)
      expect(output.permeability).toBe(70);
      expect(output.velocity).toBe(95);
      expect(output._flags.glassCannon).toBeFalsy();
    });

    test("Law 2: Fog of War (High Entropy reduces Resonance)", () => {
      const input = {
        entropy: 90, // Increased to safely trigger new threshold (85)
        permeability: 50,
        velocity: 50,
        resonance: 50,
      };
      const output = calculateDynamics(input);

      // 50 - 5 = 45 (New Dampening)
      expect(output.resonance).toBe(45);
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

      // 50 - 10 = 40
      expect(output.entropy).toBe(40);
    });

    test("Law 4: Panic Spiral (Critical Entropy forces Velocity up)", () => {
      const input = {
        entropy: 99, // Increased to safely trigger new threshold (95)
        permeability: 50,
        velocity: 40,
        resonance: 10,
      };
      const output = calculateDynamics(input);

      // Velocity 40 + 15 = 55 (New Boost)
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

    test("Bounds Clamping (0-100)", () => {
      const input = {
        entropy: -50,
        permeability: 150,
        velocity: 10,
        resonance: 10,
      };
      const output = calculateDynamics(input);

      expect(output.entropy).toBe(0);
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

  test("buildUpdater injects forcedDynamics into CURRENT_STATE", async () => {
    const forcedDynamics = {
      entropy: 55,
      permeability: 44,
      velocity: 33,
      resonance: 22,
      _flags: { panicSpiral: true },
    };

    const payload = await builder.buildUpdater("ai_character", forcedDynamics);

    // V5 Check: Ensure system prompt is correct
    expect(payload.system).toContain("[SYSTEM: PROMETHEUS_PHYSICS_V5]");

    // Check that forced dynamics are injected into the JSON block
    expect(payload.system).toContain('"entropy": 55');
    expect(payload.system).toContain('"permeability": 44');
    // The _flags might be stringified in the JSON, so checking specific values is safer
    expect(payload.system).toContain('"panicSpiral": true');
  });

  test("buildUpdater includes Calibration Matrix (Bell Curve Logic)", async () => {
    const payload = await builder.buildUpdater("ai_character", null);

    expect(payload.system).toContain("[SYSTEM: PROMETHEUS_PHYSICS_V5]");
    // V5 uses <CALIBRATION_TABLE>
    expect(payload.system).toContain("<CALIBRATION_TABLE>");
    expect(payload.system).toContain("<PHYSICS_LAWS>");
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
