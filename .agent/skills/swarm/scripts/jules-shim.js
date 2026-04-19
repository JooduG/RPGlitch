/**
 * @file src/core/intelligence/jules-shim.js
 * 🔌 JULES SDK SHIM  —  Browser Safety Layer
 *
 * PURPOSE:
 * Satisfies Vite's resolution for @google/jules-sdk in browser builds.
 * This SDK relies on Node.js built-ins (fs, path, etc.) which are unavailable
 * in the Perchance sandbox.
 */

export const jules = {
  /**
   * Dummy session creator to prevent runtime crashes during import.
   * Will throw if actually called in a browser context.
   */
  session: async () => {
    throw new Error(
      "Jules SDK is a Node-only dependency and is unavailable in the browser. " +
        "Ensure window.ai is used for client-side generation.",
    );
  },
};
