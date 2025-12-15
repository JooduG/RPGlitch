import { JSDOM } from "jsdom";

jest.mock("../apps/rpglitch/js/core/db.js", () => ({
  db: {
    on: jest.fn(),
    settings: {
      get: jest.fn().mockResolvedValue({}),
      put: jest.fn().mockResolvedValue(),
    },
  },
}));

jest.mock("../apps/rpglitch/js/data/models.js", () => ({
  getPictureHTML: jest.fn(),
}));

jest.mock("../apps/rpglitch/js/ui/components/chat/feed.js", () => ({
  renderChat: jest.fn(),
  setGameplayEntities: jest.fn(),
  showTypingIndicator: jest.fn(),
  removeTypingIndicator: jest.fn(),
  setSendLock: jest.fn(),
  setChatGeneratingState: jest.fn(),
}));

jest.mock("../apps/rpglitch/js/ui/services/visuals.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
  updateDirectorModeClass: jest.fn(),
}));

afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.App;
});

async function loadApp() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    runScripts: "outside-only",
  });

  global.window = dom.window;
  global.document = dom.window.document;

  // Provide proper Dexie mock
  dom.window.Dexie = jest.fn(function (name) {
    this.name = name;
    this.version = jest.fn().mockReturnThis();
    this.stores = jest.fn().mockReturnThis();
    this.upgrade = jest.fn().mockReturnThis();
    this.open = jest.fn().mockResolvedValue();
  });
  dom.window.DOMPurify = {};
  dom.window._hyperscript = {};
  dom.window.$ = function () {};

  jest.resetModules();
  const utils = await import("../apps/rpglitch/js/core/utils.js");
  const index = await import("../apps/rpglitch/js/core/bootstrap.js");

  dom.window.App = {
    ...index,
    ...utils,
  };

  // Return the isolated JSDOM context and the loaded App instance
  return { dom, App: dom.window.App };
}

test("hideEl hides by element or id", async () => {
  const { dom, App } = await loadApp();
  const document = dom.window.document;
  document.body.innerHTML = '<div id="test-el"></div>';
  const el = document.getElementById("test-el");
  expect(typeof App.hideEl).toBe("function");
  App.hideEl(el, document);
  expect(el.hasAttribute("hidden")).toBe(true);
  el.removeAttribute("hidden");
  // Using the string ID should work the same
  App.hideEl("test-el", document);
  expect(el.hasAttribute("hidden")).toBe(true);
});

test("showEl reveals element by removing hidden attribute", async () => {
  const { dom, App } = await loadApp();
  const document = dom.window.document;
  document.body.innerHTML = '<div id="test-el" hidden="hidden"></div>';
  const el = document.getElementById("test-el");
  App.showEl(el, document);
  expect(el.hasAttribute("hidden")).toBe(false);
  el.setAttribute("hidden", "hidden");
  App.showEl("test-el", document);
  expect(el.hasAttribute("hidden")).toBe(false);
});

test("handleAsyncError executes async function and returns result on success", async () => {
  const { App } = await loadApp();
  const result = await App.handleAsyncError(async () => "success", {
    context: "test operation",
    showAlert: false,
  });
  expect(result).toBe("success");
});

test("handleAsyncError catches errors and returns fallback value", async () => {
  const { dom, App } = await loadApp();
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  const alertSpy = jest.spyOn(dom.window, "alert").mockImplementation();

  const result = await App.handleAsyncError(
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

  expect(result).toBe("fallback value");
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "[RPGlitch]",
    "Failed to test operation:",
    expect.any(Error),
  );
  expect(alertSpy).toHaveBeenCalledWith("Operation failed");

  consoleErrorSpy.mockRestore();
  alertSpy.mockRestore();
});

test("handleAsyncError suppresses alert when showAlert is false", async () => {
  const { dom, App } = await loadApp();
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  const alertSpy = jest.spyOn(dom.window, "alert").mockImplementation();

  await App.handleAsyncError(
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

  expect(alertSpy).not.toHaveBeenCalled();
  expect(consoleErrorSpy).toHaveBeenCalled();

  consoleErrorSpy.mockRestore();
  alertSpy.mockRestore();
});

test("replaceEventHandler replaces existing event listener", async () => {
  const { dom, App } = await loadApp();
  const document = dom.window.document;
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
  App.replaceEventHandler(btn, "click", handler1, "_testHandler");
  btn.click();
  expect(callCount).toBe(1);

  // Replace with second handler
  App.replaceEventHandler(btn, "click", handler2, "_testHandler");
  btn.click();
  expect(callCount).toBe(11); // Should be 1 + 10, not 1 + 1 + 10

  // Verify first handler was removed
  btn.click();
  expect(callCount).toBe(21); // Should be 11 + 10, confirming only handler2 is active
});

test("replaceEventHandler handles null element gracefully", async () => {
  const { App } = await loadApp();
  const handler = jest.fn();

  // Should not throw
  expect(() => {
    App.replaceEventHandler(null, "click", handler, "_testHandler");
  }).not.toThrow();

  expect(handler).not.toHaveBeenCalled();
});
