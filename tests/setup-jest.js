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
if (typeof window !== "undefined") {
  window.RPGLITCH_WORKER_SOURCE = "/* Mock Worker */";
}

// Mock URL.createObjectURL for WorkerBridge
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = () => "mock-blob-url";
}

// Mock Worker
if (typeof Worker === "undefined") {
  global.Worker = class Worker {
    constructor(stringUrl) {
      this.url = stringUrl;
      this.onmessage = () => {};
      this.postMessage = () => {};
    }
  };
}
