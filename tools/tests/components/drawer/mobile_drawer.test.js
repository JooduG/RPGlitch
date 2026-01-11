import { describe, test, expect, afterEach, jest } from "@jest/globals";

// Mocks
jest.mock("../../../../src/js/scholar/repository.js", () => ({
  entities: { list: jest.fn().mockReturnValue([]) },
  seedPremades: jest.fn().mockResolvedValue(),
  _allItemsCache: {},
}));

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

jest.mock("../../../../src/js/mesmer/ui/components/drawer/desktop.js", () => ({
  openDrawer: jest.fn(),
}));

jest.mock("../../../../src/js/gamemaster/bootstrap.js", () => ({
  AppBootstrap: { init: jest.fn() },
}));

jest.mock("../../../../src/App.svelte", () => ({}));

// Mock Bootstrap to avoid Svelte/ESM issues in legacy tests

// Mock artificer app store
jest.mock("../../../../src/artificer/stores/app.svelte.js", () => ({
  app: {
    toggleProfile: jest.fn(),
    view: "lobby",
    controlPanelOpen: false,
  },
}));

// Mock scholar runtime store
jest.mock("../../../../src/scholar/stores/runtime.svelte.js", () => ({
  runtime: {
    character: {},
    updateCharacter: jest.fn(),
    sync: jest.fn(),
  },
}));

async function loadApp(html) {
  document.body.innerHTML = html;
  jest.resetModules();

  const utils = require("../../../../src/js/gamemaster/utils.js");
  const uiUtils = require("../../../../src/js/mesmer/ui/core/utils.js");
  const mobileDrawer = require("../../../../src/js/mesmer/ui/components/drawer/mobile.js");
  const index = require("../../../../src/js/gamemaster/bootstrap.js");

  const App = { ...index, ...utils, ...uiUtils, ...mobileDrawer };
  return { App };
}

afterEach(() => {
  delete global.App;
  jest.resetModules();
  jest.clearAllMocks();
});

describe("Drawer/Mobile Component", () => {
  test("open/close toggles visibility attributes", async () => {
    const html = `<!doctype html><html><body>
            <div id="mobile-drawer-container" hidden><div class="mobile-drawer" data-mobile-drawer="stories" hidden></div></div>
        </body></html>`;
    const { App } = await loadApp(html);

    App.MobileDrawerUI.init();
    App.MobileDrawerUI.open("stories");

    await new Promise((r) => setTimeout(r, 0));

    const container = document.getElementById("mobile-drawer-container");
    const panel = document.querySelector('[data-mobile-drawer="stories"]');
    expect(container.hidden).toBe(false);
    expect(panel.hidden).toBe(false);

    App.MobileDrawerUI.close("stories");
    await new Promise((r) => setTimeout(r, 0));
    expect(panel.hidden).toBe(true);
  });

  test("outside click closes drawer", async () => {
    const html = `<!doctype html><html><body>
            <header id="top-bar"></header>
            <div id="mobile-drawer-container" style="pointer-events: none;">
                <div id="mobile-drawer-backdrop" hidden></div>
                <div class="mobile-drawer" data-mobile-drawer="stories" hidden></div>
            </div>
        </body></html>`;
    const { App } = await loadApp(html);
    App.MobileDrawerUI.init();
    App.MobileDrawerUI.open("stories");

    await new Promise((r) => setTimeout(r, 0));
    const container = document.getElementById("mobile-drawer-container");
    expect(container.hidden).toBe(false);

    const backdrop = document.getElementById("mobile-drawer-backdrop");
    backdrop.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 0));
    expect(container.hidden).toBe(true);
  });
});
