/**
 * Standard log function.
 * Only emits to console if 'dev_mode' is enabled in the app store.
 */
/**
 * @param {...any} args
 */
export const log = (...args) => {
  const is_dev = /** @type {any} */ (globalThis).app?.settings?.dev_mode;
  if (is_dev) {
    console.info("[Engine]", ...args);
  }
};

/**
 * Standard error function.
 * Always emits to console, but with the engine prefix.
 * @param {...any} args
 */
export const error = (...args) => {
  console.error("[Engine]", ...args);
};

// Legacy compatibility for legacy settings if needed,
// but we are decommissioning 'app-settings' table as per plan.
export const initDebugMode = async () => true;

/**
 * @param {any} on
 */
export const setDebug = async (on) => {
  const app = /** @type {any} */ (globalThis).app;
  if (!app?.settings) return;
  app.settings.dev_mode = !!on;
  await app.save_settings();
};
