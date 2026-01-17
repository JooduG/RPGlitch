import DOMPurify from "dompurify";

/**
 * WARDEN: SECURITY & PHYSICS
 * The protector of the simulation.
 */

// 1. Sanitize HTML (Zero-Trust)
export const sanitize = (dirty) => {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: false }); // String output
};

// 2. Escape Logic
export const escape = (str) => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// Stub for now, can be expanded
export const checkRefusal = (text) => false;
export const clean = (text) => (text ? text.trim() : "");

// Facade
export const Security = {
  sanitize,
  escape,
  checkRefusal,
  clean,
};

// Re-export Physics if needed, assuming physics engine is elsewhere or we use this file as aggregator
// For now, index.js usually aggregates.
// Old index.js imported from ./logic/security.js. Now we implement directly here or export from here.

export default {
  Security,
};

// Re-export Physics logic for the Facade
import { applyLaws } from "./logic/physics.js";
import { parsePhysicsResponse } from "./logic/parser.js";

export const Warden = {
  sanitize,
  escape,
  authorizeVisuals: (prompt, options) => true,
  applyLaws,
  parse: parsePhysicsResponse,
};
