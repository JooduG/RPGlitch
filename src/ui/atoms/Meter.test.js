import { render } from "@testing-library/svelte";
import { expect, test, describe } from "vitest";
import Meter from "./Meter.svelte";

describe("Meter Atom (Headless Meter)", () => {
  test("renders correctly with default value props", () => {
    const { container } = render(Meter, {
      value: 60,
      min: 0,
      max: 100,
    });

    const root = container.querySelector(".svelte-meter");
    expect(root).toBeDefined();
    expect(root?.getAttribute("aria-valuenow")).toBe("60");
    expect(root?.getAttribute("aria-valuemin")).toBe("0");
    expect(root?.getAttribute("aria-valuemax")).toBe("100");

    const indicator = container.querySelector(".indicator");
    expect(/** @type {HTMLElement} */ (indicator)?.style.width).toBe("60%");
  });

  test("handles min/max scaling calculations", () => {
    const { container } = render(Meter, {
      value: 15,
      min: 10,
      max: 20,
    });

    const indicator = container.querySelector(".indicator");
    expect(/** @type {HTMLElement} */ (indicator)?.style.width).toBe("50%");
  });
});
