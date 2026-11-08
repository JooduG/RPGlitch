import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { pulse } from "./motion.svelte.js";

describe("kinetic utilities", () => {
  /** @type {HTMLElement} */
  let node;

  beforeEach(() => {
    node = document.createElement("div");
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
      action.destroy?.();
    });

    it("cancels existing animation on trigger", () => {
      const action = pulse(node);
      node.dispatchEvent(new MouseEvent("mouseenter"));
      const first_anim = /** @type {any} */ (node.animate).mock.results[0].value;

      node.dispatchEvent(new MouseEvent("mouseenter"));
      expect(first_anim.cancel).toHaveBeenCalled();
      action.destroy?.();
    });

    it("starts return animation on stop and maintains dataset (managed by actions)", () => {
      const action = pulse(node);
      node.dispatchEvent(new MouseEvent("mouseenter"));

      node.dispatchEvent(new MouseEvent("mouseleave"));

      expect(node.animate).toHaveBeenCalledTimes(2);
      const return_anim = /** @type {any} */ (node.animate).mock.results[1].value;

      expect(node.dataset.kinetic).toBe("true");

      if (return_anim.onfinish) return_anim.onfinish();
      expect(node.dataset.kinetic).toBe("true");
      action.destroy?.();
    });

    it("handles trigger while return animation is running (race condition fix)", () => {
      const action = pulse(node);

      node.dispatchEvent(new MouseEvent("mouseenter"));
      node.dispatchEvent(new MouseEvent("mouseleave"));
      const return_anim1 = /** @type {any} */ (node.animate).mock.results[1].value;

      node.dispatchEvent(new MouseEvent("mouseenter"));

      expect(return_anim1.cancel).toHaveBeenCalled();
      expect(node.dataset.kinetic).toBe("true");

      action.destroy?.();
    });
  });
});
