import { renderMessage } from "../../../../src/js/ui/components/chat/bubble.js";

// Mock dependencies to avoid circular references and side effects
jest.mock("../../../../src/js/ui/components/chat/feed.js", () => ({
  renderChat: jest.fn(),
  showTypingIndicator: jest.fn(),
}));

jest.mock("../../../../src/js/engine/director.js", () => ({
  TurnManager: {
    editUserMessage: jest.fn(),
    editAiMessage: jest.fn(),
  },
}));

jest.mock("../../../../src/js/ui/services/lightbox.js", () => ({
  LightboxService: {
    open: jest.fn(),
  },
}));

jest.mock("../../../../src/js/core/state.js", () => ({
  state: { story: { activeId: null } },
}));

jest.mock("../../../../src/js/ui/services/theme.js", () => ({
  ThemeService: { apply: jest.fn() },
}));

import { createIconBtn } from "../../../../src/js/ui/services/ui-utils.js";

jest.mock("../../../../src/js/ui/services/ui-utils.js", () => ({
  createIconBtn: jest.fn(),
}));

describe("Bubble UI - Image Prompt Regex", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    // Setup mock to return a real element, safe inside beforeEach
    createIconBtn.mockImplementation(() => document.createElement("button"));
  });

  test("should correctly render multi-line image prompts", () => {
    const textWithPrompt = `
Here is some text.
<image_prompt>
A cyberpunk city,
neon lights,
rainy streets
</image_prompt>
Target confirmed.
    `.trim();

    const role = "ai";
    const entities = {};
    const options = { messageId: "msg-123" };

    renderMessage(
      container,
      role,
      textWithPrompt,
      "AI",
      "TEXT",
      entities,
      options,
    );

    const bubble = container.querySelector(".chat-bubble");
    // console.log("BUBBLE HTML:", bubble.innerHTML);
    expect(bubble).not.toBeNull();

    // Check if the debug block is present (now .debug-card--prompt)
    const debugBlock = bubble.querySelector(".debug-card--visuals");
    expect(debugBlock).not.toBeNull();
    expect(debugBlock.classList.contains("developer-content")).toBe(true);

    // [UPDATED] Check for new Grid Structure
    const directorRows = debugBlock.querySelectorAll(".director-row");
    expect(directorRows.length).toBeGreaterThan(0);

    const values = Array.from(
      debugBlock.querySelectorAll(".director-value"),
    ).map((el) => el.innerHTML);
    const combinedValues = values.join(" ");

    expect(combinedValues).toContain("A cyberpunk city,");
    expect(combinedValues).toContain("neon lights,");
    expect(combinedValues).toContain("rainy streets");
  });

  test("should correctly render inline image prompts", () => {
    const textWithPrompt = "Image: <image_prompt>A cat</image_prompt>. Done.";

    renderMessage(
      container,
      "ai",
      textWithPrompt,
      "AI",
      "TEXT",
      {},
      { messageId: "msg-2" },
    );

    const debugBlock = container.querySelector(".debug-card--visuals");
    expect(debugBlock).not.toBeNull();

    const values = Array.from(
      debugBlock.querySelectorAll(".director-value"),
    ).map((el) => el.innerHTML);
    const combinedValues = values.join(" ");
    expect(combinedValues).toContain("A cat");
  });
});
