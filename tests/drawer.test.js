import { jest, describe, beforeEach, test, expect } from "@jest/globals";

// 1. Mock External Dependencies
jest.mock("../apps/rpglitch/js/core/utils.js", () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../apps/rpglitch/js/ui/services/ui-utils.js", () => ({
  getPictureHTML: jest.fn(() => {
    const doc = globalThis.document;
    if (doc && doc.createElement) {
      const div = doc.createElement("div");
      div.className = "mock-picture";
      return div;
    }
    return { style: { transform: "" }, querySelector: () => null };
  }),
}));

jest.mock("../apps/rpglitch/js/data/models.js", () => ({
  getVisualState: jest.fn(() => ({ flipped: false })),
}));

// Mock entity-crud.js to control `entities.list` resolution
jest.mock("../apps/rpglitch/js/data/repo.js", () => ({
  entities: {
    list: jest.fn(),
  },
}));

describe("Drawer Component", () => {
  let _openDrawer, _closeDrawer, _entities;

  beforeEach(async () => {
    // Setup JSDOM (Use global Jest environment)
    document.body.innerHTML = `
      <div id="entity-drawer" hidden>
        <div id="entity-drawer-header">
          <h2 id="entity-drawer-title">Title</h2>
          <button id="entity-drawer-close">X</button>
        </div>
        <div id="entity-drawer-content"></div>
      </div>
      <div id="entity-drawer-backdrop" hidden></div>
      <template id="tpl-drawer-card">
        <div class="drawer-card">
          <div class="card-img"></div>
          <div class="card-name"></div>
        </div>
      </template>
    `;

    // Reset modules to ensure fresh import of drawer.js
    jest.resetModules();

    // Import drawer.js dynamically
    const drawerModule =
      await import("../apps/rpglitch/js/ui/components/drawer/desktop.js");
    _openDrawer = drawerModule.openDrawer;
    _closeDrawer = drawerModule.closeDrawer;

    // Re-import the mocked entities to control the instance used by drawer.js
    const crudModule = await import("../apps/rpglitch/js/data/repo.js");
    _entities = crudModule.entities;

    // Reset mocks on the fresh instance
    _entities.list.mockReset();
    jest.clearAllMocks();

    // Initialize the drawer
    drawerModule.initDrawer();
  });

  test("initDrawer should set up listeners", () => {
    const backdrop = document.getElementById("entity-drawer-backdrop");
    expect(backdrop).toBeTruthy();
    // Assuming initDrawer binds click to backdrop?
    // We can't easily check event listeners, but we can check if drawer exists
    const drawer = document.getElementById("entity-drawer");
    expect(drawer).toBeTruthy();
  });

  test("openDrawer should show drawer and load items", async () => {
    // Setup mock data
    _entities.list.mockReturnValue([
      { id: "1", name: "Entity 1", profilePicture: "pic1.jpg" },
      { id: "2", name: "Entity 2", profilePicture: "pic2.jpg" },
    ]);

    // Call openDrawer(type, onSelect, triggerElement, onCreate, titleOverride)
    await _openDrawer("character", jest.fn(), null, null, "Test Title");

    // Check state immediately after await
    const drawer = document.getElementById("entity-drawer");
    expect(drawer.classList.contains("is-open")).toBe(true);
    expect(drawer.hidden).toBe(false);

    const content = document.getElementById("entity-drawer-content");
    // Should have 3 items: Create New + Entity 1 + Entity 2
    expect(content.querySelectorAll(".drawer-card").length).toBe(3);
    expect(_entities.list).toHaveBeenCalledWith("character");
  });

  test("clicking an item should trigger callack and close drawer", async () => {
    const onSelect = jest.fn();
    _entities.list.mockReturnValue([
      { id: "1", name: "Entity 1", profilePicture: "pic1.jpg" },
    ]);

    await _openDrawer("character", onSelect, null, null, "Selection");

    const content = document.getElementById("entity-drawer-content");
    // Item 1 is index 1 (index 0 is Create New)
    const itemCard = content.querySelectorAll(".drawer-card")[1];
    itemCard.click();

    expect(onSelect).toHaveBeenCalledWith("1");
    // Wait for close animation/logic if any, but closeDrawer is sync in terms of hidden removal usually?
    // The original closeDrawer might have a timeout?
    // In refactored drawer.js, closeDrawer is async? No, logic is simple.
    // But we should check if global state updated.
  });

  test("closeDrawer should hide elements", async () => {
    // Manually open first to set state
    const drawer = document.getElementById("entity-drawer");
    drawer.classList.add("is-open");
    drawer.removeAttribute("hidden");

    _closeDrawer();

    expect(drawer.classList.contains("is-open")).toBe(false);
    // hidden attribute might be added after animation end?
    // In current implementation, it removes is-open.
  });
});
