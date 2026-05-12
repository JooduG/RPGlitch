import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resolve_px, resolve_ms, resolve_number, resolve_string } from "./dom.js";

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
    if (navigator.userAgent.includes("jsdom")) {
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
            transitionDuration: resolveMockValue(
              el.dataset?.resolveValue || style.transitionDuration,
              el,
            ),
            flexGrow: resolveMockValue(el.dataset?.resolveValue || style.flexGrow, el),
            fontFamily: resolveMockValue(el.dataset?.resolveValue || style.fontFamily, el),
          };

          // Ensure fontFamily is quoted if it resolved to a string with spaces or special chars
          if (
            mockStyle.fontFamily &&
            !mockStyle.fontFamily.startsWith('"') &&
            !mockStyle.fontFamily.startsWith("'")
          ) {
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
