import { jest } from "@jest/globals";

// Define mocks
const mockStoriesList = jest.fn();

// Mock gamemaster/index.js
jest.mock("../../src/js/gamemaster/index.js", () => ({
  store: {
    settings: { developerMode: false },
    story: { activeId: null, byId: {} },
  },
  EVENTS: { DB_UPDATED: "db-updated", STORY_LOADED: "story-loaded" },
  events: new EventTarget(),
  GameMaster: { load: jest.fn(), loadAll: jest.fn() },
}));

// Mock db
jest.mock("../../src/js/scholar/db.js", () => ({
  db: {
    settings: { get: jest.fn() },
    stories: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
    entities: { get: jest.fn() },
  },
}));

jest.mock("../../src/js/mesmer/ui/core/utils.js", () => ({
  getPictureHTML: () => globalThis.document.createElement("div"),
  TooltipService: { init: jest.fn() },
  createIconBtn: jest.fn(),
  createProfileRow: jest.fn(),
  renderDynamicsWidget: jest.fn(),
  chin: { init: jest.fn() },
  setTopBarRight: jest.fn(),
  hideEl: jest.fn(),
  showEl: jest.fn(),
  replaceEventHandler: jest.fn(),
  dismissLoadingUI: jest.fn(),
  setAppBackground: jest.fn(),
  renderTags: jest.fn(),
  downloadImage: jest.fn(),
}));

// Mock theme service
jest.mock("../../src/js/mesmer/ui/core/theme.js", () => ({
  ThemeService: { apply: jest.fn() },
}));

// Mock library (side effect import)
jest.mock("../../src/js/scholar/library.js", () => ({}));

describe("Security Vulnerability Check - Settings", () => {
  let StoryOptionsController;
  let repo;

  beforeAll(async () => {
    // Import repo and monkey-patch
    repo = await import("../../src/js/scholar/repository.js");
    // Save original to restore later if needed (not needed for one test file)
    repo.stories.list = mockStoriesList;

    const module =
      await import("../../src/js/mesmer/ui/components/settings.js");
    StoryOptionsController = module.StoryOptionsController;
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="library-grid"></div>
      <template id="tpl-loading-library"><div>Loading...</div></template>
      <template id="tpl-story-card">
        <button class="drawer-card">
          <div class="drawer-card-label"><div></div></div>
        </button>
      </template>
    `;

    window.DOMPurify = {
      sanitize: (html) =>
        String(html).replace(/\s+on\w+=/gi, " data-removed-on-attr="),
    };

    mockStoriesList.mockReset();
  });

  test("renderStories should be safe from XSS in story titles", async () => {
    const maliciousTitle = "<img src=x onerror=alert(1)>";

    mockStoriesList.mockResolvedValue([
      {
        id: "1",
        title: maliciousTitle,
        fractalName: "Test",
        lastPlayed: Date.now(),
        state: "active",
        signatureColor: "red",
        fractalAvatar: "",
      },
    ]);

    await StoryOptionsController.renderStories();

    const grid = document.getElementById("library-grid");

    const titleContainer = grid.querySelector(
      ".drawer-card-label > div:first-child",
    );

    expect(titleContainer).not.toBeNull();

    const img = titleContainer.querySelector("img");

    expect(img).not.toBeNull();
    expect(img.hasAttribute("onerror")).toBe(false);
    expect(img.hasAttribute("data-removed-on-attr")).toBe(true);
  });
});
