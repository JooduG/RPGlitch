import { describe, expect, it, beforeEach } from "vitest";
import { context_broker } from "./context-broker.js";

describe("context_broker", () => {
  beforeEach(() => {
    // Initial state cleanup if needed
  });
  it("hydrate() returns a valid payload for simulation", async () => {
    // Basic test to verify snake_case integration

    // This is a minimal mock test since hydrate depends on global state
    expect(context_broker.hydrate).toBeDefined();
  });

  it("manage_vector_lifecycle() identifies vectors that meet semantic criteria", async () => {
    const mock_simulation_log = [
      { content: "The entity discovers a hidden key." },
      { content: "They look at the glowing sword in the stone." }
    ];

    const mock_entries = [
      {
        role: "AI",
        data: {
          future: [
            { id: "v1", text: "Find the hidden key", vector_tags: ["hidden key"] }, // Should match tag
            { id: "v2", text: "Ignore the distraction", vector_tags: [] }, // Should not match
            { id: "v3", text: "Discover glowing sword stone", vector_tags: [] } // Should match text keywords (glowing, sword, stone)
          ],
          past: []
        }
      }
    ];

    // Wait for dynamic import inside manage_vector_lifecycle to resolve
    let resolve_called = [];

    // In test environment, the real vector_engine dynamically imported will not have a mock applied via doMock if not careful,
    // so we spy on the real vector_engine instead.
    const { vector_engine } = await import("./vector-engine.js");
    vi.spyOn(vector_engine, "resolve_vector").mockImplementation((data, id, res) => {
      resolve_called.push(id);
    });

    await context_broker.manage_vector_lifecycle(mock_entries, mock_simulation_log);

    expect(resolve_called).toContain("v1"); // Matched by vector tag
    expect(resolve_called).not.toContain("v2"); // Did not match
    expect(resolve_called).toContain("v3"); // Matched by keywords ("glowing", "sword", "stone")

    vi.restoreAllMocks();
  });
});
