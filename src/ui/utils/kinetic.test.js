import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { pulse } from "./kinetic.js";

describe("kinetic utilities", () => {
  /** @type {HTMLElement} */
  let node;

  beforeEach(() => {
    node = document.createElement("div");
    // Mock animate
    node.animate = vi.fn().mockReturnValue({
      cancel: vi.fn(),
      play: vi.fn(),
      onfinish: null,
    });
    document.body.appendChild(node);
  });

  afterEach(() => {
    node.remove();
    vi.restoreAllMocks();
  });

  describe("pulse", () => {
    it("sets dataset.kinetic on trigger", () => {
      const action = pulse(node);
      node.dispatchEvent(new MouseEvent("mouseenter"));
      expect(node.dataset.kinetic).toBe("true");
      expect(node.animate).toHaveBeenCalled();
      action.destroy();
    });

    it("cancels existing animation on trigger", () => {
      const action = pulse(node);
      node.dispatchEvent(new MouseEvent("mouseenter"));
      const firstAnim = /** @type {any} */ (node.animate).mock.results[0].value;

      node.dispatchEvent(new MouseEvent("mouseenter"));
      expect(firstAnim.cancel).toHaveBeenCalled();
      action.destroy();
    });

    it("starts return animation on stop and clears dataset on finish", () => {
      const action = pulse(node);
      node.dispatchEvent(new MouseEvent("mouseenter"));

      // Stop
      node.dispatchEvent(new MouseEvent("mouseleave"));

      // Should have called animate twice (one for pulse, one for return)
      expect(node.animate).toHaveBeenCalledTimes(2);
      const returnAnim = /** @type {any} */ (node.animate).mock.results[1].value;

      // Dataset should still be true while return anim is running
      expect(node.dataset.kinetic).toBe("true");

      // Trigger finish
      returnAnim.onfinish();
      expect(node.dataset.kinetic).toBeUndefined();
      action.destroy();
    });

    it("handles trigger while return animation is running (race condition fix)", () => {
      const action = pulse(node);

      // 1. Trigger pulse
      node.dispatchEvent(new MouseEvent("mouseenter"));

      // 2. Stop (starts return_anim)
      node.dispatchEvent(new MouseEvent("mouseleave"));
      const returnAnim1 = /** @type {any} */ (node.animate).mock.results[1].value;

      // 3. Trigger pulse again before return_anim finishes
      node.dispatchEvent(new MouseEvent("mouseenter"));

      // return_anim1 should have been cancelled
      expect(returnAnim1.cancel).toHaveBeenCalled();
      expect(node.dataset.kinetic).toBe("true");

      // 4. Simulate returnAnim1.onfinish (which might still fire if not cancelled correctly,
      // but our code should have cleared the reference or the listener shouldn't fire if cancelled)
      // Even if it fires, it should have been the reference from the previous call.

      action.destroy();
    });
  });
});
