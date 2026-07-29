/**
 * src/ui/utils/index.js
 * COMPONENTS ENTRY BARREL
 * Exposes components' and helpers' public APIs from a single folder gate.
 */

export * from "./ui-helpers.js";
export * from "./field-path.js";
export * from "./markdown.js";
export * from "./safe-html.js";
export * from "./context-menu.svelte.js";
export * from "./crypto.js";
export * from "./xml.js";
export * from "./stream-bridge.js";
export * from "./history.js";
export * from "./state-bridge.js";
export * from "./text.js";
export * from "./protocols.js";

// Legacy aliases (deprecated — prefer snake_case names above)
export { generate_uuid as generateUUID, generate_secure_seed as generateSecureSeed, pick_random as pickRandom } from "./crypto.js";
export { escape_xml as escapeXml } from "./xml.js";
