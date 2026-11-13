/**
 * .agents/skills/simulation/scripts/triage-prompt-shim.js
 * 📐 TRIAGE SHIM (deprecated) - canonical home is scripts/lib/triage.js.
 */
export { assess_technical_density, calculate_complexity_score, resolve_tier, triage_prompt } from "./lib/triage.js";
import { triage_prompt } from "./lib/triage.js";

if (process.argv[1] && process.argv[1].endsWith("triage-prompt.js")) {
  const input_prompt = process.argv.slice(2).join(" ");
  if (!input_prompt) {
    console.log("Usage: node .agents/skills/simulation/scripts/triage-prompt.js <prompt-text>");
    process.exit(0);
  }
  const result = triage_prompt(input_prompt);
  console.log("--------------------------------------------------------------------------------");
  console.log("📐 PROMPT COMPLEXITY TRIAGE REPORT");
  console.log("--------------------------------------------------------------------------------");
  console.log(result.summary);
  console.log(`- Tier Name:   ${result.tier_name}`);
  console.log(`- Total Score: ${result.total_score}/10`);
  console.log(`- R1 Risk:     ${result.risk.r1_technical_density}`);
  console.log("--------------------------------------------------------------------------------");
}
