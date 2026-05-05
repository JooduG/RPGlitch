import { render, fireEvent } from "@testing-library/svelte";
import { expect, test, describe } from "vitest";
import TextField from "./TextField.svelte";

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
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
    const textarea = container.querySelector("textarea");
    expect(textarea).toBeDefined();
    expect(textarea.value).toBe("Hello World");
  });

  test("expands header on focus when meta is present", async () => {
    // Note: Since snippets are harder to test with just props in some environments,
    // we'll check if the class is applied when is_focused is true.
    // In Svelte 5, snippets are passed as props.
    const { container } = render(TextField, { 
      status: () => "Status", 
      actions: () => "Actions" 
    });
    
    const chassis = container.querySelector(".textfield");
    const input = container.querySelector(".body");
    
    await fireEvent.focus(input);
    expect(chassis.classList.contains("is-expanded")).toBe(true);
  });

  test("applies atmospheric weight styles", () => {
    const { container } = render(TextField, { weight: 5 });
    const chassis = container.querySelector(".textfield");
    const style = chassis.getAttribute("style");
    
    expect(style).toContain("--weight-intensity: 0.5");
    expect(style).toContain("--header-opacity: 0.6"); 
  });
});
