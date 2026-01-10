import { db } from "../../../../src/js/scholar/db.js";

jest.mock("../../../../src/js/scholar/db.js", () => ({
  db: {
    on: jest.fn(),
    settings: {
      get: jest.fn().mockResolvedValue({}),
      put: jest.fn().mockResolvedValue(),
    },
    open: jest.fn().mockResolvedValue(),
  },
}));

jest.mock("../../../../src/js/mesmer/ui/core/utils.js", () => {
  const actual = jest.requireActual(
    "../../../../src/js/mesmer/ui/core/utils.js",
  );
  return {
    ...actual,
    getPictureHTML: jest.fn(),
  };
});

jest.mock("../../../../src/js/mesmer/ui/components/chat/feed.js", () => ({
  renderChat: jest.fn(),
  setGameplayEntities: jest.fn(),
  showTypingIndicator: jest.fn(),
  removeTypingIndicator: jest.fn(),
  setSendLock: jest.fn(),
  setChatGeneratingState: jest.fn(),
}));

jest.mock("../../../../src/js/mesmer/ui/components/visuals/manager.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
  updateDirectorModeClass: jest.fn(),
}));

jest.mock("../../../../src/js/mesmer/ui/core/orchestrator.js", () => ({
  showAlert: jest.fn(),
}));

let utils, uiUtils;

beforeAll(async () => {
  utils = await import("../../../../src/js/gamemaster/utils.js");
  uiUtils = await import("../../../../src/js/mesmer/ui/core/utils.js");
});

beforeEach(() => {
  document.body.innerHTML = "";
  jest.clearAllMocks();
});

test("hideEl hides by element or id", () => {
  document.body.innerHTML = '<div id="test-el"></div>';
  const el = document.getElementById("test-el");
  expect(typeof uiUtils.hideEl).toBe("function");
  uiUtils.hideEl(el, document);
  expect(el.hasAttribute("hidden")).toBe(true);

  el.removeAttribute("hidden");
  // Using the string ID should work the same
  uiUtils.hideEl("test-el", document);
  expect(el.hasAttribute("hidden")).toBe(true);
});

test("showEl reveals element by removing hidden attribute", () => {
  document.body.innerHTML = '<div id="test-el" hidden="hidden"></div>';
  const el = document.getElementById("test-el");
  uiUtils.showEl(el, document);
  expect(el.hasAttribute("hidden")).toBe(false);

  el.setAttribute("hidden", "hidden");
  uiUtils.showEl("test-el", document);
  expect(el.hasAttribute("hidden")).toBe(false);
});

test("handleAsyncError executes async function and returns result on success", async () => {
  const result = await utils.handleAsyncError(async () => "success", {
    context: "test operation",
    showAlert: false,
  });
  expect(result).toBe("success");
});

test("handleAsyncError catches errors and returns fallback value", async () => {
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  const orchestrator =
    await import("../../../../src/js/mesmer/ui/core/orchestrator.js");

  const result = await utils.handleAsyncError(
    async () => {
      throw new Error("Test error");
    },
    {
      errorMessage: "Operation failed",
      context: "test operation",
      showAlert: true,
      fallback: "fallback value",
    },
  );

  // Wait for dynamic import inside handleAsyncError
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(result).toBe("fallback value");
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "[RPGlitch]",
    "Failed to test operation:",
    expect.any(Error),
  );
  expect(orchestrator.showAlert).toHaveBeenCalledWith(
    "Error",
    "Operation failed",
  );

  consoleErrorSpy.mockRestore();
});

test("handleAsyncError suppresses alert when showAlert is false", async () => {
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  const orchestrator =
    await import("../../../../src/js/mesmer/ui/core/orchestrator.js");
  orchestrator.showAlert.mockClear();

  await utils.handleAsyncError(
    async () => {
      throw new Error("Test error");
    },
    {
      errorMessage: "Should not alert",
      context: "silent test",
      showAlert: false,
      fallback: null,
    },
  );

  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(orchestrator.showAlert).not.toHaveBeenCalled();
  expect(consoleErrorSpy).toHaveBeenCalled();

  consoleErrorSpy.mockRestore();
});

test("replaceEventHandler replaces existing event listener", () => {
  document.body.innerHTML = '<button id="test-btn">Click me</button>';
  const btn = document.getElementById("test-btn");

  let callCount = 0;
  const handler1 = () => {
    callCount += 1;
  };
  const handler2 = () => {
    callCount += 10;
  };

  // Add first handler
  uiUtils.replaceEventHandler(btn, "click", handler1, "_testHandler");
  btn.click();
  expect(callCount).toBe(1);

  // Replace with second handler
  uiUtils.replaceEventHandler(btn, "click", handler2, "_testHandler");
  btn.click();
  expect(callCount).toBe(11); // Should be 1 + 10, not 1 + 1 + 10

  // Verify first handler was removed
  btn.click();
  expect(callCount).toBe(21); // Should be 11 + 10
});

test("replaceEventHandler handles null element gracefully", () => {
  const handler = jest.fn();

  // Should not throw
  expect(() => {
    uiUtils.replaceEventHandler(null, "click", handler, "_testHandler");
  }).not.toThrow();

  expect(handler).not.toHaveBeenCalled();
});
