import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StoryCard from "./StoryCard.svelte";

describe("StoryCard Component", () => {
  // Cast to any to satisfy svelte-check types
  const mockStory = /** @type {any} */ ({
    id: "story-123",
    title: "The Journey of Lord Valerius",
    lastPlayed: 1779435300000, // May 2026
    signature_color: "var(--deep-indigo)",
    fractal_profile_picture: null,
    state: {},
    fractal_name: "Station Tartarus",
  });

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders story title and formatted date", () => {
    render(StoryCard, { story: mockStory });
    expect(screen.getByText("The Journey of Lord Valerius")).toBeDefined();
    expect(screen.getByText(/2026/)).toBeDefined();
  });

  it("displays ACTIVE status when active prop is true", () => {
    render(StoryCard, { story: mockStory, active: true });
    expect(screen.getByText(/ACTIVE/i)).toBeDefined();
  });

  it("does not display ACTIVE status when active prop is false", () => {
    render(StoryCard, { story: mockStory, active: false });
    const metaText = screen.getByText(/2026/);
    expect(metaText.textContent).not.toContain("ACTIVE");
  });

  it("triggers onclick handler when clicked", async () => {
    const onclickSpy = vi.fn();
    const { container } = render(StoryCard, { story: mockStory, onclick: onclickSpy });

    const button = container.querySelector("button");
    expect(button).not.toBeNull();

    if (button) {
      await fireEvent.click(button);
      expect(onclickSpy).toHaveBeenCalledTimes(1);
    }
  });

  it("applies the active class when active is true", () => {
    const { container } = render(StoryCard, { story: mockStory, active: true });
    const cardRoot = container.querySelector(".root");
    expect(cardRoot).not.toBeNull();
    if (cardRoot) {
      expect(cardRoot.classList.contains("is-active")).toBe(true);
    }
  });
});
