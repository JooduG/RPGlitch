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
