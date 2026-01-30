import "fake-indexeddb/auto"
import { TextEncoder, TextDecoder } from "util"

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill for structuredClone (required for Dexie.js in Node.js < 17)
if (!global.structuredClone) {
    global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj))
}

// [TEST MOCK] Mock Worker Source to prevent console warnings
global.RPGLITCH_WORKER_SOURCE = "/* Mock Worker */"
if (typeof window !== "undefined") {
    window.RPGLITCH_WORKER_SOURCE = "/* Mock Worker */"
}

// Mock URL.createObjectURL for WorkerBridge
if (typeof URL.createObjectURL === "undefined") {
    URL.createObjectURL = () => "mock-blob-url"
}

// Mock Worker
if (typeof Worker === "undefined") {
    global.Worker = class Worker {
        constructor(stringUrl) {
            this.url = stringUrl
            this.onmessage = () => {}
            this.postMessage = () => {}
        }
    }
}

// Mock Dexie Globally (for core-db.js ESM compliance)
// Mock Dexie Globally (for core-db.js ESM compliance)
if (typeof global.Dexie === "undefined") {
    const Dexie = require("dexie").default || require("dexie")
    global.Dexie = Dexie
}

// [TEST MOCK] Svelte 5 Runes Polyfill for Jest
// Since Jest runs in a Node/JSDOM environment without the Svelte compiler transforms,
// we need to globally define these "Runes" so they don't throw ReferenceErrors.
// This is a naive mock sufficient for unit tests.
if (typeof global.$state === "undefined") {
    global.$state = (initial) => initial // Pass-through for simple values
    // Minimal proxy support could be added if tests demand it, but identity is safer for now.
}
if (typeof global.$derived === "undefined") {
    global.$derived = (fn) => (typeof fn === "function" ? fn() : fn) // Evaluate immediately
}
if (typeof global.$effect === "undefined") {
    global.$effect = () => {} // No-op
}
if (typeof global.$props === "undefined") {
    global.$props = () => ({}) // Return empty object
}
if (typeof global.$bindable === "undefined") {
    global.$bindable = (initial) => initial // Pass-through
}
if (typeof global.$inspect === "undefined") {
    global.$inspect = () => {} // No-op
}
