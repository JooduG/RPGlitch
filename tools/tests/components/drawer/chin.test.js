import { describe, test, expect, afterEach, jest } from "@jest/globals";

// Mocks must be defined before imports in ESM if using babel-jest,
// here we stick to the pattern used in previous tests.

jest.mock("../../../../src/js/data/repo.js", () => ({
  entities: { list: jest.fn().mockReturnValue([]) },
  seedPremades: jest.fn().mockResolvedValue(),
  _allItemsCache: {},
}));

jest.mock("../../../../src/js/ui/components/chat/feed.js", () => ({
  renderChat: jest.fn(),
  setGameplayEntities: jest.fn(),
  showTypingIndicator: jest.fn(),
  removeTypingIndicator: jest.fn(),
  setSendLock: jest.fn(),
  setChatGeneratingState: jest.fn(),
}));

jest.mock("../../../../src/js/ui/services/visuals.js", () => ({
  updatePortraits: jest.fn(),
  applyFractalAmbience: jest.fn(),
  updateDirectorModeClass: jest.fn(),
}));

async function loadApp(html) {
  document.body.innerHTML = html;
  jest.resetModules();

  // Note: Adjust paths relative to THIS file location (tools/tests/components/drawer)
  // apps is at ../../../../apps
  const utils = await import("../../../../src/js/core/utils.js");
  const uiUtils =
    await import("../../../../src/js/ui/services/ui-utils.js");
  const index = await import("../../../../src/js/core/bootstrap.js");

  const App = { ...index, ...utils, ...uiUtils };
  return { App };
}

afterEach(() => {
  delete global.App;
  jest.resetModules();
  jest.clearAllMocks();
});

describe("Drawer/Chin Component", () => {
  test("open/close toggles visibility attributes", async () => {
    const html = `<!doctype html><html><body>
            <div id="chin-container" hidden><div class="chin" data-chin="stories" hidden></div></div>
        </body></html>`;
    const { App } = await loadApp(html);

    App.chin.init();
    App.chin.open("stories");

    await new Promise((r) => setTimeout(r, 0));

    const container = document.getElementById("chin-container");
    const panel = document.querySelector('[data-chin="stories"]');
    expect(container.hidden).toBe(false);
    expect(panel.hidden).toBe(false);

    App.chin.close("stories");
    await new Promise((r) => setTimeout(r, 0));
    expect(panel.hidden).toBe(true);
  });

  test("outside click closes chin", async () => {
    const html = `<!doctype html><html><body>
            <header id="top-bar"></header>
            <div id="chin-container" style="pointer-events: none;">
                <div id="chin-backdrop" hidden></div>
                <div class="chin" data-chin="stories" hidden></div>
            </div>
        </body></html>`;
    const { App } = await loadApp(html);
    App.chin.init();
    App.chin.open("stories");

    await new Promise((r) => setTimeout(r, 0));
    const container = document.getElementById("chin-container");
    expect(container.hidden).toBe(false);

    const backdrop = document.getElementById("chin-backdrop");
    backdrop.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 0));
    expect(container.hidden).toBe(true);
  });
});
