import { describe, it, expect } from "vitest";
import {
  APP_VERSION,
  CONFIG,
  ROLES,
  ENTITIES,
  MESSAGES,
  ERROR_MESSAGES,
} from "./config.js";

describe("core/engine/config", () => {
  it("should have a valid APP_VERSION format", () => {
    // This regex checks for a SemVer-like string followed by a name in parentheses.
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+ \([\w\s]+\)$/);
  });

  describe("CONFIG structure", () => {
    it("should have the correct ENTITIES", () => {
      expect(CONFIG.ENTITIES).toEqual({
        AI: "ai_character",
        USER: "user_persona",
        FRACTAL: "fractal",
      });
    });

    it("should have the correct ROLES", () => {
      expect(CONFIG.ROLES).toEqual({
        USER: "user",
        AI: "ai",
        FRACTAL: "fractal",
        SYSTEM: "system",
      });
    });

    it("should have the correct DYNAMICS", () => {
      expect(CONFIG.DYNAMICS).toEqual({
        RELEVANCE_DYNAMICS_BONUS: 1,
        RELEVANCE_TRIGGER_BONUS: 2,
        RELEVANCE_VECTOR_BONUS: 3,
        VISUAL_TEMP_DEFAULT: 0.45,
      });
    });

    it("should have the correct MESSAGES", () => {
      expect(CONFIG.MESSAGES.CONNECTION_LOST).toBe("Connection lost with AI server.");
      expect(CONFIG.MESSAGES.REFUSAL_TRIGGERS).toEqual([
        "i cannot",
        "i can't",
        "cannot generate",
        "policy",
        "guidelines",
        "sorry, but",
      ]);
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

    it("should export ERROR_MESSAGES as an alias for MESSAGES", () => {
      expect(ERROR_MESSAGES).toBe(CONFIG.MESSAGES);
    });
  });
});
