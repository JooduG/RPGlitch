/**
 * Standard log function.
 * Only emits to console if 'dev_mode' is enabled in the app store.
 */
export const log = (...args) => {
  const is_dev = globalThis.app?.settings?.dev_mode;
  if (is_dev) {
    console.info("[Engine]", ...args);
  }
};

/**
 * Standard error function.
 * Always emits to console, but with the engine prefix.
 */
export const error = (...args) => {
  console.error("[Engine]", ...args);
};

// Legacy compatibility for legacy settings if needed,
// but we are decommissioning 'app-settings' table as per plan.
export const initDebugMode = async () => true;
export const setDebug = async (on) => {
  if (!globalThis.app) return;
  globalThis.app.settings.dev_mode = !!on;
  await globalThis.app.save_settings();
};
