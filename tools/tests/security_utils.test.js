/**
 * @jest-environment jsdom
 */

// Define mock BEFORE import
// Enhanced mock based on PR review feedback to catch event handlers
const mockSanitize = jest.fn((val) => {
  if (typeof val !== "string") return "";
  // A more robust mock to catch script tags and common event handlers.
  return val
    .replace(/<script.*?>.*?<\/script>/gi, "[[SANITIZED_SCRIPT]]")
    .replace(
      /\s(on\w+)=(?:\".*?\"|'.*?'|[^>\s]+)/gi,
      ' $1="[[SANITIZED_ATTR]]"',
    );
});

global.window.DOMPurify = {
  sanitize: mockSanitize,
};

import { createIconBtn } from "../../src/js/mesmer/ui/services/ui-utils.js";
import { sanitizeHtml } from "../../src/js/gamemaster/utils.js";

describe("Security: createIconBtn", () => {
  beforeEach(() => {
    mockSanitize.mockClear();
  });

  test("sanitizeHtml utility should use DOMPurify", () => {
    const input = "<script>alert(1)</script>";
    const output = sanitizeHtml(input);
    expect(mockSanitize).toHaveBeenCalledWith(input);
    expect(output).toBe("[[SANITIZED_SCRIPT]]");
  });

  test("createIconBtn should sanitize script tags in SVG", () => {
    // Attack vector: malicious SVG containing script
    const maliciousSvg =
      '<svg><script>alert(1)</script><path d="M0 0h10v10H0z"/></svg>';

    const btn = createIconBtn(maliciousSvg, "Test", () => {});

    expect(mockSanitize).toHaveBeenCalledWith(maliciousSvg);
    expect(btn.innerHTML).toContain("[[SANITIZED_SCRIPT]]");
    expect(btn.innerHTML).not.toContain("<script>");
  });

  test("createIconBtn should sanitize event handlers in SVG", () => {
    // Attack vector: SVG with onload handler
    const maliciousSvg =
      '<svg onload="alert(1)"><path d="M0 0h10v10H0z"/></svg>';

    const btn = createIconBtn(maliciousSvg, "Test", () => {});

    expect(mockSanitize).toHaveBeenCalledWith(maliciousSvg);
    expect(btn.innerHTML).toContain('onload="[[SANITIZED_ATTR]]"');
    expect(btn.innerHTML).not.toContain("alert(1)");
  });
});
