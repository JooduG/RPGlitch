import {
  updatePortraits,
  updateDeveloperModeClass,
} from "../../../../apps/rpglitch/js/ui/image-gen-ui.js";
import { ThemeService } from "../../../../apps/rpglitch/js/ui/services/theme.js";

// Mock dependencies
jest.mock("../../../../apps/rpglitch/js/ui/services/theme.js", () => ({
  ThemeService: {
    apply: jest.fn(),
  },
}));

jest.mock("../../../../apps/rpglitch/js/core/state.js", () => ({
  state: {
    settings: { developerMode: false },
  },
}));

jest.mock("../../../../apps/rpglitch/js/ui/services/ui-utils.js", () => ({
  getPictureHTML: jest.fn(() => {
    const img = document.createElement("img");
    img.className = "mock-img";
    return img;
  }),
}));

jest.mock("../../../../apps/rpglitch/js/core/utils.js", () => ({
  escapeHtml: jest.fn((str) => str),
  log: jest.fn(),
}));

jest.mock("../../../../apps/rpglitch/js/data/models.js", () => ({
  getVisualState: jest.fn(() => ({})),
}));

jest.mock("../../../../apps/rpglitch/js/core/constants.js", () => ({
  RGB_MAP: { default: "255, 255, 255" },
}));

jest.mock(
  "../../../../apps/rpglitch/js/ui/components/profile/controller.js",
  () => ({
    openProfileModal: jest.fn(),
  }),
);

describe("image-gen-ui.js", () => {
  let container;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="storymode-user-portrait">
        <div class="portrait-image"></div>
        <div class="character-name-overlay"></div>
      </div>
    `;
    container = document.getElementById("storymode-user-portrait");
    jest.clearAllMocks();
  });

  test("updatePortraits updates name via innerHTML (Baseline)", () => {
    const userChar = { name: "Test User", signatureColor: "blue" };
    updatePortraits(null, userChar);

    const nameDiv = container.querySelector(".character-name-overlay");
    // Baseline check: currently uses innerHTML with h2
    expect(nameDiv.innerHTML).toContain("<h2>Test User</h2>");
  });

  test("updatePortraits updates image via innerHTML/appendChild (Baseline)", () => {
    const userChar = { name: "Test User" };
    updatePortraits(null, userChar);

    const imgDiv = container.querySelector(".portrait-image");
    expect(imgDiv.innerHTML).not.toBe("");
    expect(imgDiv.querySelector(".mock-img")).toBeTruthy();
  });
});
