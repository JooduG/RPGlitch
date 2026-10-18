/**
 * @file simulation-audit.test.js
 * 📊 THE DASHBOARD: High-Fidelity Simulation & Schema Verification Reporter.
 *
 * NOTE: This script is executed via Vitest to handle Svelte/ESM/Rune dependencies.
 * Run with: npx vitest run .agents/skills/simulation/scripts/simulation-audit.test.js
 */

import fs from "fs";
import { describe, it, expect } from "vitest";
import { SimulationAudit } from "./simulation-audit.js";

describe("🕹️ SYSTEM TURN: Source Audit & Pipeline Verification", () => {
  let baseline_result = null;

  it("executes the 'Gothic Trial' baseline and generates an audit report", async () => {
    const scenario = {
      ai_id: "silvers",
      user_id: "julien",
      fractal_id: "ashenweald",
      history: [
        {
          role: "model",
          content: "You stumble through the ash, little bird. Do you seek sanctuary or a cage?",
          character_name: "Lord Valerius",
        },
      ],
    };

    const input = "I offer no resistance, only a silent plea for protection from the dark.";

    console.log("🚀 [AUDIT] Launching SimulationAudit...");
    const result = await SimulationAudit.execute_turn(input, scenario);
    baseline_result = result;

    // 5. VERIFICATION — Prompts are generated
    expect(result.director_prompt).toBeDefined();
    expect(result.character_prompt).toBeDefined();
  });

  it("Character prompt builds delivery posture and think format in task", async () => {
    const scenario = {
      ai_id: "silvers",
      user_id: "julien",
      fractal_id: "ashenweald",
      history: [],
    };

    const result = await SimulationAudit.execute_turn("Test input", scenario);

    expect(result.character_prompt).toContain("<DELIVERY_POSTURE>");
    expect(result.character_prompt).toContain("<THINK>");
    expect(result.character_prompt).toMatch(/<ACTION round="\d+" origin="(?:julien|JULIEN)"/);
  });

  it("Pipeline verification passes all critical checks", async () => {
    const scenario = {
      ai_id: "silvers",
      user_id: "julien",
      fractal_id: "ashenweald",
      history: [],
    };

    const result = await SimulationAudit.execute_turn("Test input", scenario);

    expect(result.verification).toBeDefined();
    expect(result.verification.passed).toContain("character:system_has_AXIOMATIC_CONSTITUTION");
    expect(result.verification.passed).toContain("character:system_has_CORE_PROTOCOLS");
    expect(result.verification.passed).toContain("character:system_has_ENTITIES");
    expect(result.verification.passed).toContain("director:task_has_dynamics_deltas");
    if (result.verification.failed.length > 0) {
      console.log("FAILED IN TEST 3:", result.verification.failed);
    }
    expect(result.verification.failed.length).toBe(0);
  });

  it("passes raw_messages for Director AI_LAST_TURN block", async () => {
    const scenario = {
      ai_id: "valerius",
      user_id: "caelum",
      fractal_id: "ashenweald",
      history: [{ role: "model", content: "The vampire lord smiles coldly.", character_name: "Lord Valerius" }],
    };

    const result = await SimulationAudit.execute_turn("I submit.", scenario);

    expect(result.director_prompt).toContain('<ACTION round="0" origin="AI">');
    expect(result.director_prompt).toContain('<ACTION round="1" origin="USER">');
    expect(result.director_prompt).toContain("The vampire lord smiles coldly.");
  });

  it("compiles all modes across trigger fixtures and writes the unified audit report", async () => {
    const { register_state_accessors } = await import("../../../../src/utils/index.js");

    register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
    try {
      const seed = Number(process.env.SWEEP_SEED || 7);
      const sweep_result = SimulationAudit.run_schema_sweep({ seed });

      console.log(
        `sweep: seed=${seed} compiles=${sweep_result.stats.compiles} tags=${sweep_result.stats.tagsObserved} conditional=${sweep_result.stats.conditionalTags} dataKeys=${sweep_result.stats.dataKeys}`,
      );
      expect(sweep_result.problems).toEqual([]);
      expect(sweep_result.stats.tagsObserved).toBeGreaterThan(100);

      // Synthesize unified report combining single-turn baseline & combinatorial schema sweep
      const SEP = "────────────────────────────────────────────────────────────────────────────────";
      const timestamp = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" }).replace(/T/, " ");

      const turn =
        baseline_result ||
        (await SimulationAudit.execute_turn("I offer no resistance.", { ai_id: "silvers", user_id: "julien", fractal_id: "ashenweald" }));

      const verificationSummary =
        turn.verification.failed.length === 0
          ? `✅ All ${turn.verification.passed.length} pipeline checks passed`
          : `⚠️ ${turn.verification.passed.length} passed, ${turn.verification.failed.length} failed:\n${turn.verification.failed.map((f) => `   - ${f}`).join("\n")}`;

      const report = `# 📊 Unified Simulation Audit & Schema Report

**Timestamp:** \`${timestamp}\`
**Round:** \`${turn.payload.round}\`
**Sweep Compiles:** \`${sweep_result.stats.compiles}\` across all prompt modes

${SEP}

## PART I: ACTIVE TURN VERIFICATION (Gothic Baseline)

- **Input:** "${turn.payload.input || "I offer no resistance, only a silent plea for protection from the dark."}"
- **Scenario:** Gothic Baseline (Silvers / Julien / Ashenweald)
- **Entities Loaded:** ${Object.keys(turn.payload.entities).join(", ")}

### Pipeline Verification Checklist

${verificationSummary}

**Passed Checks:**
${turn.verification.passed.map((c) => `- [x] ${c}`).join("\n")}

${turn.verification.failed.length > 0 ? "**Failed Checks:**\n" + turn.verification.failed.map((c) => `- [ ] ${c}`).join("\n") + "\n\n" : ""}### Director Prompt (Shot 1 Sample)

\`\`\`xml
${turn.director_prompt}
\`\`\`

### Character Prompt (Shot 2 Sample)

\`\`\`xml
${turn.character_prompt}
\`\`\`

${SEP}

## PART II: COMBINATORIAL LIVE SCHEMA SWEEP

${sweep_result.markdown}

${SEP}

> [!NOTE]
> This unified audit was generated by the **SimulationAudit** drivetrain.
> All dynamics and flags are derived from Rule 02 and Rule 03 physics boundaries.
> Prompts are compiled closed envelopes where task layers are sealed inside \`<SYSTEM>\`.
> Pipeline verification covers: \`<DYNAMIC_AXES>\`, \`<ENTITIES>\`, \`<AXIOMATIC_CONSTITUTION>\`,
> \`<CORE_PROTOCOLS>\`, \`<CURRENTS>\`, \`<DELIVERY_POSTURE>\`, \`<THINK>\`, and prefix-cache separation.
`;

      const clean_report = report.replace(/\n{3,}/g, "\n\n");
      fs.mkdirSync("tmp", { recursive: true });
      fs.writeFileSync("tmp/simulation-audit-report.md", clean_report);
      console.log("✅ Unified simulation audit report synthesized: tmp/simulation-audit-report.md");
    } finally {
      register_state_accessors({ runtime: null });
    }
  });
});

// =============================================================================
// CHANGELOG
// =============================================================================

/**
 * CHANGELOG:
 * - 2026-10-18: Consolidated live-schema-sweep and simulation-audit into a single unified reporter emitting 'tmp/simulation-audit-report.md'.
 * - 2026-10-16: Consolidated schema sweep — Absorbed live schema sweep test suite directly into simulation-audit.test.js under a unified audit:simulation command.
 * - 2026-10-15: Retired prompt-schema-map.js in favor of live-schema-sweep.js; pruned import and report generation wire.
 * - 2026-10-14: Comprehensive XML Tag Specification Map & Lint Fixes.
 * - 2026-09-18: Standardized verification checks to match scrobbles.md blueprint (<ENTITIES>, <CORE_PROTOCOLS>).
 */
