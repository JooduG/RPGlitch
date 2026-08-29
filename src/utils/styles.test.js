import { describe, it, expect } from "vitest";
import { detox_prose, resolve_speaking_style, resolve_style, VALID_SPEAKING_STYLES } from "./styles.js";
import "../data/definitions/speaking-styles.js";
import { NARRATIVE_STYLES } from "../data/definitions/narrative-styles.js";

describe("detox_prose() with speaking styles", () => {
  it("strips purple prose idioms and cliché words cleanly using registered rules", () => {
    expect(detox_prose("The air tastes of ozone and the room hums.")).not.toMatch(/ozone|hums/i);
    expect(detox_prose("He murmured softly, a testament to his restraint.")).not.toMatch(/murmur|testament/i);
    expect(detox_prose("A rich tapestry of emotion, a symphony of breath.")).not.toMatch(/tapestry|symphony/i);
    expect(detox_prose("His obsidian eyes stared into the void.")).not.toMatch(/obsidian|void/i);
    expect(detox_prose("She stood frozen, white knuckles on the rail.")).not.toMatch(/frozen|white knuckles/i);
    expect(detox_prose("The sky was bruised purple in amber light.")).not.toMatch(/bruised purple|amber light/i);
    expect(detox_prose("Old parchment rustled; once in a blue moon.")).not.toMatch(/parchment|blue moon/i);
    expect(detox_prose("Crimson lips, iridescent scales, a spatial disturbance.")).not.toMatch(/crimson|iridescent|spatial disturbance/i);
    expect(detox_prose("He let out a breath he didn't realize he was holding.")).not.toMatch(/realize.*holding|realized.*holding/i);
    expect(detox_prose("They were merging their molecules together.")).not.toMatch(/merging their molecules/i);
    expect(detox_prose("His thumb rubbed small circles on her wrist as he traced the line of her collarbone.")).not.toMatch(
      /rubbed.*circles|collarbone/i,
    );
    expect(detox_prose("Her heart fluttered in her chest like a trapped bird.")).not.toMatch(/trapped bird/i);
    expect(detox_prose("The air was thick with smoke, and then the air thickened.")).not.toMatch(/air was thick with|air thickened/i);
    expect(detox_prose("She laughed, a genuine sound.")).not.toMatch(/a genuine sound/i);
    expect(detox_prose("For the first time in his life, he smiled.")).not.toMatch(/for the first time in his life/i);
    expect(detox_prose("It felt less like a sanctuary and more like a prison.")).toBe("It felt like a prison.");
  });

  it("preserves grounded plain text without modifying it", () => {
    const plain = "He sat at the wooden desk, opened the drawer, and took out a key.";
    expect(detox_prose(plain)).toBe(plain);
  });

  it("handles boundary variations like leaning in", () => {
    expect(detox_prose("He leaned in, whispering softly.")).not.toMatch(/leaned in/i);
    expect(detox_prose("I lean in to hear what he says.")).not.toMatch(/lean in/i);
    expect(detox_prose("Silvers leans in, his expression unreadable.")).not.toMatch(/leans in/i);
    expect(detox_prose("Leaning in, he closed the distance.")).not.toMatch(/leaning in/i);
  });

  it("does not false-positive on valid words like 'leaned in the doorway'", () => {
    expect(detox_prose("He leaned in the doorway, watching her.")).toContain("leaned in the doorway");
    expect(detox_prose("The room was devoid of light.")).toContain("devoid of");
  });

  it("scrubs the secondary sensory crutch 'metallic tang' (near-miss from the stress test)", () => {
    expect(detox_prose("A metallic tang flooded his mouth.")).not.toMatch(/metallic tang/i);
    expect(detox_prose("The air carried a metallic tang.")).not.toMatch(/tang/i);
    expect(detox_prose("Metallic tang on the tongue.")).not.toMatch(/metallic/i);
  });

  it("supports explicit custom rule sets passed in", () => {
    const custom = [{ regex: /cyber-glitch/gi, replace: "clean-signal" }];
    expect(detox_prose("Got a cyber-glitch here.", "casual", custom)).toBe("Got a clean-signal here.");
  });
});

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
