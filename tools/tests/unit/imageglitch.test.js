import {
  extractAiResponse,
  validatePrompt,
  validateSeed,
  getScribeInstruction,
  getChaosInstruction,
} from "../../../apps/imageglitch/js/index.js";

// Mock global browser APIs used in the script
global.alert = jest.fn();
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};

describe("ImageGlitch Logic Baseline", () => {
  describe("extractAiResponse", () => {
    test("extracts text from simple string", () => {
      expect(extractAiResponse("A beautiful sunset")).toBe(
        "A beautiful sunset",
      );
    });

    test("extracts text from object with generatedText", () => {
      expect(extractAiResponse({ generatedText: "A cat" })).toBe("A cat");
    });

    test('extracts text from "Prompt:" labeled string', () => {
      expect(extractAiResponse("Prompt: A high-tech city")).toBe(
        "A high-tech city",
      );
    });
  });

  describe("validatePrompt", () => {
    test("returns trimmed valid prompt", () => {
      expect(validatePrompt("  valid prompt  ")).toBe("valid prompt");
    });

    test("returns null and alerts on empty prompt", () => {
      const result = validatePrompt("   ");
      expect(result).toBeNull();
      expect(global.alert).toHaveBeenCalledWith("Prompt cannot be empty");
    });
  });

  describe("validateSeed", () => {
    test("returns empty string for empty input", () => {
      expect(validateSeed("")).toBe("");
      expect(validateSeed(null)).toBe("");
    });

    test("returns number for valid seed string", () => {
      expect(validateSeed("123")).toBe(123);
    });

    test("returns empty string and alerts on invalid seed", () => {
      expect(validateSeed("abc")).toBe("");
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining("Seed must be a non-negative number"),
      );
    });
  });

  describe("Instructions", () => {
    test("getScribeInstruction returns dense paragraph instruction", () => {
      const instruction = getScribeInstruction("A robot");
      expect(instruction).toContain('USER PROMPT: "A robot"');
      expect(instruction).toContain("Visual Director");
    });

    test("getChaosInstruction returns mutation instruction", () => {
      const instruction = getChaosInstruction("A forest");
      expect(instruction).toContain('USER PROMPT: "A forest"');
      expect(instruction).toContain("Entropy Injector");
    });
  });
});
