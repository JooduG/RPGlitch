/**
 * src/intelligence/physics.js — Track 1.1 compatibility shim (P4: thin re-export).
 * Canonical module is ./dynamics.js. This file exists so external deep imports
 * keep resolving; all logic lives in dynamics.js.
 */
export * from "./dynamics.js";
