import { describe, expect, it } from "vitest";
import { detox_prose, resolve_voice_register } from "./detox-rules.js";
import { NARRATIVE_STYLES } from "./narrative-styles.js";

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
});

describe("resolve_voice_register hierarchy", () => {
  it("should prioritize character voice_register over narrative style", () => {
    const entity = { voice_register: "plain" };
    const style = NARRATIVE_STYLES.edgar_allan_poe.id; // poe defaults to ornate
    expect(resolve_voice_register(entity, style)).toBe("plain");
  });

  it("should prioritize character ornate register over plain narrative style", () => {
    const entity = { voice_register: "ornate" };
    const style = NARRATIVE_STYLES.cormac_mccarthy.id; // mccarthy defaults to plain
    expect(resolve_voice_register(entity, style)).toBe("ornate");
  });

  it("should fall back to narrative style register when character voice_register is empty", () => {
    const entity = { voice_register: "" };
    expect(resolve_voice_register(entity, NARRATIVE_STYLES.edgar_allan_poe.id)).toBe("ornate");
    expect(resolve_voice_register(entity, NARRATIVE_STYLES.cormac_mccarthy.id)).toBe("plain");
  });

  it("should default to plain when neither character nor narrative style has a voice register", () => {
    expect(resolve_voice_register(null, null)).toBe("plain");
    expect(resolve_voice_register({}, "default")).toBe("plain");
  });
});
