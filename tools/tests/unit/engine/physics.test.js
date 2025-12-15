import { jest } from "@jest/globals";
import { calculateDynamics } from "../../../../apps/rpglitch/js/engine/physics/main.js";
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

describe("PROMETHEUS ENGINE V4.0", () => {
  // ==========================================
  // LAYER 1: THE LAWS OF PHYSICS (Unit Tests)
  // ==========================================
  describe("Physics Engine (calculateDynamics)", () => {
    test("Law 1: Adrenaline Shield (High Velocity reduces Permeability)", () => {
      const input = {
        entropy: 10,
        permeability: 80,
        velocity: 85,
        resonance: 10,
      };
      const output = calculateDynamics(input);

      // 80 - 20 = 60
      expect(output.permeability).toBe(60);
      expect(output.velocity).toBe(85);
      expect(output._flags.glassCannon).toBeFalsy();
    });

    test("Law 2: Fog of War (High Entropy reduces Resonance)", () => {
      const input = {
        entropy: 85,
        permeability: 50,
        velocity: 50,
        resonance: 50,
      };
      const output = calculateDynamics(input);

      // 50 - 10 = 40
      expect(output.resonance).toBe(40);
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
        entropy: 95,
        permeability: 50,
        velocity: 40,
        resonance: 10,
      };
      const output = calculateDynamics(input);

      // Velocity 40 + 20 = 60
      expect(output.velocity).toBe(60);
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

    test("buildUpdater injects PHYSICS_MANDATE when forcedDynamics is provided", async () => {
      const forcedDynamics = {
        entropy: 55,
        permeability: 44,
        velocity: 33,
        resonance: 22,
        _flags: { panicSpiral: true },
      };

      const payload = await builder.buildUpdater(
        "ai_character",
        forcedDynamics,
      );

      // Check System Prompt for the Hard Logic block
      expect(payload.system).toContain("<PHYSICS_MANDATE>");

      // Matches V4.0 Output Format
      expect(payload.system).toContain("- Entropy: 55");
      expect(payload.system).toContain("PANIC_SPIRAL");

      // [FIX] Updated expectation to match V4.0 phrasing
      expect(payload.system).toContain(
        "The Physics Engine enforces these exact values",
      );
    });

    test("buildUpdater falls back to Calibration Matrix if no dynamics provided", async () => {
      const payload = await builder.buildUpdater("ai_character", null);

      expect(payload.system).not.toContain("<PHYSICS_MANDATE>");
      // We expect the SOTA Calibration Matrix
      expect(payload.system).toContain("<PHYSICS_CALIBRATION>");
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

      expect(payload.system).toContain("[SYSTEM: PROMETHEUS_MEMORY_V4.0]");
      expect(payload.system).toContain("NEVER summarize or alter Proper Nouns");
      expect(payload.system).toContain("TestChar");
      // Ensure temp is lowered for precision
      expect(payload.params.temperature).toBeLessThan(0.5);
    });
  });
});
