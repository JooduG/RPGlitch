import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { pulse, update_card_scrub, clear_card_location, capture_storyboard_flight, fly_storyboard_cards_into_prologue } from "./motion.svelte.js";

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

  describe("storyboard & prologue card scrub and flight", () => {
    it("update_card_scrub and clear_card_location do not throw when passed options object or no arguments", () => {
      expect(() => update_card_scrub({ pending: true })).not.toThrow();
      expect(() => update_card_scrub({ pending: false })).not.toThrow();
      expect(() => update_card_scrub()).not.toThrow();
      expect(() => clear_card_location()).not.toThrow();
    });

    it("capture_storyboard_flight captures clones and rects from data-slot-type [data-card-root]", () => {
      const slot = document.createElement("div");
      slot.setAttribute("data-slot-type", "ai");
      const root = document.createElement("div");
      root.setAttribute("data-card-root", "");
      slot.appendChild(root);
      document.body.appendChild(slot);

      const assets = capture_storyboard_flight();
      expect(assets).not.toBeNull();
      expect(assets?.clones.ai).toBeInstanceOf(HTMLElement);
      expect(assets?.rects.ai).toBeDefined();

      slot.remove();
    });

    it("fly_storyboard_cards_into_prologue accepts (assets, dst_rects) without throwing", async () => {
      const assets = { clones: {}, rects: {} };
      const dst_rects = {};
      await expect(fly_storyboard_cards_into_prologue(assets, dst_rects)).resolves.toBeUndefined();
    });
  });
});
