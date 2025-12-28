/**
 * @jest-environment jsdom
 */

// Define mock BEFORE import
const mockSanitize = jest.fn((val) => {
  if (typeof val !== 'string') return '';
  return val.replace(/<script.*?>.*?<\/script>/gi, "[[SANITIZED]]");
});

global.window.DOMPurify = {
  sanitize: mockSanitize
};

import { createIconBtn } from "../../apps/rpglitch/js/ui/services/ui-utils.js";
import { sanitizeHtml } from "../../apps/rpglitch/js/core/utils.js";

describe("Security: createIconBtn", () => {
  test("sanitizeHtml utility should use DOMPurify", () => {
    const input = '<script>alert(1)</script>';
    const output = sanitizeHtml(input);
    expect(mockSanitize).toHaveBeenCalledWith(input);
    expect(output).toBe('[[SANITIZED]]');
  });

  test("createIconBtn should sanitize innerHTML content", () => {
    // Attack vector: malicious SVG containing script
    const maliciousSvg = '<svg><script>alert(1)</script><path d="M0 0h10v10H0z"/></svg>';

    // Reset mock counts
    mockSanitize.mockClear();

    const btn = createIconBtn(maliciousSvg, "Test", () => {});

    expect(mockSanitize).toHaveBeenCalledWith(maliciousSvg);
    expect(btn.innerHTML).toContain("[[SANITIZED]]");
    expect(btn.innerHTML).not.toContain("<script>");
  });
});
