import { safe_html } from "./actions.js";
import * as html_utils from "./html.js";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("./html.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { .../** @type {any} */ (actual), sanitize_to_fragment: vi.fn((dirty) => ({ __isMockFragment: true, source: dirty || "" })) };
});

describe("safe_html action", () => {
  /** @type {any} */
  let mockNode;
  beforeEach(() => {
    mockNode = { textContent: "existing text", appendChild: vi.fn(), innerHTML: "should not use" };
  });

  test("clears textContent and uses appendChild instead of innerHTML", () => {
    safe_html(mockNode, "<b>Bold Content</b>");
    expect(mockNode.innerHTML).toBe("should not use");
    expect(mockNode.textContent).toBe("");
    expect(mockNode.appendChild).toHaveBeenCalledTimes(1);
    expect(mockNode.appendChild).toHaveBeenCalledWith(expect.objectContaining({ __isMockFragment: true, source: "<b>Bold Content</b>" }));
    expect(html_utils.sanitize_to_fragment).toHaveBeenCalledWith("<b>Bold Content</b>");
  });

  test("update function works correctly on subsequent calls", () => {
    const action = safe_html(mockNode, "Content 1");
    mockNode.appendChild.mockClear();
    vi.mocked(html_utils.sanitize_to_fragment).mockClear();
    action.update("Content 2");
    expect(mockNode.textContent).toBe("");
    expect(mockNode.appendChild).toHaveBeenCalledTimes(1);
    expect(html_utils.sanitize_to_fragment).toHaveBeenCalledWith("Content 2");
  });

  test("handles null or undefined by converting to empty string", () => {
    safe_html(mockNode, null);
    expect(html_utils.sanitize_to_fragment).toHaveBeenCalledWith("");
  });
});
