import { describe, expect, test, vi, beforeEach } from "vitest";
import { safe_html } from "@utils/safe-html.js";
import * as security from "@core/security.js";
vi.mock("@core/security.js", () => ({
  sanitizeToFragment: vi.fn((dirty) => ({ __isMockFragment: true, source: dirty || "" })),
}));
// We must use JSDOM environment in Vitest to use document.createElement
// This happens automatically based on the vitest.config.js usually.
describe("safe_html action", () => {
  let mockNode;
  beforeEach(() => {
    // Create a basic mocked DOM node that we can spy on
    mockNode = {
      textContent: "existing text",
      appendChild: vi.fn(),
      innerHTML: "should not use",
    };
  });
  test("clears textContent and uses appendChild instead of innerHTML", () => {
    safe_html(mockNode, "<b>Bold Content</b>");
    // Ensure innerHTML is NEVER reassigned (no direct assignment tracking, but we can check if it wasn't modified to the input)
    expect(mockNode.innerHTML).toBe("should not use");
    // Ensure old content is wiped safely using textContent
    expect(mockNode.textContent).toBe("");
    // Ensure appendChild is called with the fragment
    expect(mockNode.appendChild).toHaveBeenCalledTimes(1);
    expect(mockNode.appendChild).toHaveBeenCalledWith(
      expect.objectContaining({
        __isMockFragment: true,
        source: "<b>Bold Content</b>",
      }),
    );
    // Ensure security.sanitizeToFragment was called
    expect(security.sanitizeToFragment).toHaveBeenCalledWith("<b>Bold Content</b>");
  });
  test("update function works correctly on subsequent calls", () => {
    const action = safe_html(mockNode, "Content 1");
    // Reset our spies
    mockNode.appendChild.mockClear();
    vi.mocked(security.sanitizeToFragment).mockClear();
    // Call the update method returned by the action
    action.update("Content 2");
    expect(mockNode.textContent).toBe("");
    expect(mockNode.appendChild).toHaveBeenCalledTimes(1);
    expect(security.sanitizeToFragment).toHaveBeenCalledWith("Content 2");
  });
  test("handles null or undefined by converting to empty string", () => {
    safe_html(mockNode, null);
    expect(security.sanitizeToFragment).toHaveBeenCalledWith("");
  });
});
