import { jest } from "@jest/globals";

// Mock dependencies to avoid side effects during import
jest.mock("../../../src/js/core/state.js", () => ({
  state: {},
  applyPatch: jest.fn(),
}));
jest.mock("../../../src/js/data/repo.js", () => ({ entities: {} }));
jest.mock("../../../src/js/engine/director.js", () => ({
  StoryController: {},
}));
jest.mock("../../../src/js/ui/image-gen-ui.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
}));
jest.mock("../../../src/js/core/utils.js", () => ({
  error: jest.fn(),
  log: jest.fn(),
}));

import { generateDynamicTitle } from "../../../src/js/ui/setup.js";

describe("Storyboard Title Logic", () => {
  const mockAi = { name: "Alice" };
  const mockUser = { name: "Bob" };
  const mockWorld = { name: "Mars" };

  let originalRandom;

  beforeAll(() => {
    originalRandom = Math.random;
    // Force Random to 0 to pick the first prefix: "The Story of"
    Math.random = () => 0;
  });

  afterAll(() => {
    Math.random = originalRandom;
  });

  test("generates correct title for 1 Character", () => {
    // Expect: "The Story of Alice"
    expect(generateDynamicTitle(mockAi, null, null)).toBe("The Story of Alice");
  });

  test("generates correct title for 2 Characters", () => {
    // Expect: "The Story of Alice & Bob"
    expect(generateDynamicTitle(mockAi, mockUser, null)).toBe(
      "The Story of Alice & Bob",
    );
  });

  test("generates correct title for 2 Characters + World", () => {
    // Expect: "The Story of Alice & Bob in Mars"
    expect(generateDynamicTitle(mockAi, mockUser, mockWorld)).toBe(
      "The Story of Alice & Bob in Mars",
    );
  });

  test("generates correct title for 1 Character + World", () => {
    // Expect: "The Story of Alice in Mars"
    expect(generateDynamicTitle(mockAi, null, mockWorld)).toBe(
      "The Story of Alice in Mars",
    );
  });

  test("generates fallback for no inputs", () => {
    // Logic returns "My New Story" if totalChars === 0 && !hasWorld
    expect(generateDynamicTitle(null, null, null)).toBe("My New Story");
  });
});
