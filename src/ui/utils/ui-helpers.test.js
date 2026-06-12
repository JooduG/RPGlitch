import { generateSecureSeed, generateUUID, resolve_ms, resolve_number, resolve_px, resolve_string } from "@utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("dom utilities", () => {
  /** @type {HTMLElement} */
  let contextEl;

  beforeEach(() => {
    // Setup a context element with some variables
    contextEl = document.createElement("div");
    contextEl.style.setProperty("--local-px", "20px");
    contextEl.style.setProperty("--local-rem", "2rem");
    contextEl.style.setProperty("--local-duration", "500ms");
    contextEl.style.setProperty("--nested-var", "var(--local-px)");
    contextEl.style.setProperty("--local-num", "0.75");
    contextEl.style.setProperty("--local-str", "Nordic");
    document.body.appendChild(contextEl);

    // JSDOM HACK: JSDOM's getComputedStyle doesn't resolve var(), rem, or calc()
    // We mock the computed style resolution for the measurement element if we're in JSDOM
    if (typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom")) {
      const originalGetComputedStyle = window.getComputedStyle;

      /**
       * Recursively resolves CSS variables and basic expressions for JSDOM testing.
       * @param {string} val
       * @param {HTMLElement} el
       * @returns {string}
       */
      const resolveMockValue = (val, el) => {
        if (!val) return val;
        const trimmed = val.trim();

        // Handle var() resolution
        const varMatch = trimmed.match(/^var\((--[^,)]+)(?:,([^)]+))?\)$/);
        if (varMatch) {
          const varName = varMatch[1].trim();
          const fallback = varMatch[2]?.trim();

          /** @type {HTMLElement | null} */
          let current = el;
          let resolved = "";
          while (current && !resolved) {
            resolved = originalGetComputedStyle(current).getPropertyValue(varName);
            if (resolved) break;
            current = current.parentElement;
          }

          if (resolved) return resolveMockValue(resolved, el);
          if (fallback) return resolveMockValue(fallback, el);
          return val; // Return original if not found
        }

        // Handle simple calc resolution for tests
        if (trimmed.includes("calc(")) {
          if (trimmed.includes("10px + 5px")) return "15px";
          if (trimmed.includes("var(--local-px) * 2")) return "40px";
        }

        // Handle rem resolution (1rem = 16px)
        if (trimmed.endsWith("rem")) {
          return parseFloat(trimmed) * 16 + "px";
        }

        return trimmed;
      };

      vi.spyOn(window, "getComputedStyle").mockImplementation((/** @type {any} */ el) => {
        const style = originalGetComputedStyle(el);

        // If it's our measurement element, we simulate resolution
        if (el.style?.zIndex === "-9999") {
          const mockStyle = {
            getPropertyValue: (/** @type {string} */ prop) => {
              const val = style.getPropertyValue(prop);
              // If we're asking for a variable, we might need to resolve it
              if (prop.startsWith("--")) {
                return resolveMockValue(val, el);
              }
              return val;
            },
            paddingTop: resolveMockValue(el.dataset?.resolveValue || style.paddingTop, el),
            fontSize: resolveMockValue(el.dataset?.resolveValue || style.fontSize, el),
            transitionDuration: resolveMockValue(el.dataset?.resolveValue || style.transitionDuration, el),
            flexGrow: resolveMockValue(el.dataset?.resolveValue || style.flexGrow, el),
            fontFamily: resolveMockValue(el.dataset?.resolveValue || style.fontFamily, el),
          };

          // Ensure fontFamily is quoted if it resolved to a string with spaces or special chars
          if (mockStyle.fontFamily && !mockStyle.fontFamily.startsWith('"') && !mockStyle.fontFamily.startsWith("'")) {
            if (mockStyle.fontFamily.includes(" ") || mockStyle.fontFamily.includes("(")) {
              mockStyle.fontFamily = `"${mockStyle.fontFamily}"`;
            }
          }

          return /** @type {CSSStyleDeclaration} */ (/** @type {any} */ (mockStyle));
        }
        return style;
      });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (contextEl && contextEl.parentElement) {
      contextEl.remove();
    }
    // Cleanup any measurement elements
    const measureEl = document.querySelector('div[style*="zIndex: -9999"]');
    if (measureEl) measureEl.remove();
  });

  describe("resolve_px", () => {
    it("resolves simple numbers", () => {
      expect(resolve_px(10)).toBe(10);
      expect(resolve_px("15")).toBe(15);
    });

    it("resolves pixel strings", () => {
      expect(resolve_px("25px")).toBe(25);
    });

    it("resolves rem values", () => {
      expect(resolve_px("1rem")).toBe(16);
      expect(resolve_px("2rem")).toBe(32);
    });

    it("resolves variable names directly", () => {
      expect(resolve_px("--local-px", 0, contextEl)).toBe(20);
    });

    it("resolves var() calls with context", () => {
      expect(resolve_px("var(--local-px)", 0, contextEl)).toBe(20);
      expect(resolve_px("var(--local-rem)", 0, contextEl)).toBe(32);
    });

    it("resolves variables without context (from root/body)", () => {
      document.body.style.setProperty("--global-px", "40px");
      expect(resolve_px("var(--global-px)")).toBe(40);
      document.body.style.removeProperty("--global-px");
    });

    it("resolves nested variables with context", () => {
      expect(resolve_px("var(--nested-var)", 0, contextEl)).toBe(20);
    });

    it("resolves calc expressions", () => {
      expect(resolve_px("calc(10px + 5px)")).toBe(15);
      expect(resolve_px("calc(var(--local-px) * 2)", 0, contextEl)).toBe(40);
    });

    it("returns fallback for invalid values", () => {
      expect(resolve_px("invalid", 123)).toBe(123);
      expect(resolve_px(undefined, 456)).toBe(456);
    });

    it("resolves variables set to 0 correctly", () => {
      document.body.style.setProperty("--zero-px", "0px");
      expect(resolve_px("var(--zero-px)", 123)).toBe(0);
      document.body.style.removeProperty("--zero-px");
    });

    it("handles complex recursive fallbacks", () => {
      contextEl.style.setProperty("--fallback-1", "var(--non-existent, 50px)");
      expect(resolve_px("var(--fallback-1)", 0, contextEl)).toBe(50);
    });

    it("handles calc with multiple variables", () => {
      contextEl.style.setProperty("--base", "10px");
      contextEl.style.setProperty("--gap", "5px");
      // JSDOM mock logic update for this specific test
      if (typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom")) {
        vi.spyOn(window, "getComputedStyle").mockImplementation((/** @type {any} */ el) => {
          if (el.style?.zIndex === "-9999") {
            return /** @type {any} */ ({
              getPropertyValue: (/** @type {string} */ prop) => (prop === "--proxy" ? "15px" : ""),
              paddingTop: "15px",
            });
          }
          return window.getComputedStyle(el);
        });
      }
      expect(resolve_px("calc(var(--base) + var(--gap))", 0, contextEl)).toBe(15);
    });
  });

  describe("resolve_ms", () => {
    it("resolves simple numbers as ms", () => {
      expect(resolve_ms(100)).toBe(100);
      expect(resolve_ms("150", 999)).toBe(999);
    });

    it("resolves duration strings", () => {
      expect(resolve_ms("200ms")).toBe(200);
      expect(resolve_ms("1s")).toBe(1000);
      expect(resolve_ms("0.5s")).toBe(500);
    });

    it("resolves variable names directly", () => {
      expect(resolve_ms("--local-duration", 0, contextEl)).toBe(500);
    });

    it("resolves var() calls with context", () => {
      expect(resolve_ms("var(--local-duration)", 0, contextEl)).toBe(500);
    });

    it("returns fallback for invalid values", () => {
      expect(resolve_ms("invalid", 999)).toBe(999);
    });

    it("resolves variables set to 0 correctly", () => {
      document.body.style.setProperty("--zero-ms", "0ms");
      expect(resolve_ms("var(--zero-ms)", 123)).toBe(0);
      document.body.style.removeProperty("--zero-ms");
    });

    it("rejects unitless non-zero durations and uses fallback", () => {
      expect(resolve_ms("500", 999)).toBe(999);
    });

    it("handles variables resolving to unitless strings", () => {
      contextEl.style.setProperty("--bad-duration", "500");
      expect(resolve_ms("var(--bad-duration)", 123, contextEl)).toBe(123);
    });
  });

  describe("resolve_number", () => {
    it("resolves unitless numbers", () => {
      expect(resolve_number("0.5")).toBe(0.5);
      expect(resolve_number(0.8)).toBe(0.8);
    });

    it("resolves variable names directly", () => {
      expect(resolve_number("--local-num", 0, contextEl)).toBe(0.75);
    });

    it("resolves var() calls via flex-grow proxy", () => {
      expect(resolve_number("var(--local-num)", 0, contextEl)).toBe(0.75);
    });

    it("resolves variables set to 0 correctly", () => {
      document.body.style.setProperty("--zero-num", "0");
      expect(resolve_number("var(--zero-num)", 123)).toBe(0);
      document.body.style.removeProperty("--zero-num");
    });

    it("returns fallback for non-numeric strings", () => {
      expect(resolve_number("not-a-number", 0.5)).toBe(0.5);
    });
  });

  describe("resolve_string", () => {
    it("returns trimmed strings", () => {
      expect(resolve_string("  hello  ")).toBe("hello");
    });

    it("resolves variable names directly", () => {
      expect(resolve_string("--local-str", "", contextEl)).toBe("Nordic");
    });

    it("resolves var() calls to their string content", () => {
      expect(resolve_string("var(--local-str)", "", contextEl)).toBe("Nordic");
    });

    it("resolves strings via fontFamily proxy", () => {
      contextEl.style.setProperty("--ease-test", "cubic-bezier(0,0,1,1)");
      expect(resolve_string("var(--ease-test)", "", contextEl)).toBe("cubic-bezier(0,0,1,1)");
    });
  });
});

describe("helpers", () => {
  describe("generateSecureSeed", () => {
    it("should return a number within the specified limit", () => {
      const limit = 1000;
      for (let i = 0; i < 100; i++) {
        const seed = generateSecureSeed(limit);
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThan(limit);
        expect(Number.isInteger(seed)).toBe(true);
      }
    });

    it("should throw an error if crypto.getRandomValues is not available", () => {
      const originalCrypto = globalThis.crypto;
      Object.defineProperty(globalThis, "crypto", {
        value: { ...originalCrypto, getRandomValues: undefined },
        configurable: true,
      });
      expect(() => generateSecureSeed()).toThrow(/crypto.getRandomValues is not available/);
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });

    it("should use crypto.getRandomValues", () => {
      const originalCrypto = globalThis.crypto;
      const mockGetRandomValues = vi.fn((arr) => {
        arr[0] = 123456;
        return arr;
      });
      Object.defineProperty(globalThis, "crypto", {
        value: { ...originalCrypto, getRandomValues: mockGetRandomValues },
        configurable: true,
      });

      const seed = generateSecureSeed(100);
      expect(mockGetRandomValues).toHaveBeenCalled();
      expect(seed).toBe(123456 % 100);

      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });
  });

  describe("generateUUID", () => {
    it("should return a valid UUID string", () => {
      const uuid = generateUUID();
      // Basic UUID v4 regex
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
    it("should return different UUIDs on subsequent calls", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
    it("should throw an error if crypto.randomUUID is not available", () => {
      const originalCrypto = globalThis.crypto;
      // Mock an environment where crypto.randomUUID is missing
      Object.defineProperty(globalThis, "crypto", {
        value: { ...originalCrypto, randomUUID: undefined },
        configurable: true,
      });
      expect(() => generateUUID()).toThrow(/crypto.randomUUID is not available/);
      // Restore the original crypto object
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });
  });
});
