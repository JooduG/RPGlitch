// Polyfill ResizeObserver for JSDOM
if (typeof window !== "undefined" && typeof window.ResizeObserver !== "function") {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}

import { render } from "@testing-library/svelte";
import { expect, test, describe } from "vitest";
import Slider from "./Slider.svelte";

describe("Slider Atom", () => {
  test("renders label and value correctly", () => {
    const { getByText } = render(Slider, { label: "Intensity", value: 1.5 });
    expect(getByText("INTENSITY: 1.5")).toBeDefined();
  });

  test("handles busy state correctly", () => {
    const { container, getByText } = render(Slider, { label: "Intensity", busy: true });
    const control = /** @type {any} */ (container.querySelector('[role="slider"]'));
    const wrapper = /** @type {any} */ (container.querySelector(".root"));

    expect(control.getAttribute("aria-disabled")).toBe("true");
    expect(wrapper.classList.contains("is-busy")).toBe(true);
    expect(getByText("INTENSITY: BUSY...")).toBeDefined();
  });

  test("handles disabled state correctly", () => {
    const { container, getByText } = render(Slider, { label: "Intensity", disabled: true });
    const control = /** @type {any} */ (container.querySelector('[role="slider"]'));

    expect(control.getAttribute("aria-disabled")).toBe("true");
    expect(getByText("INTENSITY: DISABLED")).toBeDefined();
  });

  test("applies style prop to the wrapper label", () => {
    const { container } = render(Slider, {
      style: "margin-top: 20px; color: red;",
    });
    const wrapper = /** @type {any} */ (container.querySelector(".root"));
    const control = /** @type {any} */ (container.querySelector('[role="slider"]'));
    const style = wrapper.getAttribute("style");

    expect(style).toContain("margin-top: 20px");
    expect(style).toContain("color: red");
    expect(style).toContain("--state-fill-start");

    expect(control.getAttribute("style")).not.toContain("margin-top: 20px");
  });

  test("calculates dynamic fill tokens correctly", () => {
    // min: 0, max: 2, value: 1.5 -> val_pct: 75%
    // neutral: null -> center_val: (0+2)/2 = 1.0 -> center_pct: 50%
    // fill_start: min(75, 50) = 50%
    // fill_end: max(75, 50) = 75%
    const { container } = render(Slider, { min: 0, max: 2, value: 1.5 });
    const wrapper = /** @type {any} */ (container.querySelector(".root"));
    const style = wrapper.getAttribute("style");

    expect(style).toContain("--state-fill-start: 50%");
    expect(style).toContain("--state-fill-end: 75%");
  });

  test("respects neutral point for fill tokens", () => {
    // min: 0, max: 100, value: 20, neutral: 50
    // center_pct: 50%
    // val_pct: 20%
    // fill_start: 20%, fill_end: 50%
    const { container } = render(Slider, { min: 0, max: 100, value: 20, neutral: 50 });
    const wrapper = /** @type {any} */ (container.querySelector(".root"));
    const style = wrapper.getAttribute("style");

    expect(style).toContain("--state-fill-start: 20%");
    expect(style).toContain("--state-fill-end: 50%");
  });
});
