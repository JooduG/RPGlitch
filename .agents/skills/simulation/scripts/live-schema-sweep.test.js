import fs from "fs";
import { describe, it, expect } from "vitest";
import { register_state_accessors } from "../../../../src/utils/index.js";
import { run_sweep } from "./live-schema-sweep.js";

describe("live schema sweep", () => {
  it("compiles all modes across trigger fixtures and writes the live schema report", async () => {
    register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
    try {
      const seed = Number(process.env.SWEEP_SEED || 7);
      const result = run_sweep({ seed });
      fs.mkdirSync("tmp", { recursive: true });
      fs.writeFileSync("tmp/live-schema-report.md", result.markdown);
      console.log(
        `sweep: seed=${seed} compiles=${result.stats.compiles} tags=${result.stats.tagsObserved} conditional=${result.stats.conditionalTags} dataKeys=${result.stats.dataKeys}`,
      );
      expect(result.problems).toEqual([]);
      expect(result.stats.tagsObserved).toBeGreaterThan(100);
    } finally {
      register_state_accessors({ runtime: null });
    }
  });
});
