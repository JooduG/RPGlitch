import "fake-indexeddb/auto";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for structuredClone (required for Dexie.js in Node.js < 17)
if (!global.structuredClone) {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// [TEST MOCK] Mock Worker Source to prevent console warnings
global.RPGLITCH_WORKER_SOURCE = "/* Mock Worker */";
