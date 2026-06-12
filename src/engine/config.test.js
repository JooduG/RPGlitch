import { describe, it, expect } from "vitest";
import { APP_VERSION, CONFIG, ROLES, ENTITIES, MESSAGES, ERROR_MESSAGES, VIEWS, THEME } from "./config.js";

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

    it("should have the correct DYNAMICS structure", () => {
      expect(CONFIG.DYNAMICS).toMatchObject({
        RELEVANCE_DYNAMICS_BONUS: 1,
        RELEVANCE_TRIGGER_BONUS: 2,
        RELEVANCE_VECTOR_BONUS: 3,
        VISUAL_TEMP_DEFAULT: 0.45,
        NARRATIVE_TEMP_DEFAULT: 0.7,
        STREAM_SPEED_MS: 30,
      });
    });

    it("should have the correct MESSAGES structure", () => {
      expect(CONFIG.MESSAGES).toEqual({
        CONNECTION_LOST: "Connection lost with the Abyss.",
        REFUSAL_TRIGGERS: expect.any(Array),
      });

      CONFIG.MESSAGES.REFUSAL_TRIGGERS.forEach((trigger) => {
        expect(typeof trigger).toBe("string");
      });
    });

    it("should have the correct THEME bridge", () => {
      expect(CONFIG.THEME).toMatchObject({
        GRID_UNITS: expect.any(Number),
        ANIMATION_STANDARD: expect.any(String),
        EASE_STANDARD: expect.any(String),
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

    it("should re-export MESSAGES correctly", () => {
      expect(MESSAGES).toBe(CONFIG.MESSAGES);
    });

    it("should re-export VIEWS correctly", () => {
      expect(VIEWS).toBe(CONFIG.VIEWS);
    });

    it("should re-export THEME correctly", () => {
      expect(THEME).toBe(CONFIG.THEME);
    });

    it("should export ERROR_MESSAGES as an alias for MESSAGES", () => {
      expect(ERROR_MESSAGES).toBe(CONFIG.MESSAGES);
    });
  });
});
