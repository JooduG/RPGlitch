import { guarded_transition, resolve_ms, resolve_number, resolve_px, resolve_string } from "@utils";
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
      const original_get_computed_style = window.getComputedStyle;

      /**
       * Recursively resolves CSS variables and basic expressions for JSDOM testing.
       * @param {string} val
       * @param {HTMLElement} el
       * @returns {string}
       */
      const resolve_mock_value = (val, el) => {
        if (!val) return val;
        const trimmed = val.trim();

        // Handle var() resolution
        const var_match = trimmed.match(/^var\((--[^,)]+)(?:,([^)]+))?\)$/);
        if (var_match) {
          const var_name = var_match[1].trim();
          const fallback = var_match[2]?.trim();

          /** @type {HTMLElement | null} */
          let current = el;
          let resolved = "";
          while (current && !resolved) {
            resolved = original_get_computed_style(current).getPropertyValue(var_name);
            if (resolved) break;
            current = current.parentElement;
          }

          if (resolved) return resolve_mock_value(resolved, el);
          if (fallback) return resolve_mock_value(fallback, el);
          return val; // Return original if not found
        }

        // Handle simple calc resolution for tests
        if (trimmed.includes("calc(")) {
          if (trimmed.includes("10px + 5px")) return "15px";
          if (trimmed.includes("var(--local-px) * 2")) return "40px";
          if (trimmed.includes("var(--base) + var(--gap)")) return "15px";
        }

        // Handle rem resolution (1rem = 16px)
        if (trimmed.endsWith("rem")) {
          return parseFloat(trimmed) * 16 + "px";
        }

        return trimmed;
      };

      vi.spyOn(window, "getComputedStyle").mockImplementation((/** @type {any} */ el) => {
        const style = original_get_computed_style(el);

        // If it's our measurement element, we simulate resolution
        if (el.style?.zIndex === "-9999") {
          const mock_style = {
            getPropertyValue: (/** @type {string} */ prop) => {
              const val = style.getPropertyValue(prop);
              // If we're asking for a variable, we might need to resolve it
              if (prop.startsWith("--")) {
                return resolve_mock_value(val, el);
              }
              return val;
            },
            paddingTop: resolve_mock_value(el.dataset?.resolveValue || style.paddingTop, el),
            fontSize: resolve_mock_value(el.dataset?.resolveValue || style.fontSize, el),
            transitionDuration: resolve_mock_value(el.dataset?.resolveValue || style.transitionDuration, el),
            flexGrow: resolve_mock_value(el.dataset?.resolveValue || style.flexGrow, el),
            fontFamily: resolve_mock_value(el.dataset?.resolveValue || style.fontFamily, el),
          };

          // Ensure fontFamily is quoted if it resolved to a string with spaces or special chars
          if (mock_style.fontFamily && !mock_style.fontFamily.startsWith('"') && !mock_style.fontFamily.startsWith("'")) {
            if (mock_style.fontFamily.includes(" ") || mock_style.fontFamily.includes("(")) {
              mock_style.fontFamily = `"${mock_style.fontFamily}"`;
            }
          }

          return /** @type {CSSStyleDeclaration} */ (/** @type {any} */ (mock_style));
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
    const measure_el = document.querySelector('div[style*="zIndex: -9999"]');
    if (measure_el) measure_el.remove();
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
  describe("guarded_transition", () => {
    describe("when document.startViewTransition is NOT available", () => {
      it("calls the callback synchronously without animation", () => {
        /** @type {any} */ (document).startViewTransition = undefined;
        const cb = vi.fn();
        guarded_transition(cb);
        expect(cb).toHaveBeenCalledTimes(1);
      });

      it("does not throw", () => {
        /** @type {any} */ (document).startViewTransition = undefined;
        expect(() => guarded_transition(() => {})).not.toThrow();
      });
    });

    describe("when document.startViewTransition IS available", () => {
      /** @type {() => void} */
      let resolveTransition;
      /** @type {any} */
      let transitionMock;

      beforeEach(() => {
        const finished_promise = new Promise((resolve) => {
          resolveTransition = /** @type {() => void} */ (resolve);
        });
        transitionMock = {
          ready: Promise.resolve(),
          finished: finished_promise,
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn(),
          types: [],
        };
        /** @type {any} */ (document).startViewTransition = vi.fn((cb) => {
          Promise.resolve().then(cb);
          return transitionMock;
        });
      });

      afterEach(async () => {
        resolveTransition?.();
        await new Promise((r) => setTimeout(r, 0));
      });

      it("calls document.startViewTransition with the callback", async () => {
        const cb = vi.fn();
        guarded_transition(cb);
        await vi.waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
        expect(document.startViewTransition).toHaveBeenCalledTimes(1);
      });

      it("handles concurrency with synchronous fallback until settled", async () => {
        const cb = vi.fn();
        guarded_transition(cb);

        const cb2 = vi.fn();
        guarded_transition(cb2);

        expect(cb2).toHaveBeenCalledTimes(1);
        expect(document.startViewTransition).toHaveBeenCalledTimes(1);

        resolveTransition();
        await vi.waitFor(() => {
          const cb3 = vi.fn();
          guarded_transition(cb3);
          expect(document.startViewTransition).toHaveBeenCalledTimes(2);
        });
      });
    });
  });
});
