/**
 * @file tests/setup.js
 * 🧪 TEST SETUP  —  Browser Environment Mocking
 *
 * This file configures the global test environment. It provides mocks for
 * browser-native APIs like `window.ai` that are present on Perchance but
 * missing in Node/JSDOM.
 */

import { vi } from "vitest";
import { execute_jules } from "../../swarm/scripts/jules-provider.js";

// Ensure window.ai exists to prevent reference errors in purified simulation code.
// In development, we bridge it to our Node.js provider.
// Mock ResizeObserver for bits-ui primitives in JSDOM
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock document for bits-ui primitives in JSDOM environments where document might not be immediately available
if (typeof globalThis.document === "undefined") {
  const createSafeMock = () => {
    const target = () => {};
    return new Proxy(target, {
      get: (t, prop) => {
        if (prop === "style") {
          return new Proxy({}, {
            get: (styleTarget, styleProp) => {
              if (typeof styleTarget[styleProp] === "function") {
                return styleTarget[styleProp].bind(styleTarget);
              }
              return styleTarget[styleProp] || (() => {});
            }
          });
        }
        return createSafeMock();
      },
      set: () => true,
    });
  };
  globalThis.document = createSafeMock();
}

if (typeof window !== "undefined") {
  // Mock matchMedia for Svelte 5 media query runes
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  // Mock Element.animate for Svelte transitions in JSDOM
  if (typeof Element !== "undefined" && !Element.prototype.animate) {
    Element.prototype.animate = vi.fn().mockReturnValue({
      finished: Promise.resolve(),
      cancel: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      reverse: vi.fn(),
      onfinish: null,
      oncancel: null,
    });
  }

  // Mock HTMLDialogElement for JSDOM
  if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = vi.fn(function () {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function () {
      this.open = false;
    });
  }

  window.ai = vi.fn(async (instruction, options = {}) => {
    // Adapter: convert Perchance-style window.ai call to our Jules provider
    // Note: This only runs during tests.
    return execute_jules({ system: instruction }, options);
  });
}

/**
 * [HELPER] Mock LLM Success
 * Use this in tests to override the provider and simulate a specific response.
 */
export const mock_llm_success = (text) => {
  if (window.ai) {
    vi.mocked(window.ai).mockResolvedValue(text);
  }
};

// --- CLEANUP & TEARDOWN --- //
import { afterAll } from "vitest";

afterAll(async () => {
  try {
    // Dynamically import to avoid breaking test environments that don't need it
    const { db } = await import("../../../../src/data/db.js");
    if (db && typeof db.close === "function") {
      db.close();
    }
  } catch {
    // Ignore if db.js is unresolvable or fails to load during teardown
  }
});
