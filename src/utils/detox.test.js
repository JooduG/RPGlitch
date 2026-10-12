import { describe, it, expect } from "vitest";
import { detox_prose } from "./detox.js";
import "../data/definitions/speaking-styles.js";

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
    expect(detox_prose("He shifted his weight nervously and caressed her hand as boots squelched in the mud.")).not.toMatch(
      /shifted.*weight|caressed|squelched/i,
    );
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

  it("preserves natural character voice vocabulary like booming laugh, bellowed, and hitch", () => {
    expect(detox_prose("With a booming laugh, he strikes a pose.")).toContain("booming laugh");
    expect(detox_prose("He bellowed at the top of his lungs.")).toContain("bellowed");
    expect(detox_prose("There was a hitch in his breath.")).toContain("hitch");
  });

  it("scrubs parenthetical antithesis rationalizations ('not a desire, I tell myself, but a professional appreciation')", () => {
    const input = "It was not a desire, I tell myself, but a professional appreciation for the potential.";
    expect(detox_prose(input)).toBe("It was a professional appreciation for the potential.");
  });

  it("scrubs Wikipedia AI stock filler words and corporate cliches", () => {
    expect(detox_prose("The realm of cyberspace stands as a testament to progress.")).not.toMatch(/realm|stands as a testament/i);
    expect(detox_prose("It plays a vital role in our seamless, holistic platform.")).not.toMatch(/vital role|seamless|holistic/i);
    expect(detox_prose("In today's fast-paced world, this is a game-changer.")).not.toMatch(/in today's fast-paced world|game-changer/i);
  });

  it("scrubs dangling participial significance clauses ('...underscoring its impact')", () => {
    const input = "The team deployed the update, highlighting the shift toward automation.";
    expect(detox_prose(input)).toBe("The team deployed the update.");
    const input2 = "He sealed the airlock, underscoring his decisive leadership.";
    expect(detox_prose(input2)).toBe("He sealed the airlock.");
  });

  it("scrubs rhetorical 'not just X, it's Y' false contrasts", () => {
    const input = "It's not just a tool — it's a movement.";
    expect(detox_prose(input)).toBe("It is a movement.");
  });

  it("normalizes raw em-dashes and en-dashes into clean commas", () => {
    const input = "The door opened — he stepped inside — into the dark.";
    expect(detox_prose(input)).toBe("The door opened, he stepped inside, into the dark.");
  });

  it("cleanses throat-clearing 'quietly [verb]' crutches", () => {
    expect(detox_prose("He quietly stepped toward the door.")).toBe("He stepped toward the door.");
    expect(detox_prose("She quietly watched the monitors.")).toBe("She watched the monitors.");
  });

  it("rewrites Tier 1 fatal syntactic constructions (Track 3.2)", () => {
    expect(detox_prose("Not quite a smile, more like a warning.")).toBe("More like a warning.");
    expect(detox_prose("Not a flinch; she simply stopped breathing.")).toBe("She simply stopped breathing.");
    expect(detox_prose("She didn't answer him; she looked at the door.")).toBe("She looked at the door.");
    expect(detox_prose("The air grew thick between them.")).toBe("The room went quiet between them.");
    expect(detox_prose("She brushed lint from his shoulder, a gesture of ownership.")).toBe("She brushed lint from his shoulder.");
  });

  it("rewrites Tier 1B clarity edits (Track 3.5)", () => {
    expect(detox_prose("We utilize the deck in order to breach the vault.")).toBe("We use the deck to breach the vault.");
    expect(detox_prose("Due to the fact that the terminal commenced shutting down.")).toBe("Because the terminal started shutting down.");
    expect(detox_prose("She endeavors to ascertain the passkey.")).toBe("She attempts to find out the passkey.");
    expect(detox_prose("This console serves as the mainframe backup.")).toBe("This console is the mainframe backup.");
  });

  it("rewrites Tier 1A high-frequency AI vocabulary markers (Track 3.5)", () => {
    expect(detox_prose("We delve into the intricate complexities of the digital realm.")).toBe(
      "We dig into the complex details of the digital domain.",
    );
    expect(detox_prose("A cutting-edge paradigm, a beacon of seamless progress.")).toBe("An advanced model, a signal of smooth progress.");
    expect(detox_prose("A comprehensive update leveraging robust mechanisms at its core.")).toBe("A thorough update using solid mechanisms.");
    expect(detox_prose("This game-changing moment was a pivotal watershed moment.")).toBe("This turning point moment was a key turning point.");
  });
});
