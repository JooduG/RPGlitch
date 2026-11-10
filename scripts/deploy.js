/**
 * scripts/deploy.js
 * 🚀 LOCAL DEPLOY SHIM — resolves the Perchance vault deploy script without
 * hardcoding a machine-specific absolute path.
 *
 * Resolution order:
 *   1. $PERCHANCE_DEPLOY_SCRIPT (absolute path to the perchance-plugin deploy.js)
 *   2. ./scripts/deploy.js is THIS file — fails with guidance when unset.
 *
 * Set it per-machine (never in the repo):
 *   export PERCHANCE_DEPLOY_SCRIPT="$HOME/.gemini/config/plugins/perchance-plugin/scripts/deploy.js"
 */

import { spawnSync } from "child_process";
import fs from "fs";

const target = process.env.PERCHANCE_DEPLOY_SCRIPT;
if (!target) {
  console.error(
    "[deploy] PERCHANCE_DEPLOY_SCRIPT is not set. Export it to your perchance-plugin deploy.js, e.g.:\n" +
      '  export PERCHANCE_DEPLOY_SCRIPT="$HOME/.gemini/config/plugins/perchance-plugin/scripts/deploy.js"',
  );
  process.exit(1);
}
if (!fs.existsSync(target)) {
  console.error(`[deploy] PERCHANCE_DEPLOY_SCRIPT points nowhere: ${target}`);
  process.exit(1);
}
const result = spawnSync("node", [target, ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(result.status ?? 0);

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Created — replaces the hardcoded C:/Users/johng/... deploy:auto path in package.json.
 */
