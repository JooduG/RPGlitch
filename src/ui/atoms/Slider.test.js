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
    const input = container.querySelector("input");
    const wrapper = container.querySelector(".wrapper");

    expect(input.disabled).toBe(true);
    expect(wrapper.classList.contains("is-busy")).toBe(true);
    expect(getByText("INTENSITY: BUSY...")).toBeDefined();
  });

  test("handles disabled state correctly", () => {
    const { container, getByText } = render(Slider, { label: "Intensity", disabled: true });
    const input = container.querySelector("input");

    expect(input.disabled).toBe(true);
    expect(getByText("INTENSITY: DISABLED")).toBeDefined();
  });
});
