import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/svelte";
import Message from "./Message.svelte";

// Mock app & runtime state
vi.mock("@state/app.svelte.js", () => ({
  app: {
    settings: { dev_mode: false },
    selected_ai: { name: "Test AI" },
    selected_user: { name: "Test User" },
    selected_fractal: { name: "Test Fractal" },
  },
}));

vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    active_user: { name: "Test User" },
    active_ai: { name: "Test AI" },
    active_fractal: { name: "Test Fractal" },
  },
}));

// Mock palette state to return specific deterministic colors
vi.mock("@theme/palette.svelte.js", () => {
  return {
    themeStore: {
      get_signature_color: vi.fn((entity) => {
        if (entity && entity.signature_color) return entity.signature_color;
        return "var(--color-slate)";
      }),
      get_deterministic_color: vi.fn((name) => {
        if (name === "user") return "var(--color-user)";
        if (name === "ai") return "var(--color-ai)";
        if (name === "fractal") return "var(--color-fractal)";
        return "var(--color-default)";
      }),
    },
  };
});

describe("Message.svelte", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a user message with appropriate classes", () => {
    const { container } = render(Message, {
      text: "Hello, world!",
      sender: "user",
    });

    const row = container.querySelector(".message-row");
    expect(row).not.toBeNull();
    expect(row?.classList.contains("user-row")).toBe(true);

    const bubble = container.querySelector(".message-bubble");
    expect(bubble).not.toBeNull();
    expect(bubble?.classList.contains("user-bubble")).toBe(true);
  });

  it("renders an ai message with appropriate classes", () => {
    const { container } = render(Message, {
      text: "I am an AI.",
      sender: "ai",
    });

    const row = container.querySelector(".message-row");
    expect(row).not.toBeNull();
    expect(row?.classList.contains("ai-row")).toBe(true);

    const bubble = container.querySelector(".message-bubble");
    expect(bubble).not.toBeNull();
    expect(bubble?.classList.contains("ai-bubble")).toBe(true);
  });

  it("renders a fractal message with appropriate classes", () => {
    const { container } = render(Message, {
      text: "System event occurred.",
      sender: "fractal",
    });

    const row = container.querySelector(".message-row");
    expect(row).not.toBeNull();
    expect(row?.classList.contains("fractal-row")).toBe(true);

    const bubble = container.querySelector(".message-bubble");
    expect(bubble).not.toBeNull();
    expect(bubble?.classList.contains("fractal-bubble")).toBe(true);
  });
});
