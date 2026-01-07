import { jest } from "@jest/globals";
// 1. Mock External Dependencies
// We must mock these BEFORE importing the module under test.

// Mock app-state
jest.mock("../../../src/js/core/state.js", () => ({
  state: {
    settings: {
      directorMode: false,
      storyOpeningInstructions: "",
      storyPrologueInstructions: "",
    },
    story: {
      activeId: null,
      byId: {},
    },
  },
  applyPatch: jest.fn(),
}));

// Mock core-db
jest.mock("../../../src/js/core/db.js", () => ({
  db: {
    settings: {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
    stories: {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      orderBy: jest.fn(() => ({
        reverse: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([]),
        })),
      })),
    },
    messages: {
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          delete: jest.fn(),
        })),
      })),
    },
    delete: jest.fn(),
    open: jest.fn(),
  },
}));

// Mock ui-views
jest.mock("../../../src/js/ui/orchestrator.js", () => ({
  router: {
    handleRoute: jest.fn(),
  },
}));

// Mock manager-turns (StoryController)
jest.mock("../../../src/js/engine/director.js", () => ({
  StoryController: {
    concludeStory: jest.fn(),
    enhanceUserDraft: jest.fn(),
    generateVisualFromDraft: jest.fn(),
    requestVisual: jest.fn(),
  },
}));

// Mock entity-crud
jest.mock("../../../src/js/data/repo.js", () => ({
  entities: {
    get: jest.fn(),
  },
}));

// 2. Import Module Under Test
import { StoryOptionsController } from "../../../src/js/ui/components/settings.js";
import { applyPatch } from "../../../src/js/core/state.js";
import { db } from "../../../src/js/core/db.js";

describe("StoryOptionsController", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    applyPatch.mockClear();

    // Reset JSDOM (Use Jest's global environment)
    document.body.innerHTML = `
        <template id="tpl-settings-modal">
          <div class="settings-body">
            <textarea id="setting-story-instructions"></textarea>
          </div>
        </template>
        
        <div id="settings" hidden>
          <div class="modal-content">
            <div class="settings-body">
              <textarea id="setting-story-instructions"></textarea>
            </div>
          </div>
          <button class="close"></button>
          <button id="btn-reset-story"></button>
          <input type="checkbox" id="setting-developer-mode" />
           <!-- Sections for visibility logic -->
          <div class="settings-section-lobby"></div>
          <div class="settings-section-game"></div>
        </div>
        
        <button id="btn-options"></button>
        <button id="btn-settings-placeholder"></button>
    `;

    global.confirm = jest.fn(() => true);
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();

    // Default db behavior
    db.settings.get.mockResolvedValue({});
  });

  test("init() populates story instructions from db", async () => {
    db.settings.get.mockResolvedValue({
      storyPrologueInstructions: "Be nice",
    });

    StoryOptionsController.init();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const input = document.querySelector("#setting-story-instructions");
    expect(input.value).toBe("Be nice");
  });

  test("chat settings button opens modal", async () => {
    await StoryOptionsController.init();

    const btn = document.querySelector("#btn-settings-placeholder");

    // Spy on StoryOptionsController.open
    const openSpy = jest.spyOn(StoryOptionsController, "open");

    btn.click();

    expect(openSpy).toHaveBeenCalled();

    openSpy.mockRestore();
  });
});
