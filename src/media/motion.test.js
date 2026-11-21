import { flushSync } from "svelte";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  motion,
  pulse,
  roll,
  fly_card_in,
  fly_card_out,
  update_card_scrub,
  clear_card_location,
  capture_storyboard_flight,
  fly_storyboard_cards_into_prologue,
} from "./motion.svelte.js";

describe("kinetic utilities", () => {
  /** @type {HTMLElement} */
  let node;

  beforeEach(() => {
    motion.is_reduced = false;
    motion.intensity = 1.0;
    node = document.createElement("div");
    node.animate = vi.fn().mockReturnValue({ cancel: vi.fn(), play: vi.fn(), onfinish: null });
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

  describe("roll", () => {
    it("sets dataset.kinetic when motion is enabled", () => {
      const action = roll(node);
      node.dispatchEvent(new MouseEvent("mouseenter"));
      expect(node.dataset.kinetic).toBe("true");
      action.destroy?.();
    });

    it("suppresses rotation and keeps rotate(0deg) when motion.is_reduced is true", () => {
      motion.is_reduced = true;
      const action = roll(node);
      flushSync();

      node.dispatchEvent(new MouseEvent("mouseenter"));
      flushSync();

      expect(node.dataset.kinetic).toBeUndefined();
      expect(node.style.transform).toBe("rotate(0deg)");

      action.destroy?.();
    });

    it("resets transform to rotate(0deg) if motion.is_reduced flips true mid-lifecycle", () => {
      const action = roll(node);
      node.dispatchEvent(new MouseEvent("mouseenter"));
      expect(node.dataset.kinetic).toBe("true");

      motion.is_reduced = true;
      flushSync();
      expect(node.style.transform).toBe("rotate(0deg)");

      action.destroy?.();
    });
  });

  describe("storyboard & prologue card scrub and flight", () => {
    it("update_card_scrub and clear_card_location do not throw", () => {
      expect(() => update_card_scrub()).not.toThrow();
      expect(() => clear_card_location()).not.toThrow();
    });

    it("fly_card_in and fly_card_out respect motion.is_reduced without spawning clones", async () => {
      motion.is_reduced = true;
      const on_land = vi.fn();
      const rect = { left: 0, top: 0, width: 100, height: 140 };
      await fly_card_in(node, rect, rect, { on_land });
      expect(on_land).toHaveBeenCalledTimes(1);
      expect(document.querySelector("[data-flight-clone]")).toBeNull();

      fly_card_out(node, rect);
      expect(document.querySelector("[data-flight-out]")).toBeNull();
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
