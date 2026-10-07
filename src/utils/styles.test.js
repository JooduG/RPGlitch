import { describe, it, expect } from "vitest";
import { resolve_speaking_style, resolve_style, VALID_SPEAKING_STYLES } from "./styles.js";
import "../data/definitions/speaking-styles.js";
import { NARRATIVE_STYLES } from "../data/definitions/narrative-styles.js";

describe("resolve_speaking_style hierarchy", () => {
  it("prioritizes character speaking_style over narrative style", () => {
    const entity = { speaking_style: "casual" };
    const style = NARRATIVE_STYLES.edgar_allan_poe;
    expect(resolve_speaking_style(entity, style)).toBe("casual");
  });

  it("prioritizes character lyrical style over casual narrative style", () => {
    const entity = { speaking_style: "lyrical" };
    const style = NARRATIVE_STYLES.cormac_mccarthy;
    expect(resolve_speaking_style(entity, style)).toBe("lyrical");
  });

  it("falls back to narrative style speaking style when character speaking_style is empty", () => {
    const entity = { speaking_style: "" };
    expect(resolve_speaking_style(entity, NARRATIVE_STYLES.edgar_allan_poe)).toBe("lyrical");
    expect(resolve_speaking_style(entity, NARRATIVE_STYLES.cormac_mccarthy)).toBe("casual");
  });

  it("prioritizes character primal and clinical styles over narrative styles", () => {
    expect(resolve_speaking_style({ speaking_style: "primal" }, NARRATIVE_STYLES.edgar_allan_poe)).toBe("primal");
    expect(resolve_speaking_style({ speaking_style: "clinical" }, NARRATIVE_STYLES.cormac_mccarthy)).toBe("clinical");
  });

  it("defaults to casual when neither character nor narrative style has a speaking style", () => {
    expect(resolve_speaking_style(null, null)).toBe("casual");
    expect(resolve_speaking_style({}, "default")).toBe("casual");
  });
});

describe("resolve_style()", () => {
  const registry = {
    cyberpunk: { id: "cyberpunk" },
    gothic: { id: "gothic" },
  };

  it("resolves explicit entity/fractal style if valid in registry", () => {
    expect(resolve_style("cyberpunk", "visual_style", registry, "none")).toBe("cyberpunk");
  });

  it("falls back to default fallback if invalid or not found", () => {
    expect(resolve_style("unknown", "visual_style", registry, "none")).toBe("none");
    expect(resolve_style("default", "visual_style", registry, "none")).toBe("none");
    expect(resolve_style("", "visual_style", registry, "none")).toBe("none");
  });
});

describe("VALID_SPEAKING_STYLES", () => {
  it("exposes canonical speaking styles in a frozen Set", () => {
    expect(VALID_SPEAKING_STYLES.has("casual")).toBe(true);
    expect(VALID_SPEAKING_STYLES.has("lyrical")).toBe(true);
    expect(VALID_SPEAKING_STYLES.has("primal")).toBe(true);
    expect(VALID_SPEAKING_STYLES.has("clinical")).toBe(true);
    expect(VALID_SPEAKING_STYLES.size).toBe(4);
  });
});
