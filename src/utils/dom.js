/**
 * @file src/utils/dom.js
 * Browser DOM utilities: boot error hardening, CSS token hydration & computed
 * resolvers, View Transition locking, blob downloads, and Svelte DOM actions.
 */

import { sanitize_to_fragment } from "./html.js";
import { TOKENS } from "./tokens.js";

// ============================================================================
// 1. Boot Hardening & Theme Hydration
// ============================================================================

const RESIZE_OBSERVER_LOOP_PATTERN = "ResizeObserver loop";
const PERCHANCE_FRAME_ERROR_PATTERNS = ["Symbol", "numActualScriptLines"];
let environment_hardening_installed = false;

/**
 * @param {any} target
 * @returns {boolean}
 */
function is_resize_observer_loop_notice(target) {
  if (!target) return false;
  try {
    const candidates = [target.message, target.reason, target.error?.message, target];
    return candidates.some((candidate) => candidate != null && String(candidate).includes(RESIZE_OBSERVER_LOOP_PATTERN));
  } catch {
    return false;
  }
}

/**
 * @param {any} target
 * @returns {boolean}
 */
function is_perchance_frame_error(target) {
  if (!target) return false;
  try {
    const message = target.message ? String(target.message) : String(target);
    return PERCHANCE_FRAME_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
  } catch {
    return false;
  }
}

/**
 * Installs error and rejection guards to suppress benign ResizeObserver loop
 * notices and Perchance iframe sandbox artifacts. Invoked once at boot.
 */
export function install_environment_hardening() {
  if (typeof window === "undefined" || environment_hardening_installed) return;
  environment_hardening_installed = true;

  const original_console_error = console.error.bind(console);
  console.error = function (...args) {
    try {
      if (args.some((arg) => is_resize_observer_loop_notice(arg))) return;
    } catch {
      /* Fall through to original console.error */
    }
    return original_console_error(...args);
  };

  const original_onerror = window.onerror;
  window.onerror = function (msg, source, lineno, colno, error) {
    if (msg && String(msg).includes(RESIZE_OBSERVER_LOOP_PATTERN)) {
      return true;
    }
    return original_onerror ? original_onerror.call(this, msg, source, lineno, colno, error) : false;
  };

  window.addEventListener(
    "error",
    (event) => {
      if (is_resize_observer_loop_notice(event)) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
        return;
      }
      if (is_perchance_frame_error(event)) {
        event.preventDefault?.();
        event.stopPropagation?.();
      }
    },
    true,
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      if (is_resize_observer_loop_notice(event?.reason)) {
        event.preventDefault?.();
        event.stopPropagation?.();
        return;
      }
      if (is_perchance_frame_error(event?.reason)) {
        event.preventDefault?.();
        event.stopPropagation?.();
      }
    },
    true,
  );
}

/**
 * Ensures all design tokens in `TOKENS` exist as CSS custom properties on `:root`.
 */
export function ensure_theme_tokens() {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") return;
  const root = document.documentElement;
  if (!root) return;

  for (const [name, value] of Object.entries(TOKENS)) {
    if (typeof value !== "string" || value === "") continue;
    const css_variable = `--${name}`;
    if (getComputedStyle(root).getPropertyValue(css_variable).trim() === "") {
      root.style.setProperty(css_variable, value);
    }
  }
}

/**
 * Resolves a Perchance plugin function from the pjs `root` namespace first
 * (the only place `{import:...}` bindings canonically live — ES modules
 * cannot see pjs scope, and indirect eval cannot reach it either), then
 * from `window` / cross-origin-safe `window.parent` (test stubs, bridges).
 * @param {string} plugin_name
 * @returns {Function | null}
 */
export function resolve_perchance_plugin(plugin_name) {
  try {
    const holder = typeof globalThis !== "undefined" ? /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (globalThis).root) : undefined;
    const root_fn = holder ? holder[plugin_name] : undefined;
    if (typeof root_fn === "function") return root_fn;
  } catch {
    /* Ignore sandbox access */
  }

  if (typeof window === "undefined") return null;

  try {
    const local_fn = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (window))[plugin_name];
    if (typeof local_fn === "function") return local_fn;
  } catch {
    /* Ignore sandbox access */
  }

  try {
    if (window.parent && window.parent !== window) {
      const parent_fn = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (window.parent))[plugin_name];
      if (typeof parent_fn === "function") return parent_fn;
    }
  } catch {
    /* Ignore cross-origin iframe boundary */
  }

  return null;
}

// ============================================================================
// 2. CSS Token Computed Resolvers
// ============================================================================

/**
 * Walks upward from `context` resolving a CSS custom property without injecting DOM nodes.
 * @param {string} var_name
 * @param {HTMLElement | null} context
 * @returns {string}
 */
function resolve_css_var(var_name, context) {
  if (typeof window === "undefined" || typeof document === "undefined") return "";
  let cur = context || document.body || document.documentElement;
  try {
    while (cur) {
      const computed = window.getComputedStyle(cur).getPropertyValue(var_name).trim();
      if (computed !== "") return computed;
      const inline = /** @type {HTMLElement} */ (cur).style?.getPropertyValue?.(var_name)?.trim() ?? "";
      if (inline !== "") return inline;
      cur = cur.parentElement;
    }
  } catch {
    /* Fall through */
  }
  return "";
}

/**
 * @param {string} raw
 * @param {HTMLElement | null} context
 * @param {any} fallback
 * @param {((val: string, fb: any, ctx: HTMLElement | null) => any) | null} recurse_fn
 */
function resolve_var_expression(raw, context, fallback, recurse_fn) {
  if (typeof window === "undefined" || typeof document === "undefined") return undefined;

  let var_name = "";
  let var_fallback = "";

  if (raw.startsWith("--")) {
    var_name = raw;
  } else {
    const var_match = raw.match(/^var\((--[^,)]+)(?:,\s*([^)]+))?\)$/);
    if (var_match) {
      var_name = var_match[1].trim();
      var_fallback = var_match[2]?.trim() || "";
    }
  }

  if (!var_name) return undefined;
  const resolved = resolve_css_var(var_name, context);
  if (resolved) return recurse_fn ? recurse_fn(resolved, fallback, context) : resolved;
  if (var_fallback) return recurse_fn ? recurse_fn(var_fallback, fallback, context) : var_fallback;
  return fallback;
}

/**
 * Resolves a CSS value (`px`, `rem`, `calc()`, or CSS variable) to a pixel number.
 * @param {string | number | undefined} value
 * @param {number} [fallback=0]
 * @param {HTMLElement | null} [context=null]
 * @returns {number}
 */
export function resolve_px(value, fallback = 0, context = null) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return Number.isNaN(value) ? fallback : value;

  const raw = String(value).trim();
  if (!raw) return fallback;

  const px_match = raw.match(/^([-.\d]+)(?:px)?$/);
  if (px_match) {
    const num = parseFloat(px_match[1]);
    return Number.isNaN(num) ? fallback : num;
  }

  const rem_match = raw.match(/^([-.\d]+)rem$/);
  if (rem_match) {
    const rem = parseFloat(rem_match[1]);
    if (Number.isNaN(rem)) return fallback;
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const root_font = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
      return rem * (Number.isNaN(root_font) || root_font <= 0 ? 16 : root_font);
    }
    return rem * 16;
  }

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const var_result = resolve_var_expression(raw, context, fallback, resolve_px);
    if (var_result !== undefined) return var_result;

    if (raw.startsWith("calc(") && raw.endsWith(")")) {
      const inner = raw.slice(5, -1).trim();
      const additive_match = inner.match(/^(.+?)\s+([+-])\s+(.+)$/);
      if (additive_match) {
        const left = resolve_px(additive_match[1].trim(), NaN, context);
        const right = resolve_px(additive_match[3].trim(), NaN, context);
        if (!Number.isNaN(left) && !Number.isNaN(right)) {
          return additive_match[2] === "+" ? left + right : left - right;
        }
      }
      const mult_match = inner.match(/^(.+?)\s*([*/])\s*(.+)$/);
      if (mult_match) {
        const left = resolve_px(mult_match[1].trim(), NaN, context);
        const right = parseFloat(mult_match[3]);
        if (!Number.isNaN(left) && !Number.isNaN(right)) {
          return (
            mult_match[2] === "*" ? left * right
            : right !== 0 ? left / right
            : fallback
          );
        }
      }
    }
  }

  return fallback;
}

/**
 * Resolves a CSS duration (`ms`, `s`, `0`, or CSS variable) to milliseconds.
 * Rejects ambiguous unitless non-zero strings.
 * @param {string | number | undefined} value
 * @param {number} [fallback=0]
 * @param {HTMLElement | null} [context=null]
 * @returns {number}
 */
export function resolve_ms(value, fallback = 0, context = null) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return Number.isNaN(value) ? fallback : value;

  const raw = String(value).trim();
  if (!raw) return fallback;

  const ms_match = raw.match(/^([-.\d]+)ms$/);
  if (ms_match) {
    const num = parseFloat(ms_match[1]);
    return Number.isNaN(num) ? fallback : num;
  }

  const s_match = raw.match(/^([-.\d]+)s$/);
  if (s_match) {
    const num = parseFloat(s_match[1]);
    return Number.isNaN(num) ? fallback : num * 1000;
  }

  if (raw === "0") return 0;

  const var_result = resolve_var_expression(raw, context, fallback, resolve_ms);
  return var_result !== undefined ? var_result : fallback;
}

/**
 * Resolves a unitless CSS numeric value or CSS variable to a number.
 * @param {string | number | undefined} value
 * @param {number} [fallback=0]
 * @param {HTMLElement | null} [context=null]
 * @returns {number}
 */
export function resolve_number(value, fallback = 0, context = null) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return Number.isNaN(value) ? fallback : value;

  const raw = String(value).trim();
  if (!raw) return fallback;

  if (/^[-.\d]+$/.test(raw)) {
    const num = parseFloat(raw);
    return Number.isNaN(num) ? fallback : num;
  }

  const var_result = resolve_var_expression(raw, context, fallback, resolve_number);
  return var_result !== undefined ? var_result : fallback;
}

/**
 * Resolves a CSS variable to its raw string value or passes through literal strings.
 * @param {string | undefined} value
 * @param {string} [fallback=""]
 * @param {HTMLElement | null} [context=null]
 * @returns {string}
 */
export function resolve_string(value, fallback = "", context = null) {
  if (value === undefined || value === null) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;

  const var_result = resolve_var_expression(raw, context, fallback, null);
  return var_result !== undefined ? var_result : raw || fallback;
}

// ============================================================================
// 3. View Transitions & Blob Downloads
// ============================================================================

/**
 * Triggers a browser download of a Blob or string payload.
 * @param {string} filename
 * @param {string | Blob} content
 * @param {string} [mime="application/octet-stream"]
 * @returns {boolean}
 */
function download_blob(filename, content, mime = "application/octet-stream") {
  if (typeof document === "undefined") return false;
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

/**
 * Downloads a text payload as a local file.
 * @param {string} filename
 * @param {string} text
 * @param {string} [mime="text/plain;charset=utf-8"]
 * @returns {boolean}
 */
export const download_text_file = (filename, text, mime = "text/plain;charset=utf-8") => download_blob(filename, text, mime);

/**
 * Downloads a JSON-serializable value as an indented `.json` file.
 * @param {string} filename
 * @param {any} value
 * @returns {boolean}
 */
export const download_json_file = (filename, value) => download_blob(filename, JSON.stringify(value, null, 2), "application/json;charset=utf-8");

const _transition_state = { active: false };

/**
 * Wraps `document.startViewTransition()` with a single-flight concurrency lock
 * and synchronous fallback when transitions are active or unsupported.
 * @param {() => void | Promise<void>} callback
 * @param {{ className?: string }} [options={}]
 * @returns {Promise<any>}
 */
export function guarded_transition(callback, options = {}) {
  if (typeof document === "undefined" || !document.startViewTransition || _transition_state.active) {
    callback();
    return Promise.resolve();
  }

  _transition_state.active = true;
  if (options.className) {
    document.documentElement.classList.add(options.className);
  }

  const transition = document.startViewTransition(async () => {
    try {
      await callback();
    } catch (err) {
      console.error("[TransitionGuard] Callback error during view transition:", err);
    }
  });

  const done_promise = transition.finished.finally(() => {
    if (options.className) {
      document.documentElement.classList.remove(options.className);
    }
    _transition_state.active = false;
  });

  transition.finished.catch(() => {});
  transition.ready.catch(() => {});
  transition.updateCallbackDone.catch(() => {});

  return done_promise;
}

// ============================================================================
// 4. Svelte DOM Actions
// ============================================================================

/**
 * Composes multiple Svelte actions on a single node and flags `data-kinetic` when kinetic actions are active.
 * @param {HTMLElement} node
 * @param {Array<any>} actions
 */
export function use_actions(node, actions) {
  /** @type {Map<any, any>} */
  let instances = new Map();

  /** @param {Array<any>} new_actions */
  function update(new_actions) {
    const next_instances = new Map();
    let has_kinetic = false;

    new_actions.forEach((item) => {
      if (!item) return;

      const [action, params] = Array.isArray(item) ? item : [item, undefined];
      if (!action) return;
      if (action.is_kinetic) has_kinetic = true;

      const existing = instances.get(action);
      if (existing) {
        existing.update?.(params);
        next_instances.set(action, existing);
        instances.delete(action);
      } else {
        next_instances.set(action, action(node, params));
      }
    });

    if (has_kinetic) node.setAttribute("data-kinetic", "true");
    else node.removeAttribute("data-kinetic");

    instances.forEach((result) => result?.destroy?.());
    instances = next_instances;
  }

  update(actions);

  return { update, destroy: () => instances.forEach((result) => result?.destroy?.()) };
}

/**
 * Injects DOMPurify-sanitized HTML fragments into `node` without `innerHTML`.
 * @param {HTMLElement} node
 * @param {string | null | undefined} content
 */
export function safe_html(node, content) {
  /** @param {string | null | undefined} new_content */
  const update_content = (new_content) => {
    node.textContent = "";
    node.appendChild(sanitize_to_fragment(new_content ?? ""));
  };
  update_content(content);
  return { update: update_content };
}

/**
 * Auto-resizes an input, textarea, or editable element to its content height,
 * batching DOM reads and writes to avoid layout thrashing.
 * @param {HTMLElement} node
 * @param {{ sync_id?: string }} [options={}]
 */
export function auto_resize(node, options = {}) {
  /** @type {number | undefined} */
  let frame;
  let last_width = 0;
  /** @type {string | null} */
  let last_val = null;

  const update = () => {
    if (frame) cancelAnimationFrame(frame);

    frame = requestAnimationFrame(() => {
      const current_val = node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement ? node.value : node.textContent;
      const current_width = node.clientWidth;
      if (current_width === last_width && current_val === last_val) return;

      const buffer = resolve_px("--spacing-pixel", 2, node);
      const sync_id = options?.sync_id;
      const scope = sync_id ? node.closest(".storymode-grid, .modal-content, body") || document.body : null;
      const siblings = sync_id && scope ? scope.querySelectorAll(`[data-sync-id="${sync_id}"]`) : [node];

      siblings.forEach((s) => {
        if (s instanceof HTMLElement) s.style.height = "auto";
      });

      let max_scroll_height = 0;
      /** @type {Array<{ el: HTMLElement, border_offset: number }>} */
      const metrics = [];

      siblings.forEach((s) => {
        if (s instanceof HTMLElement) {
          const style = getComputedStyle(s);
          const is_border_box = style.boxSizing === "border-box";
          const border_offset = is_border_box ? parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) : 0;
          max_scroll_height = Math.max(max_scroll_height, s.scrollHeight);
          metrics.push({ el: s, border_offset });
        }
      });

      metrics.forEach((m) => {
        m.el.style.height = max_scroll_height + m.border_offset + buffer + "px";
      });

      last_width = current_width;
      last_val = current_val;
    });
  };

  if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) {
    const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), "value");
    if (desc?.set) {
      const original_value_set = desc.set;
      try {
        Object.defineProperty(node, "value", {
          get() {
            return desc.get ? desc.get.call(this) : node.getAttribute("value");
          },
          set(v) {
            original_value_set.call(this, v);
            update();
          },
          configurable: true,
        });
      } catch {
        /* Property is non-configurable */
      }
    }
  }

  node.addEventListener("input", update);
  node.addEventListener("change", update);
  const observer = new ResizeObserver(update);
  observer.observe(node);

  const mutation_observer = new MutationObserver(update);
  if (!(node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement)) {
    mutation_observer.observe(node, { childList: true, characterData: true, subtree: true });
  }

  update();

  return {
    update(new_options) {
      options = new_options || {};
      update();
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener("input", update);
      node.removeEventListener("change", update);
      observer.disconnect();
      mutation_observer.disconnect();
    },
  };
}

/**
 * Listens for outside dismiss gestures across capture-phase pointerdown,
 * contextmenu, scroll, blur, and Escape keydown, invoking on_dismiss when outside.
 *
 * @param {(event: Event) => boolean} should_ignore
 * @param {() => void} on_dismiss
 * @returns {() => void} Cleanup teardown function
 */
export function on_dismiss_outside(should_ignore, on_dismiss) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handle_pointer = (event) => {
    if (typeof should_ignore === "function" && should_ignore(event)) {
      return;
    }
    if (event.type === "pointerdown" && event.button === 2) {
      return;
    }
    if (event.type === "pointerdown") {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    on_dismiss();
  };

  const handle_key = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      on_dismiss();
    }
  };

  const handle_blur = () => {
    on_dismiss();
  };

  window.addEventListener("pointerdown", handle_pointer, true);
  window.addEventListener("contextmenu", handle_pointer, true);
  window.addEventListener("scroll", handle_pointer, true);
  window.addEventListener("keydown", handle_key, true);
  window.addEventListener("blur", handle_blur, false);

  return () => {
    window.removeEventListener("pointerdown", handle_pointer, true);
    window.removeEventListener("contextmenu", handle_pointer, true);
    window.removeEventListener("scroll", handle_pointer, true);
    window.removeEventListener("keydown", handle_key, true);
    window.removeEventListener("blur", handle_blur, false);
  };
}
