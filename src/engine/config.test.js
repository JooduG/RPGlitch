import { describe, it, expect } from "vitest";
import { APP_VERSION, CONFIG, ROLES, ENTITIES, VIEWS } from "./config.js";

describe("core/engine/config", () => {
  it("should have a valid APP_VERSION format", () => {
    // Checks for a format like "x.y.z (Codename)" to avoid breaking on version bumps.
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+ \(.+\)$/);
    expect(APP_VERSION).toContain("Chalk Regime");
  });

  describe("CONFIG structure", () => {
    it("should have the correct ENTITIES structure", () => {
      expect(CONFIG.ENTITIES).toEqual({
        AI: "ai_character",
        USER: "user_persona",
        FRACTAL: "fractal",
      });
    });

    it("should have the correct ROLES structure", () => {
      expect(CONFIG.ROLES).toEqual({
        USER: "user",
        AI: "ai",
        FRACTAL: "fractal",
        SYSTEM: "system",
      });
    });

    it("should have the correct VIEWS structure", () => {
      expect(CONFIG.VIEWS).toEqual({
        STORYBOARD: "storyboard",
        STORYMODE: "storymode",
      });
    });
  });

  describe("Re-exports", () => {
    it("should re-export ROLES correctly", () => {
      expect(ROLES).toBe(CONFIG.ROLES);
    });

    it("should re-export ENTITIES correctly", () => {
      expect(ENTITIES).toBe(CONFIG.ENTITIES);
    });

    it("should re-export VIEWS correctly", () => {
      expect(VIEWS).toBe(CONFIG.VIEWS);
    });
  });
});
