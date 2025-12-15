/**
 * Mock DOMPurify for Jest tests
 *
 * In the browser, DOMPurify is loaded from the vendored library.
 * For tests, we provide a simple pass-through implementation.
 */

export default {
  sanitize: (input) => {
    // Simple sanitization for tests - just return the input as-is
    // In production, DOMPurify would actually sanitize HTML
    return typeof input === "string" ? input : "";
  },
};
