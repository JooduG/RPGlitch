import { fireEvent, render, screen } from "@testing-library/svelte";
import { expect, test, describe, vi } from "vitest";
import { tick } from "svelte";
import EntityCard from "./EntityCard.svelte";
import { app } from "@state";

// Mock the dependencies
vi.mock("@media/palette.svelte.js", () => ({
  themeStore: {
    get_signature_color: vi.fn((entity) => entity?.signature_color || "mock-signature"),
  },
}));

vi.mock("@motion", () => ({
  motion: {
    isReduced: false,
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

    const card = /** @type {any} */ (container.querySelector(".entity-card-root"));
    expect(card).toBeTruthy();
    expect(card.classList.contains("glass-elevated")).toBe(true);
    expect(screen.getAllByText("Arthur Pendragon").length).toBeGreaterThan(0);
    expect(card.style.viewTransitionName).toBe("");
  });

  test("renders variant='slot' (empty placeholder) correctly", () => {
    const { container } = render(EntityCard, {
      props: {
        variant: "slot",
        role_label: "Narrator Role",
        type: "ai",
      },
    });

    const root = /** @type {any} */ (container.querySelector(".entity-card-root"));
    expect(root).toBeTruthy();
    expect(root.classList.contains("is-empty")).toBe(true);
    expect(screen.getByText("Narrator Role")).toBeTruthy();
    expect(root.style.viewTransitionName).toBe("card-slot-ai");
  });

  test("renders variant='panel' (filled storyboard card) correctly", () => {
    const { container } = render(EntityCard, {
      props: {
        variant: "panel",
        entity: mockEntity,
        type: "ai",
      },
    });

    const root = /** @type {any} */ (container.querySelector(".entity-card-root"));
    expect(root).toBeTruthy();
    expect(root.classList.contains("interactable")).toBe(true);
    expect(screen.getAllByText("Arthur Pendragon").length).toBeGreaterThan(0);
    expect(screen.getByText("The Once and Future King.")).toBeTruthy();
    expect(root.style.viewTransitionName).toBe("card-slot-ai");
  });

  test("suppresses view-transition-name on variant='panel' when drawer is open for its type", async () => {
    // Open drawer for type 'ai'
    app.drawer.open = true;
    app.drawer.type = "ai";

    const { container } = render(EntityCard, {
      props: {
        variant: "panel",
        entity: mockEntity,
        type: "ai",
      },
    });

    const root = /** @type {any} */ (container.querySelector(".entity-card-root"));
    expect(root).toBeTruthy();
    expect(root.style.viewTransitionName).toBe("");

    // If drawer is open for another type, it should NOT suppress
    app.drawer.type = "user";
    await tick();
    const { container: container2 } = render(EntityCard, {
      props: {
        variant: "panel",
        entity: mockEntity,
        type: "ai",
      },
    });
    const root2 = /** @type {any} */ (container2.querySelector(".entity-card-root"));
    expect(root2.style.viewTransitionName).toBe("card-slot-ai");

    // Clean up
    app.drawer.open = false;
    app.drawer.type = null;
  });

  test("handles interactions correctly in 'library' variant", async () => {
    vi.useFakeTimers();
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

    const card = /** @type {any} */ (container.querySelector(".entity-card-root"));
    await fireEvent.click(card);
    await tick();
    expect(card.style.viewTransitionName).toBe("card-slot-ai");
    vi.advanceTimersByTime(300);
    expect(onclick).toHaveBeenCalled();

    await fireEvent.contextMenu(card);
    expect(onViewProfile).toHaveBeenCalled();
    vi.useRealTimers();
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
