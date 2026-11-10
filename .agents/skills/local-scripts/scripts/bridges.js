/**
 * .agents/skills/local-scripts/scripts/bridges-shim.js
 * 🌉 BRIDGE ENTRY SHIM (deprecated) — split into proxy.js + deepwiki-bridge.js.
 */

export { proxy_global_tool, GLOBAL_TOOL_PATHS } from "./proxy.js";
export { start_deepwiki_bridge } from "./deepwiki-bridge.js";
import { proxy_global_tool } from "./proxy.js";
import { start_deepwiki_bridge } from "./deepwiki-bridge.js";

const command_line_arguments = process.argv.slice(2);

if (command_line_arguments.length === 0) {
  console.error(
    "Usage: node bridges.js <deepwiki | summarize | knowledge | ingest-web | sync-backlog | forge-skill> [args...] (deprecated — use proxy.js / deepwiki-bridge.js)",
  );
  process.exit(1);
}

const requested_operation = command_line_arguments[0];
const operation_arguments = command_line_arguments.slice(1);

if (requested_operation === "deepwiki" || requested_operation === "deepwiki-bridge") {
  start_deepwiki_bridge();
} else {
  await proxy_global_tool(requested_operation, operation_arguments);
}

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Split into proxy.js (global tools) + deepwiki-bridge.js (archived SSE bridge).
 */
