// This file contains utility functions shared across the ImageGlitch app.

/**
 * Safely decodes a URI component, returning the original string on error.
 * @param {string} str The string to decode.
 * @returns {string} The decoded string or the original string if decoding fails.
 */
export function safeDecodeURIComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    console.error("Failed to decode URI component:", str, e);
    return str;
  }
}
