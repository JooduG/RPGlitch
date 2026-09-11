import { describe, expect, it } from "vitest";
import { clean_image_prompt, strip_proper_names } from "./image-prompts.js";

describe("strip_proper_names", () => {
  it("removes a character's full name and surname tokens", () => {
    const out = strip_proper_names("a portrait of Lord Benedict Silvers in a charcoal suit", ["Lord Benedict Silvers"]);
    expect(out).not.toContain("Silvers");
    expect(out).not.toContain("Benedict");
    expect(out).toContain("charcoal suit");
  });

  it("handles possessive forms", () => {
    const out = strip_proper_names("Silvers's crimson eyes", ["Lord Benedict Silvers"]);
    expect(out).not.toContain("Silvers");
    expect(out).toContain("crimson eyes");
  });

  it("does not leave doubled punctuation behind", () => {
    const out = strip_proper_names("portrait, Silvers, in a suit", ["Silvers"]);
    expect(out).not.toContain("Silvers");
    expect(out).not.toContain(",,");
  });

  it("ignores honorific stopwords when collecting tokens", () => {
    const out = strip_proper_names("a lordly posture of Lord Silvers", ["Lord Silvers"]);
    expect(out).toContain("lordly posture");
    expect(out).not.toContain("Silvers");
  });

  it("returns the text unchanged when no names are given", () => {
    expect(strip_proper_names("a charcoal suit", [])).toBe("a charcoal suit");
  });
});

describe("clean_image_prompt", () => {
  it("strips proper names from the sanitized prompt", () => {
    const out = clean_image_prompt("cinematic portrait of Silvers in a charcoal suit", { names: ["Lord Benedict Silvers"] });
    expect(out).not.toContain("Silvers");
    expect(out).toContain("charcoal");
  });

  it("works without options", () => {
    expect(clean_image_prompt("a charcoal suit")).toContain("charcoal");
  });
});
