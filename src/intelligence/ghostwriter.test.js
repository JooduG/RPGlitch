/**
 * @file src/intelligence/ghostwriter.test.js
 * Tests for Ghostwriter prompt compiler (render_ghostwriter).
 */
import { describe, expect, it } from "vitest";
import { render_ghostwriter } from "./prompts.js";

describe("render_ghostwriter()", () => {
  const entities = {
    USER: { name: "Rafael Orion", eternal: { non_physical: "Heroic himbo" } },
    AI: { name: "Glitch", eternal: { non_physical: "Cyan-haired hacker" } },
    FRACTAL: { name: "Nova City", eternal: { non_physical: "Cyberpunk metropolis" } },
  };

  it("compiles inverse identity/persona prompts when input is empty", () => {
    const { system, task } = render_ghostwriter({ entities, input: "" });
    expect(system).toContain('YOUR_IDENTITY name="Rafael Orion"');
    expect(system).toContain('USER_PERSONA name="Glitch"');
    expect(task).toContain("Draft a compelling");
  });

  it("compiles enhancement directive when draft input is provided", () => {
    const { system, task } = render_ghostwriter({ entities, input: "I step forward and grin." });
    expect(system).toContain('YOUR_IDENTITY name="Rafael Orion"');
    expect(task).toContain("I step forward and grin.");
    expect(task).toContain("Enhance");
  });
});
