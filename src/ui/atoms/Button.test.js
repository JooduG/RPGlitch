import { mount, unmount } from "svelte";
import { afterEach, describe, expect, test } from "vitest";
import Button from "./Button.svelte";

describe("Button Atom", () => {
  /** @type {any} */
  let component;

  afterEach(() => {
    if (component) {
      unmount(component);
      component = undefined;
    }
    document.body.innerHTML = "";
  });

  test("renders label correctly", () => {
    component = mount(Button, { target: document.body, props: { label: "Click Me" } });
    expect(document.body.innerHTML).toContain("Click Me");
  });

  test("applies variant classes", () => {
    component = mount(Button, { target: document.body, props: { variant: "secondary" } });
    const button = /** @type {any} */ (document.querySelector("button"));
    expect(button.classList.contains("variant-secondary")).toBe(true);
  });

  test("handles busy state correctly", () => {
    component = mount(Button, { target: document.body, props: { busy: true } });
    const button = /** @type {any} */ (document.querySelector("button"));

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.classList.contains("is-busy")).toBe(true);
  });

  test("handles disabled state correctly", () => {
    component = mount(Button, { target: document.body, props: { disabled: true } });
    const button = /** @type {any} */ (document.querySelector("button"));

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");
  });

  test("busy state takes priority over rest.disabled=false", () => {
    component = mount(Button, { target: document.body, props: { busy: true, disabled: false } });
    const button = /** @type {any} */ (document.querySelector("button"));

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });

  test("defaults to type='button'", () => {
    component = mount(Button, { target: document.body, props: {} });
    const button = /** @type {any} */ (document.querySelector("button"));
    expect(button.getAttribute("type")).toBe("button");
  });

  test("allows overriding type via rest", () => {
    component = mount(Button, { target: document.body, props: { type: "submit" } });
    const button = /** @type {any} */ (document.querySelector("button"));
    expect(button.getAttribute("type")).toBe("submit");
  });
});
