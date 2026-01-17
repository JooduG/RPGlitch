/**
 * Mock DOMPurify for Jest tests
 *
 * Implements basic sanitization logic required by unit tests.
 */

module.exports = {
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
    sanitized = sanitized.replace(/on\w+=[^\s>]+/gi, "");
    return sanitized;
  },
  addHook: () => {},
};
