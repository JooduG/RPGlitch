import { describe, expect, it } from "vitest";
import { to_data_points, context_builder } from "./payload.js";
import { register_state_accessors } from "@utils";

describe("Payload Assembler & Data Points (src/intelligence/payload.js)", () => {
  describe("to_data_points()", () => {
    it("extracts data points according to canonical profile fields", () => {
      const entity = {
        type: "character",
        eternal: {
          physical: "Cybernetic arm and trenchcoat",
          non_physical: "Relentless curiosity",
        },
        present: {
          physical: "Wounded shoulder",
          non_physical: "Alert and focused",
        },
      };

      const points = to_data_points(entity);
      expect(points.length).toBeGreaterThanOrEqual(1);

      const types = points.map((p) => p.type);
      expect(types).toContain("Physical");
    });

    it("returns an empty array for null/empty entity", () => {
      expect(to_data_points(null)).toEqual([]);
      expect(to_data_points({})).toEqual([]);
    });
  });

  describe("context_builder.build_context()", () => {
    it("hydrates triad entities and active NPCs into a unified IntelligencePayload", async () => {
      register_state_accessors({
        runtime: {
          round: 2,
          snapshot_entities: {
            AI: {
              id: "char-1",
              name: "Silvers",
              type: "character",
              eternal: { physical: "Silver hair", non_physical: "Cynical" },
              present: { physical: "Armed with blade", non_physical: "Calm" },
              dynamics: { intensity: 50 },
              past: [],
            },
            USER: {
              id: "user-1",
              name: "Operative",
              type: "user",
              present: { physical: "Tactical gear", non_physical: "Determined" },
              past: [],
            },
            FRACTAL: {
              id: "frac-1",
              name: "The Neon Undercity",
              type: "fractal",
              present: { physical: "Rain-slicked asphalt", non_physical: "Hum of electricity" },
              dynamics: { entropy: 55 },
              past: [],
            },
          },
          snapshot_npcs: {
            "npc-1": {
              id: "npc-1",
              name: "Courier",
              type: "character",
              present: { physical: "Leather satchel", non_physical: "Nervous" },
              speaking_style: "casual",
              past: [],
            },
          },
          snapshot_in_scene_npc_ids: ["npc-1"],
        },
        app: null,
        simulation_state: null,
        simulation_log: null,
      });

      const payload = await context_builder.build_context("I check the street corners.", "simulation", []);

      expect(payload).toBeDefined();
      expect(payload.round).toBe(2);
      expect(payload.input).toBe("I check the street corners.");
      expect(payload.entities.AI.name).toBe("Silvers");
      expect(payload.entities.USER.name).toBe("Operative");
      expect(payload.entities.FRACTAL.name).toBe("The Neon Undercity");
      expect(payload.npc_entities).toHaveLength(1);
      expect(payload.npc_entities[0].name).toBe("Courier");
      expect(payload.in_scene_ids).toEqual(["npc-1"]);
    });
  });
});
