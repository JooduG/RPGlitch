import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContextBroker } from "./ContextBroker.js";
import { clean_text } from "../engine/text_parser.js";
// Mock dependencies
vi.mock("@state/app.svelte.js", () => ({
  app: {
    simulation: {
      dynamics: { velocity: 50, entropy: 50, permeability: 50, resonance: 50 },
    },
  },
}));
vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    round: 5,
    active_ai: {
      name: "AI",
      role: "Assistant",
      eternal: {
        non_physical: "A mysterious helper.",
        physical: "Solid metal core.",
      },
      present: {
        non_physical: "Active and processing.",
        physical: "Holographic shimmering form.",
      },
    },
    active_user: {
      name: "User",
      eternal: { non_physical: "The protagonist." },
    },
    active_fractal: {
      name: "The City",
      eternal: { non_physical: "A neon metropolis." },
      future: [{ id: "1", text: "Find the key" }],
    },
    // Universal Vector API Mocks
    active_vectors: vi.fn((role) =>
      role === "FRACTAL" ? [{ id: "1", text: "Find the key" }] : [{ id: "2", text: "EXPLORE" }]
    ),
    active_vector: vi.fn((role) => (role === "FRACTAL" ? "Find the key" : "EXPLORE")),
    active_echoes: vi.fn(() => []),
  },
}));
describe("ContextBroker (Refactored)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should hydrate an IntelligencePayload with consistent structure", async () => {
    const payload = await ContextBroker.hydrate("Look around", "simulation");
    expect(payload.round).toBe(5);
    expect(payload.input).toBe("Look around");
    expect(payload.entities.AI.name).toBe("AI");
    expect(payload.entities.USER.name).toBe("User");
  });
  it("should include physical and visual fields in simulation mode", async () => {
    const payload = await ContextBroker.hydrate("Who am I?", "simulation");
    // _data_points should now contain Physical points
    const ai_data_points = payload.entities.AI._data_points;
    const has_physical = ai_data_points.some((f) => f.type === "Physical");
    expect(has_physical).toBe(true);
    // Fragments should have the nested structure
    expect(payload.entities.AI.fragments.eternal).toBeDefined();
    expect(payload.entities.AI.fragments.present).toBeDefined();
  });
  it("should prioritize data points based on objective in lexical_filter", () => {
    const data_points = [{ text: "I like apples" }, { text: "I need to find the door now" }];
    const objective = "Find the door";
    const filtered = ContextBroker.lexical_filter(data_points, objective);
    expect(filtered[0].text).toContain("find the door");
  });
  it("should punchy transform text with clean_text", () => {
    const input = "   Too   much    whitespace   ";
    const output = clean_text(input);
    expect(output).toBe("Too much whitespace");
  });
});
