import { render } from "@testing-library/svelte";
import { expect, test, describe } from "vitest";
import Button from "./Button.svelte";

describe("Button Atom", () => {
  test("renders label correctly", () => {
    const { getByText } = render(Button, { label: "Click Me" });
    expect(getByText("Click Me")).toBeDefined();
  });

  test("applies variant classes", () => {
    const { container } = render(Button, { variant: "secondary" });
    const button = container.querySelector("button");
    expect(button.classList.contains("variant-secondary")).toBe(true);
  });

  test("handles busy state correctly", () => {
    const { container } = render(Button, { busy: true });
    const button = container.querySelector("button");

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.classList.contains("is-busy")).toBe(true);
  });

  test("handles disabled state correctly", () => {
    const { container } = render(Button, { disabled: true });
    const button = container.querySelector("button");

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");
  });

  test("busy state takes priority over rest.disabled=false", () => {
    // Testing the fix where {...rest} is at the top
    const { container } = render(Button, { busy: true, disabled: false });
    const button = container.querySelector("button");

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });

  test("defaults to type='button'", () => {
    const { container } = render(Button, {});
    const button = container.querySelector("button");
    expect(button.getAttribute("type")).toBe("button");
  });

  test("allows overriding type via rest", () => {
    const { container } = render(Button, { type: "submit" });
    const button = container.querySelector("button");
    expect(button.getAttribute("type")).toBe("submit");
  });
});
