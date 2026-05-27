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
    const control = /** @type {any} */ (container.querySelector('[role="switch"]'));
    const wrapper = /** @type {any} */ (container.querySelector(".root"));

    expect(control.disabled).toBe(true);
    expect(wrapper.classList.contains("is-busy")).toBe(true);
    expect(wrapper.getAttribute("aria-busy")).toBe("true");
  });

  test("handles disabled state correctly", () => {
    const { container } = render(Toggle, { disabled: true });
    const control = /** @type {any} */ (container.querySelector('[role="switch"]'));

    expect(control.disabled).toBe(true);
  });

  test("applies style prop to the wrapper label", () => {
    const { container } = render(Toggle, {
      style: "margin-top: 20px; color: red;",
    });
    const wrapper = /** @type {any} */ (container.querySelector(".root"));
    const control = /** @type {any} */ (container.querySelector('[role="switch"]'));

    expect(wrapper.getAttribute("style")).toContain("margin-top: 20px");
    expect(wrapper.getAttribute("style")).toContain("color: red");
    expect(control.getAttribute("style")).toBeNull();
  });
});
