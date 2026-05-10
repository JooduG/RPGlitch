import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Message from "./Message.svelte";

// Mock app state
vi.mock("@state/app.svelte.js", () => ({
  app: {
    settings: { dev_mode: false },
    selected_user: { name: "TestUser", signature_color: "#ff0000" },
    selected_ai: { name: "TestAI", signature_color: "#0000ff" },
    selected_fractal: { name: "TestFractal", signature_color: "#00ff00" },
  },
}));

// Mock runtime state
vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    active_user: null,
    active_ai: null,
    active_fractal: null,
  },
}));

// Mock themeStore
vi.mock("@theme/palette.svelte.js", () => ({
  themeStore: {
    get_signature_color: vi.fn((entity) => entity?.signature_color),
    get_deterministic_color: vi.fn((name) => "#999999"),
  },
}));

// Mock typing indicator
vi.mock("@atoms/TypingIndicator.svelte", () => ({
  default: function () {
    return {
      $$render: () => `<div data-testid="typing-indicator"></div>`,
    };
  },
}));

describe("Message.svelte", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user message correctly", () => {
    render(Message, { text: "Hello AI", sender: "user", character_name: "TestUser" });
    const row = screen.getByRole("article").parentElement;
    expect(row?.classList.contains("user-row")).toBe(true);
    expect(screen.getByText("TestUser")).toBeDefined();
    expect(screen.getByText("Hello AI")).toBeDefined();
  });

  it("renders AI message correctly", () => {
    render(Message, { text: "Hello User", sender: "ai", character_name: "TestAI" });
    const row = screen.getByRole("article").parentElement;
    expect(row?.classList.contains("ai-row")).toBe(true);
    expect(screen.getByText("TestAI")).toBeDefined();
    expect(screen.getByText("Hello User")).toBeDefined();
  });

  it("renders Fractal message correctly", () => {
    render(Message, { text: "Environment text", sender: "fractal", character_name: "TestFractal" });
    const row = screen.getByRole("article").parentElement;
    expect(row?.classList.contains("fractal-row")).toBe(true);
    expect(screen.getByText("TestFractal")).toBeDefined();
    expect(screen.getByText("Environment text")).toBeDefined();
  });

  it("resolves signature color from themeStore", () => {
    render(Message, { text: "test", sender: "user", character_name: "TestUser" });
    const bubble = screen.getByRole("article");
    expect(bubble.style.getPropertyValue("--signature-color")).toBe("#ff0000");
  });

  it("shows action buttons on last AI message", () => {
    render(Message, { text: "test", sender: "ai", is_last: true });
    expect(screen.getByLabelText("Continue")).toBeDefined();
    expect(screen.getByLabelText("Reroll")).toBeDefined();
  });

  it("does not show continue/reroll buttons on user message", () => {
    render(Message, { text: "test", sender: "user", is_last: true });
    expect(screen.queryByLabelText("Continue")).toBeNull();
    expect(screen.queryByLabelText("Reroll")).toBeNull();
  });

  it("shows copy, edit and delete for any message", () => {
    render(Message, { text: "test", sender: "user" });
    expect(screen.getByLabelText("Copy")).toBeDefined();
    expect(screen.getByLabelText("Edit")).toBeDefined();
    expect(screen.getByLabelText("Delete")).toBeDefined();
  });
});
