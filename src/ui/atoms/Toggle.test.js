import { render } from "@testing-library/svelte";
import { expect, test, describe } from "vitest";
import Toggle from "./Toggle.svelte";

describe("Toggle Atom", () => {
  test("renders label correctly", () => {
    const { getByText } = render(Toggle, { label: "Enable" });
    expect(getByText("Enable")).toBeDefined();
  });

  test("handles busy state correctly", () => {
    const { container } = render(Toggle, { busy: true });
    const input = container.querySelector("input");
    const wrapper = container.querySelector(".wrapper");

    expect(input.disabled).toBe(true);
    expect(wrapper.classList.contains("is-busy")).toBe(true);
    expect(wrapper.getAttribute("aria-busy")).toBe("true");
  });

  test("handles disabled state correctly", () => {
    const { container } = render(Toggle, { disabled: true });
    const input = container.querySelector("input");

    expect(input.disabled).toBe(true);
  });
});
