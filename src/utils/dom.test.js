import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  download_json_file,
  download_text_file,
  ensure_theme_tokens,
  guarded_transition,
  resolve_ms,
  resolve_number,
  resolve_px,
  resolve_string,
  safe_html,
  on_dismiss_outside,
} from "./dom.js";
import * as html_utils from "./html.js";

vi.mock("./html.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { .../** @type {any} */ (actual), sanitize_to_fragment: vi.fn((dirty) => ({ __isMockFragment: true, source: dirty || "" })) };
});

describe("CSS token resolvers", () => {
  /** @type {HTMLElement} */
  let context_el;

  beforeEach(() => {
    context_el = document.createElement("div");
    context_el.style.setProperty("--local-px", "20px");
    context_el.style.setProperty("--local-rem", "2rem");
    context_el.style.setProperty("--local-duration", "500ms");
    context_el.style.setProperty("--nested-var", "var(--local-px)");
    context_el.style.setProperty("--local-num", "0.75");
    context_el.style.setProperty("--local-str", "Nordic");
    document.body.appendChild(context_el);

    if (typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom")) {
      const original_get_computed_style = window.getComputedStyle;
      vi.spyOn(window, "getComputedStyle").mockImplementation((/** @type {any} */ el) => {
        const style = original_get_computed_style(el);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === "getPropertyValue") {
              return (/** @type {string} */ name) => target.getPropertyValue(name);
            }
            return typeof target[prop] === "function" ? target[prop].bind(target) : target[prop];
          },
        });
      });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    context_el?.remove();
  });

  it("resolve_px handles numbers, px, rem, vars, and calc()", () => {
    expect(resolve_px(10)).toBe(10);
    expect(resolve_px("25px")).toBe(25);
    expect(resolve_px("2rem")).toBe(32);
    expect(resolve_px("--local-px", 0, context_el)).toBe(20);
    expect(resolve_px("var(--nested-var)", 0, context_el)).toBe(20);
    expect(resolve_px("calc(10px + 5px)")).toBe(15);
    expect(resolve_px("calc(var(--local-px) * 2)", 0, context_el)).toBe(40);
    expect(resolve_px("invalid", 123)).toBe(123);
  });

  it("resolve_ms handles ms, s, 0, vars, and rejects bare non-zero numbers", () => {
    expect(resolve_ms(100)).toBe(100);
    expect(resolve_ms("200ms")).toBe(200);
    expect(resolve_ms("0.5s")).toBe(500);
    expect(resolve_ms("--local-duration", 0, context_el)).toBe(500);
    expect(resolve_ms("500", 999)).toBe(999);
    expect(resolve_ms("invalid", 999)).toBe(999);
  });

  it("resolve_number and resolve_string resolve typed CSS tokens", () => {
    expect(resolve_number("0.5")).toBe(0.5);
    expect(resolve_number("--local-num", 0, context_el)).toBe(0.75);
    expect(resolve_number("not-a-number", 0.5)).toBe(0.5);
    expect(resolve_string("  hello  ")).toBe("hello");
    expect(resolve_string("--local-str", "", context_el)).toBe("Nordic");
  });
});

describe("guarded_transition & downloads", () => {
  it("runs synchronously when document.startViewTransition is unavailable", () => {
    /** @type {any} */ (document).startViewTransition = undefined;
    const cb = vi.fn();
    guarded_transition(cb);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("serializes concurrent view transitions via single-flight guard", async () => {
    /** @type {() => void} */
    let resolve_transition = () => {};
    const finished = new Promise((resolve) => {
      resolve_transition = /** @type {() => void} */ (resolve);
    });
    const transition_mock = { ready: Promise.resolve(), finished, updateCallbackDone: Promise.resolve(), skipTransition: vi.fn(), types: [] };
    /** @type {any} */ (document).startViewTransition = vi.fn((cb) => {
      Promise.resolve().then(cb);
      return transition_mock;
    });

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    guarded_transition(cb1);
    guarded_transition(cb2);

    await vi.waitFor(() => expect(cb1).toHaveBeenCalledTimes(1));
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(document.startViewTransition).toHaveBeenCalledTimes(1);

    resolve_transition();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("downloads text and json files via object URLs", () => {
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    expect(download_text_file("story.txt", "Chapter 1")).toBe(true);
    expect(download_json_file("data.json", { id: "test", val: 42 })).toBe(true);
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });

  it("hydrates missing design tokens on documentElement", () => {
    ensure_theme_tokens();
    expect(document.documentElement.style.getPropertyValue("--color-frozen")).toBe("#475569");
  });
});

describe("safe_html action", () => {
  it("clears textContent and appends sanitized fragments on mount and update", () => {
    /** @type {any} */
    const mock_node = { textContent: "existing", appendChild: vi.fn(), innerHTML: "untouched" };
    const action = safe_html(mock_node, "<b>Bold</b>");
    expect(mock_node.innerHTML).toBe("untouched");
    expect(mock_node.textContent).toBe("");
    expect(html_utils.sanitize_to_fragment).toHaveBeenCalledWith("<b>Bold</b>");

    action.update(null);
    expect(html_utils.sanitize_to_fragment).toHaveBeenCalledWith("");
  });
});

describe("on_dismiss_outside", () => {
  it("triggers dismissal when gesture is outside", () => {
    const on_dismiss = vi.fn();
    const should_ignore = vi.fn(() => false);
    const teardown = on_dismiss_outside(should_ignore, on_dismiss);

    const outside_event = new PointerEvent("pointerdown", { bubbles: true });
    window.dispatchEvent(outside_event);
    expect(should_ignore).toHaveBeenCalledWith(outside_event);
    expect(on_dismiss).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(on_dismiss).toHaveBeenCalledTimes(2);

    teardown();
    window.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(on_dismiss).toHaveBeenCalledTimes(2);
  });

  it("does not trigger when should_ignore returns true", () => {
    const on_dismiss = vi.fn();
    const should_ignore = vi.fn(() => true);
    const teardown = on_dismiss_outside(should_ignore, on_dismiss);

    window.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(on_dismiss).not.toHaveBeenCalled();

    teardown();
  });

  it("ignores child element blur events and only dismisses on window blur", () => {
    const on_dismiss = vi.fn();
    const teardown = on_dismiss_outside(() => false, on_dismiss);

    const btn = document.createElement("button");
    document.body.appendChild(btn);
    btn.dispatchEvent(new FocusEvent("blur", { bubbles: false }));
    expect(on_dismiss).not.toHaveBeenCalled();

    window.dispatchEvent(new FocusEvent("blur"));
    expect(on_dismiss).toHaveBeenCalledTimes(1);

    btn.remove();
    teardown();
  });
});
