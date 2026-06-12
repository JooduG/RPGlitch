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
