import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Message from "./Message.svelte";
import { app } from "@state/app.svelte.js";

// Mock the dependencies
vi.mock("@state/app.svelte.js", () => ({
  app: {
    settings: { dev_mode: false },
    selected_user: null,
    selected_ai: null,
    selected_fractal: null,
    open_image_preview: vi.fn(),
    streaming: {
      active: false,
      content: "",
      node_id: null,
      role: "ai",
      abort_controller: null,
      text: "",
      nodeId: null,
    },
  },
}));

vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    active_user: { name: "UserTest" },
    active_ai: { name: "AITest" },
    active_fractal: { name: "FractalTest" },
  },
}));

vi.mock("@media/palette.svelte.js", () => ({
  themeStore: {
    get_signature_color: vi.fn(() => "mock-signature"),
    get_deterministic_color: vi.fn(() => "mock-deterministic"),
  },
}));

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Message.svelte", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    app.settings.dev_mode = false;
  });

  it("should render a user message and apply user-row class", () => {
    const { container } = render(Message, {
      props: {
        text: "Hello, World!",
        sender: "user",
      },
    });

    const messageRow = container.querySelector(".message-row");
    expect(messageRow).toBeTruthy();
    expect(messageRow?.classList.contains("user-row")).toBe(true);
    expect(screen.getByText("UserTest")).toBeTruthy();
    expect(screen.getByText("Hello, World!")).toBeTruthy();
  });

  it("should render an AI message and apply ai-row class", () => {
    const { container } = render(Message, {
      props: {
        text: "AI response",
        sender: "ai",
      },
    });

    const messageRow = container.querySelector(".message-row");
    expect(messageRow).toBeTruthy();
    expect(messageRow?.classList.contains("ai-row")).toBe(true);
    expect(screen.getByText("AI response")).toBeTruthy();
  });

  it("should render a fractal message and apply fractal-row class", () => {
    const { container } = render(Message, {
      props: {
        text: "Fractal resonance",
        sender: "fractal",
      },
    });

    const messageRow = container.querySelector(".message-row");
    expect(messageRow).toBeTruthy();
    expect(messageRow?.classList.contains("fractal-row")).toBe(true);
    expect(screen.getByText("Fractal resonance")).toBeTruthy();
  });

  it("should display DataBox when think_block is present in dev_mode", () => {
    app.settings.dev_mode = true;
    render(Message, {
      props: {
        text: "<think>thinking...</think>\nHello",
        sender: "ai",
      },
    });

    // The DataBox title should be rendered
    expect(screen.getByText("⚙️ DevMode: Reasoning")).toBeTruthy();
    expect(screen.getByText("thinking...")).toBeTruthy();
    app.settings.dev_mode = false;
  });

  it("should not display DataBox when dev_mode is false", () => {
    app.settings.dev_mode = false;
    render(Message, {
      props: {
        text: "<think>thinking...</think>\nHello",
        sender: "ai",
      },
    });

    expect(screen.queryByText("⚙️ DevMode: Reasoning")).toBeNull();
  });

  it("should render TextField in edit mode and functional Save/Cancel buttons when is_editing is true", async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { container } = render(Message, {
      props: {
        text: "Initial narrative text",
        sender: "user",
        is_editing: true,
        on_save: onSave,
        on_cancel: onCancel,
      },
    });

    // 1. Textarea of TextField must be rendered and initialized with 'Initial narrative text'
    const textarea = /** @type {HTMLTextAreaElement} */ (container.querySelector("textarea"));
    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe("Initial narrative text");

    // 2. Modifying textarea value should update the local text state
    await fireEvent.input(textarea, { target: { value: "Updated narrative text" } });

    // 3. Save button must trigger on_save callback with the updated value
    const saveBtn = screen.getByText("Save");
    expect(saveBtn).toBeTruthy();
    await fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledWith("Updated narrative text");

    // 4. Cancel button must trigger on_cancel callback
    const cancelBtn = screen.getByText("Cancel");
    expect(cancelBtn).toBeTruthy();
    await fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });
});
