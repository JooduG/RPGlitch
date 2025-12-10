#!/usr/bin/env node

/**
 * Glob Pattern Testing for Cursor Rules
 * Tests which rules should apply to which files based on glob patterns
 */

import { testGlobMatching, matchesGlob } from "./glob-patterns.util.js";

// Jest tests
describe("Glob Pattern Matching", () => {
  test("JavaScript files match JS rules", () => {
    expect(matchesGlob("test.js", "**/*.js")).toBe(true);
    expect(matchesGlob("test.js", "**/*.scss")).toBe(false);
  });

  test("SCSS files match SCSS rules", () => {
    expect(matchesGlob("test.scss", "**/*.scss")).toBe(true);
    expect(matchesGlob("test.scss", "**/*.js")).toBe(false);
  });

  test("Markdown files match markdown rules", () => {
    expect(matchesGlob("test.md", "**/*.md")).toBe(true);
    expect(matchesGlob("test.md", "**/*.js")).toBe(false);
  });

  test("HTML files match HTML rules", () => {
    expect(matchesGlob("test.html", "**/*.html")).toBe(true);
    expect(matchesGlob("test.html", "**/*.scss")).toBe(false);
  });
});

// Run tests if called directly
if (require.main === module) {
  testGlobMatching();
}
