import { fireEvent, render, screen } from "@testing-library/svelte";
import { expect, test, describe, vi } from "vitest";
import EntityCard from "./EntityCard.svelte";

// Mock the dependencies
vi.mock("@media/palette.svelte.js", () => ({
  themeStore: {
    get_signature_color: vi.fn((entity) => entity?.signature_color || "mock-signature"),
  },
}));

describe("EntityCard Atom", () => {
  const mockEntity = {
    id: "char-123",
    type: "character",
    name: "Arthur Pendragon",
    description: "The Once and Future King.",
    signature_color: "cyan",
  };

  test("renders variant='library' correctly", () => {
    const { container } = render(EntityCard, {
      props: {
        variant: "library",
        entity: mockEntity,
        type: "ai",
      },
    });

    const card = /** @type {any} */ (container.querySelector(".card"));
    expect(card).toBeTruthy();
    expect(card.classList.contains("glass-elevated")).toBe(true);
    expect(screen.getByText("Arthur Pendragon")).toBeTruthy();
    expect(card.style.viewTransitionName).toBe("card-character-char-123");
  });

  test("renders variant='slot' (empty placeholder) correctly", () => {
    const { container } = render(EntityCard, {
      props: {
        variant: "slot",
        role_label: "Narrator Role",
        type: "ai",
      },
    });

    const root = /** @type {any} */ (container.querySelector(".root"));
    expect(root).toBeTruthy();
    expect(root.classList.contains("is-empty")).toBe(true);
    expect(screen.getByText("Narrator Role")).toBeTruthy();
    expect(root.style.viewTransitionName).toBe("");
  });

  test("renders variant='panel' (filled storyboard card) correctly", () => {
    const { container } = render(EntityCard, {
      props: {
        variant: "panel",
        entity: mockEntity,
        type: "ai",
      },
    });

    const root = /** @type {any} */ (container.querySelector(".root"));
    expect(root).toBeTruthy();
    expect(root.classList.contains("interactable")).toBe(true);
    expect(screen.getByText("Arthur Pendragon")).toBeTruthy();
    expect(screen.getByText("The Once and Future King.")).toBeTruthy();
    expect(root.style.viewTransitionName).toBe("card-character-char-123");
  });

  test("handles interactions correctly in 'library' variant", async () => {
    const onclick = vi.fn();
    const onViewProfile = vi.fn();

    const { container } = render(EntityCard, {
      props: {
        variant: "library",
        entity: mockEntity,
        onclick,
        onViewProfile,
      },
    });

    const card = /** @type {any} */ (container.querySelector(".card"));
    await fireEvent.click(card);
    expect(onclick).toHaveBeenCalled();

    await fireEvent.contextMenu(card);
    expect(onViewProfile).toHaveBeenCalled();
  });

  test("handles interactions correctly in 'panel' variant", async () => {
    const on_select = vi.fn();
    const on_view_profile = vi.fn();

    render(EntityCard, {
      props: {
        variant: "panel",
        entity: mockEntity,
        on_select,
        on_view_profile,
      },
    });

    const actionButton = screen.getByLabelText("View Arthur Pendragon Profile");
    await fireEvent.click(actionButton);
    expect(on_view_profile).toHaveBeenCalled();
  });
});
