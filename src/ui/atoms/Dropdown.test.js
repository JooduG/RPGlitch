import { render } from "@testing-library/svelte";
import { expect, test, describe } from "vitest";
import Dropdown from "./Dropdown.svelte";

describe("Dropdown Atom", () => {
  const items = [
    { value: "voice-1", label: "Voice 1", region: "US" },
    { value: "voice-2", label: "Voice 2", region: "UK" },
  ];

  test("renders trigger text and label correctly", () => {
    const { getByText, container } = render(Dropdown, { items, label: "Select Option" });
    expect(getByText("Select Option")).toBeDefined();

    const trigger = /** @type {any} */ (container.querySelector(".dropdown-trigger"));
    expect(trigger).toBeDefined();
    expect(trigger.getAttribute("aria-label")).toBe("Select Option");
  });

  test("renders selected label when value is bound", () => {
    const { getByText } = render(Dropdown, { items, value: "voice-1", label: "Select Option" });
    expect(getByText("Voice 1")).toBeDefined();
  });

  test("handles disabled state correctly", () => {
    const { container } = render(Dropdown, { items, disabled: true });
    const trigger = /** @type {any} */ (container.querySelector(".dropdown-trigger"));
    expect(trigger.disabled).toBe(true);
  });
});
