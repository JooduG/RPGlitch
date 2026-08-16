import { describe, expect, it } from "vitest";
import { detox_prose } from "./detox-rules.js";

describe("detox_prose()", () => {
  it("strips purple prose idioms and cliché words cleanly", () => {
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
});
