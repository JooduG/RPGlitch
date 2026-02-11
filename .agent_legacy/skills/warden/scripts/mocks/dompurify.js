/**
 * Mock DOMPurify for Vitest tests
 *
 * Implements basic sanitization logic required by unit tests.
 */

export default {
  sanitize: (input) => {
    if (typeof input !== "string") return String(input ?? "");
    let sanitized = input;
    // Remove script tags
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );
    // Remove inline event handlers
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, "");
    sanitized = sanitized.replace(/on\w+='[^']*'/gi, "");
    sanitized = sanitized.replace(/on\w+=[\S\s]+/gi, "");
    return sanitized;
  },
  addHook: () => {},
};
