import { Mesmer } from "../../../../src/mesmer/index.js";
import { audioService } from "../../../../src/mesmer/audio/service.js";
import { ThemeService } from "../../../../src/mesmer/logic/theme.js";

// Mock dependencies
jest.mock("../../../../src/mesmer/audio/service.js");
jest.mock("../../../../src/mesmer/logic/theme.js");

describe("Mesmer Engine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Audio (Identity)", () => {
    test("play() delegates to audioService", () => {
      Mesmer.play("notification");
      expect(audioService.play).toHaveBeenCalledWith("notification");
    });
  });

  describe("Theme (Mood)", () => {
    test("setTheme() delegates to ThemeService", () => {
      const el = document.createElement("div");
      Mesmer.setTheme(el, "cyan");
      expect(ThemeService.apply).toHaveBeenCalledWith(el, "cyan");
    });

    test("getColor() delegates to ThemeService", () => {
      Mesmer.getColor("cyan");
      expect(ThemeService.getColor).toHaveBeenCalledWith("cyan");
    });
  });

  describe("Visuals (Light) - Legacy Maestro", () => {
    test("templateVisual() generates correct prompt structure", () => {
      const context = {
        ai: { name: "Cortana", forever: { physical: "Blue Hologram" } },
        user: { name: "Chief" },
        history: "[Chief]: Hello",
      };

      const prompt = Mesmer.templateVisual("ai", "A test", context);

      expect(prompt).toContain("[SYSTEM: PROMETHEUS_MESMER_V3.0]");
      expect(prompt).toContain("[MODULE: VISUAL_REALITY_ENGINE]");
      expect(prompt).toContain("Blue Hologram"); // Context Injection
      expect(prompt).toContain("[Chief]: Hello"); // History Injection
    });

    test("templateVisual() handles extraction mode", () => {
      const prompt = Mesmer.templateVisual("ai", "Raw Text", {
        mode: "extract",
      });
      expect(prompt).toContain(
        "Objective: Scrape the provided Description/Profile",
      );
    });
  });
});
