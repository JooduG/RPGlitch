import { render, fireEvent } from "@testing-library/svelte";
import { expect, test, describe } from "vitest";
import TextField from "./TextField.svelte";

global.ResizeObserver = class ResizeObserver {
  /**
   *
   */
  observe() {}
  /**
   *
   */
  unobserve() {}
  /**
   *
   */
  disconnect() {}
};

describe("TextField", () => {
  test("renders placeholder when empty", () => {
    const { getByText } = render(TextField, { placeholder: "Enter something" });
    expect(getByText("Enter something")).toBeDefined();
  });

  test("renders value in readonly mode", () => {
    const { getByText } = render(TextField, { value: "Hello World", is_edit: false });
    expect(getByText("Hello World")).toBeDefined();
  });

  test("renders textarea in edit mode", () => {
    const { container } = render(TextField, { value: "Hello World", is_edit: true });
    const textarea = /** @type {any} */ (container.querySelector("textarea"));
    expect(textarea).toBeDefined();
    expect(textarea.value).toBe("Hello World");
  });

  test("expands header on focus when meta is present", async () => {
    // Note: Since snippets are harder to test with just props in some environments,
    // we'll check if the class is applied when is_focused is true.
    // In Svelte 5, snippets are passed as props.
    const { container } = render(TextField, {
      status: () => "Status",
      header_actions: () => "Actions",
    });

    const chassis = /** @type {any} */ (container.querySelector(".wrapper"));
    const input = /** @type {any} */ (container.querySelector(".body"));

    await fireEvent.focus(input);
    expect(chassis.classList.contains("is-expanded")).toBe(true);
  });

  test("applies atmospheric weight styles", () => {
    const { container } = render(TextField, { weight: 5 });
    const chassis = /** @type {any} */ (container.querySelector(".wrapper"));
    const style = chassis.getAttribute("style");

    expect(style).toContain("--weight-intensity: 0.5");
    expect(style).toContain("--header-opacity: 0.6");
  });

  test("drills ...rest props to the internal body element", () => {
    // Edit mode
    const { container: containerEdit } = render(TextField, {
      is_edit: true,
      name: "test-field",
      required: true,
      "data-testid": "inner-element",
    });
    const wrapperEdit = /** @type {any} */ (containerEdit.querySelector(".wrapper"));
    const textarea = /** @type {any} */ (containerEdit.querySelector("textarea"));

    expect(wrapperEdit.getAttribute("name")).toBeNull();
    expect(textarea.getAttribute("name")).toBe("test-field");
    expect(textarea.hasAttribute("required")).toBe(true);

    // Readonly mode
    const { container: containerReadonly } = render(TextField, {
      is_edit: false,
      name: "test-field-readonly",
      "data-testid": "inner-element-readonly",
    });
    const wrapperReadonly = /** @type {any} */ (containerReadonly.querySelector(".wrapper"));
    const bodyReadonly = /** @type {any} */ (containerReadonly.querySelector(".body.is-readonly"));

    expect(wrapperReadonly.getAttribute("name")).toBeNull();
    expect(bodyReadonly.getAttribute("name")).toBe("test-field-readonly");
  });
});
