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
  it("should have the correct APP_VERSION", () => {
    expect(APP_VERSION).toBe("0.2.0 (Coronation)");
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
        USER: expect.any(String),
        AI: expect.any(String),
        FRACTAL: expect.any(String),
        SYSTEM: expect.any(String),
      });
    });

    it("should have the correct DYNAMICS structure", () => {
      expect(CONFIG.DYNAMICS).toEqual({
        RELEVANCE_DYNAMICS_BONUS: expect.any(Number),
        RELEVANCE_TRIGGER_BONUS: expect.any(Number),
        RELEVANCE_VECTOR_BONUS: expect.any(Number),
        VISUAL_TEMP_DEFAULT: expect.any(Number),
      });
    });

    it("should have the correct MESSAGES structure", () => {
      expect(CONFIG.MESSAGES).toEqual({
        CONNECTION_LOST: expect.any(String),
        REFUSAL_TRIGGERS: expect.any(Array),
      });

      CONFIG.MESSAGES.REFUSAL_TRIGGERS.forEach((trigger) => {
        expect(typeof trigger).toBe("string");
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

    it("should export ERROR_MESSAGES as an alias for MESSAGES", () => {
      expect(ERROR_MESSAGES).toBe(CONFIG.MESSAGES);
    });
  });
});
