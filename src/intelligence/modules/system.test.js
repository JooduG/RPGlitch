/**
 * src/intelligence/modules/system.test.js
 * ============================================================================
 * 🧪 SYSTEM PROMPT MODULE UNIT TESTS — Root Envelope, Roles & Stability Locks
 * ============================================================================
 *
 * Validates root <SYSTEM> XML envelope compilation:
 * 1. Role line formatting across all prompt roles (including SENSORY_CORTEX)
 * 2. Stability lock escalation rules based on structural errors
 * 3. Universal open-fragment <SYSTEM> envelope compilation (the Task is owned by the package)
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { SYSTEM_ROLES, resolve_system_role_line, resolve_stability_lock, render_system_xml, STABILITY_LOCK } from "./system.js";

// ============================================================================
// [SECTION 1: SYSTEM ROLES & RESOLUTION]
// ============================================================================

describe("SYSTEM_ROLES and resolve_system_role_line", () => {
  it("resolves role lines for all manifest roles", () => {
    expect(SYSTEM_ROLES.INTERACTION({ speaker_name: "Alice", listener_name: "Bob", fractal_name: "Neo-Tokyo" })).toBe(
      "You are Alice within FRACTAL Neo-Tokyo, interacting with Bob.",
    );
    expect(SYSTEM_ROLES.NPC({ speaker_name: "Guard", listener_name: "Bob", fractal_name: "Neo-Tokyo" })).toBe(
      "You are Guard, a supporting character within FRACTAL Neo-Tokyo, interacting with Bob.",
    );
    expect(SYSTEM_ROLES.NARRATOR({ speaker_name: "The Void" })).toBe("You are The Void, the Fractal itself, narrating the story.");
    expect(SYSTEM_ROLES.DIRECTOR()).toBe("You are the Director orchestrating simulation mechanics and staging.");
    expect(SYSTEM_ROLES.CONTINUUM_CARETAKER({ target_name: "Alice" })).toBe(
      'You are the Continuum Caretaker for target entity "Alice". Consolidate temporal state from recent events.',
    );
    expect(SYSTEM_ROLES.NARRATIVE_STRUCTURER()).toBe("You are the Narrative Structurer, extracting profile fragments from narrative prose.");
    expect(SYSTEM_ROLES.ENHANCER({ enhancer_name: "PHYSICAL" })).toBe("You are the PHYSICAL Profile Enhancer, refining target profile dimensions.");
    expect(SYSTEM_ROLES.SENSORY_CORTEX()).toBe("You are the Sensory Cortex synthesizing visual staging and descriptive optics.");
  });

  it("resolves case-insensitively with default fallback", () => {
    expect(resolve_system_role_line({ role: "director" })).toBe("You are the Director orchestrating simulation mechanics and staging.");
    expect(resolve_system_role_line({ role: "unknown_role", speaker_name: "X", listener_name: "Y", fractal_name: "Z" })).toBe(
      "You are X within FRACTAL Z, interacting with Y.",
    );
  });
});

// ============================================================================
// [SECTION 2: STABILITY LOCK RESOLUTION]
// ============================================================================

describe("resolve_stability_lock", () => {
  it("returns empty string when structural errors are zero or absent", () => {
    expect(resolve_stability_lock({})).toBe("");
    expect(resolve_stability_lock({ structural_errors: 0 })).toBe("");
    expect(resolve_stability_lock(null)).toBe("");
  });

  it("escalates to WARNING on 1-2 errors and CRITICAL on 3+ errors", () => {
    expect(resolve_stability_lock({ structural_errors: 1 })).toBe(STABILITY_LOCK.WARNING);
    expect(resolve_stability_lock({ structural_errors: 2 })).toBe(STABILITY_LOCK.WARNING);
    expect(resolve_stability_lock({ structural_errors: 3 })).toBe(STABILITY_LOCK.CRITICAL);
    expect(resolve_stability_lock({ structural_errors: 5 })).toBe(STABILITY_LOCK.CRITICAL);
  });
});

// ============================================================================
// [SECTION 3: UNIVERSAL SYSTEM XML ENVELOPE COMPILER]
// ============================================================================

describe("render_system_xml", () => {
  it("renders open <SYSTEM> envelope when closed is false", () => {
    const xml = render_system_xml({
      mode: "interaction",
      round: 1,
      children: ["<ROLE>You are Alice.</ROLE>"],
      closed: false,
    });

    expect(xml).toContain('<SYSTEM round="1" mode="interaction">');
    expect(xml).toContain("<ROLE>You are Alice.</ROLE>");
    expect(xml).not.toContain("</SYSTEM>");
  });

  it("renders closed <SYSTEM> envelope when closed is true", () => {
    const xml = render_system_xml({
      mode: "director",
      round: 3,
      children: ["<CORE_PROTOCOLS>Rules</CORE_PROTOCOLS>"],
      closed: true,
    });

    expect(xml).toContain('<SYSTEM round="3" mode="director">');
    expect(xml).toContain("<CORE_PROTOCOLS>Rules</CORE_PROTOCOLS>");
    expect(xml).toContain("</SYSTEM>");
  });

  it("keeps the Task out of the system envelope (the package owns it)", () => {
    const xml = render_system_xml({
      mode: "story",
      round: 2,
      children: ["<ROLE>Role content</ROLE>"],
      task: "<TASK>\n  Execute scene beat.\n</TASK>",
    });

    expect(xml).toContain('<SYSTEM round="2" mode="story">');
    expect(xml).toContain("<ROLE>Role content</ROLE>");
    expect(xml).not.toContain("<TASK>");
    expect(xml).not.toContain("</SYSTEM>");
  });
});

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-20: Retargeted the envelope test to the open-fragment contract — `render_system_xml` no longer nests a `<TASK>` and never auto-closes; the Task is owned by the package and closed by transport.
 * - 2026-09-18: Initial creation of comprehensive system.test.js covering SYSTEM_ROLES (including SENSORY_CORTEX), stability locks, and clean nested <TASK> envelope compilation.
 */
