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
if (typeof window !== "undefined") {
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
