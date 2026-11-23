<script module>
  /**
   * @file src/ui/atoms/Tooltip.svelte
   * Global Tooltip & Pinned Preview Portal System powered by bits-ui/Tooltip and Svelte 5.
   */

  /**
   * @typedef {Object} TooltipState
   * @property {string | null} text - Current tooltip text
   * @property {any | null} preview - Optional opaque payload rendered via preview_content snippet
   * @property {boolean} pinned - Whether the preview card is pinned interactively
   * @property {HTMLElement | null} target - The element currently hovered or pinned
   * @property {boolean} active - Visibility toggle
   * @property {number} x - Viewport cursor X coordinate
   * @property {number} y - Viewport cursor Y coordinate
   * @property {boolean} has_cursor - Whether cursor tracking anchors the tooltip
   */

  /**
   * Global reactive state for the tooltip system.
   * @type {TooltipState}
   */
  export const tooltip_state = $state({ text: null, preview: null, pinned: false, target: null, active: false, x: 0, y: 0, has_cursor: false });

  /** @type {number | null} */
  let timer = null;
  /** @type {number | null} */
  let hide_timer = null;
  /** @type {number | null} */
  let pinned_switch_timer = null;
  let is_suppressed = false;

  function clear_tooltip_timers() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
    if (hide_timer) {
      window.clearTimeout(hide_timer);
      hide_timer = null;
    }
    if (pinned_switch_timer) {
      window.clearTimeout(pinned_switch_timer);
      pinned_switch_timer = null;
    }
  }

  function reset_tooltip_state() {
    tooltip_state.active = false;
    tooltip_state.text = null;
    tooltip_state.preview = null;
    tooltip_state.pinned = false;
    tooltip_state.target = null;
  }

  /**
   * Suppresses or restores hover tooltips globally (e.g. while a standalone ContextMenu is open).
   * @param {boolean} suppressed
   */
  export function set_tooltip_suppressed(suppressed) {
    is_suppressed = Boolean(suppressed);
    if (is_suppressed) {
      clear_tooltip_timers();
      reset_tooltip_state();
    }
  }

  /**
   * Triggers tooltip visibility with kinetic comfort delay, enforcing the single-tooltip rule.
   * @param {HTMLElement} target
   * @param {string | null} text
   * @param {any | { preview?: any, delay?: number }} [options]
   */
  export function show_tooltip(target, text, options = null) {
    if (is_suppressed || tooltip_state.pinned) return;
    const opts = options && typeof options === "object" && "preview" in options ? options : { preview: options };
    const resolved_preview = opts?.preview ?? null;
    if (!text && !resolved_preview) return;

    const delay =
      typeof opts?.delay === "number" ? opts.delay
      : resolved_preview ? 120
      : 400;

    const commit = () => {
      if (is_suppressed || tooltip_state.pinned) return;
      clear_tooltip_timers();
      tooltip_state.text = text || null;
      tooltip_state.preview = resolved_preview;
      tooltip_state.pinned = false;
      tooltip_state.target = target;
      tooltip_state.active = true;
    };

    clear_tooltip_timers();
    if (delay <= 0) {
      commit();
    } else {
      tooltip_state.active = false;
      timer = window.setTimeout(commit, delay);
    }
  }

  /**
   * Pins and activates a rich preview payload interactively at `(x, y)`.
   * @param {HTMLElement} target
   * @param {{ preview: any, text?: string | null, x: number, y: number }} options
   */
  export function pin_tooltip_menu(target, options) {
    if (!options?.preview) return;
    clear_tooltip_timers();
    tooltip_state.x = options.x;
    tooltip_state.y = options.y;
    tooltip_state.has_cursor = true;
    tooltip_state.text = options.text ?? null;
    tooltip_state.preview = options.preview;
    tooltip_state.pinned = true;
    tooltip_state.target = target;
    tooltip_state.active = true;
  }

  /**
   * Unpins and closes any pinned preview card.
   */
  export function unpin_tooltip() {
    if (!tooltip_state.pinned) return;
    clear_tooltip_timers();
    reset_tooltip_state();
  }

  /**
   * Immediately hides the tooltip and clears active timers (no-op while pinned).
   */
  export function hide_tooltip() {
    if (tooltip_state.pinned) return;
    clear_tooltip_timers();
    // Defer state mutation to avoid Svelte 5 state_unsafe_mutation during reactive teardown.
    hide_timer = window.setTimeout(() => {
      hide_timer = null;
      if (!tooltip_state.pinned) {
        reset_tooltip_state();
      }
    }, 0);
  }

  /**
   * Svelte Action: use:tooltip
   * @param {HTMLElement} node
   * @param {string | { text?: string, preview?: any, delay?: number } | null} param
   */
  export function tooltip(node, param) {
    const resolve_payload = (input) => {
      const is_obj = input && typeof input === "object";
      const resolved_text = is_obj ? input?.text : input;
      const resolved_preview = is_obj ? (input?.preview ?? null) : null;
      const active_text = resolved_text || node.getAttribute("aria-label") || node.getAttribute("title") || null;
      return { active_text, resolved_preview, delay: is_obj ? input?.delay : undefined };
    };

    /** @param {MouseEvent | PointerEvent} e */
    const handle_move = (e) => {
      if (is_suppressed) return;
      if (tooltip_state.pinned) {
        if (pinned_switch_timer && (e.clientX || e.clientY)) {
          tooltip_state.x = e.clientX;
          tooltip_state.y = e.clientY;
        }
        return;
      }
      if (e.clientX || e.clientY) {
        tooltip_state.x = e.clientX;
        tooltip_state.y = e.clientY;
        tooltip_state.has_cursor = true;
      }
    };

    /** @param {MouseEvent | FocusEvent} e */
    const handle_enter = (e) => {
      if (is_suppressed) return;
      if (e instanceof MouseEvent && e.type === "mouseover" && node.contains(/** @type {Node} */ (e.relatedTarget))) return;

      const payload = resolve_payload(param);

      if (tooltip_state.pinned) {
        if (node === tooltip_state.target || node.closest?.("[data-tooltip-preview]")) return;
        if (payload.resolved_preview) {
          if (pinned_switch_timer) {
            window.clearTimeout(pinned_switch_timer);
            pinned_switch_timer = null;
          }
          const cursor_x = e instanceof MouseEvent ? e.clientX : tooltip_state.x;
          const cursor_y = e instanceof MouseEvent ? e.clientY : tooltip_state.y;
          pinned_switch_timer = window.setTimeout(() => {
            pinned_switch_timer = null;
            if (!tooltip_state.pinned) return;
            unpin_tooltip();

            timer = window.setTimeout(() => {
              timer = null;
              if (tooltip_state.pinned || is_suppressed) return;
              if (cursor_x || cursor_y) {
                tooltip_state.x = cursor_x;
                tooltip_state.y = cursor_y;
                tooltip_state.has_cursor = true;
              } else {
                tooltip_state.has_cursor = false;
              }
              show_tooltip(node, payload.active_text, { preview: payload.resolved_preview, delay: 0 });
            }, 260);
          }, 150);
        }
        return;
      }

      if (e instanceof MouseEvent && (e.clientX || e.clientY)) {
        tooltip_state.x = e.clientX;
        tooltip_state.y = e.clientY;
        tooltip_state.has_cursor = true;
      } else {
        tooltip_state.has_cursor = false;
      }

      if (payload.active_text || payload.resolved_preview) {
        if (node.hasAttribute("title")) {
          node.dataset.tooltipTitle = node.getAttribute("title") || "";
          node.setAttribute("title", "");
        }
        show_tooltip(node, payload.active_text, { preview: payload.resolved_preview, delay: payload.delay });
      }
    };

    /** @param {MouseEvent | FocusEvent} e */
    const handle_leave = (e) => {
      if (pinned_switch_timer) {
        window.clearTimeout(pinned_switch_timer);
        pinned_switch_timer = null;
      }
      clear_tooltip_timers();
      if (tooltip_state.pinned) return;
      if (e instanceof MouseEvent && e.type === "mouseout" && node.contains(/** @type {Node} */ (e.relatedTarget))) return;
      if (node.dataset.tooltipTitle) {
        node.setAttribute("title", node.dataset.tooltipTitle);
        delete node.dataset.tooltipTitle;
      }
      hide_tooltip();
    };

    node.addEventListener("mouseover", handle_enter);
    node.addEventListener("pointermove", handle_move);
    node.addEventListener("mouseout", handle_leave);
    node.addEventListener("focusin", handle_enter);
    node.addEventListener("focusout", handle_leave);

    return {
      /** @param {string | { text?: string, preview?: any, delay?: number } | null} new_param */
      update(new_param) {
        param = new_param;
        if (tooltip_state.target === node && tooltip_state.active && !tooltip_state.pinned) {
          const payload = resolve_payload(param);
          if (payload.active_text) tooltip_state.text = payload.active_text;
          tooltip_state.preview = payload.resolved_preview;
        }
      },
      destroy() {
        if (pinned_switch_timer) {
          window.clearTimeout(pinned_switch_timer);
          pinned_switch_timer = null;
        }
        node.removeEventListener("mouseover", handle_enter);
        node.removeEventListener("pointermove", handle_move);
        node.removeEventListener("mouseout", handle_leave);
        node.removeEventListener("focusin", handle_enter);
        node.removeEventListener("focusout", handle_leave);
        if (node.dataset.tooltipTitle) {
          node.setAttribute("title", node.dataset.tooltipTitle);
          delete node.dataset.tooltipTitle;
        }
        if (tooltip_state.target === node) {
          if (tooltip_state.pinned) unpin_tooltip();
          else hide_tooltip();
        }
      },
    };
  }
</script>

<script>
  import { motion } from "@media";
  import { on_dismiss_outside } from "@utils";
  import { Tooltip } from "bits-ui";
  import { scale } from "svelte/transition";

  let { preview_content = null } = $props();

  let display_snapshot = $state({ text: /** @type {string | null} */ (null), preview: /** @type {any} */ (null), pinned: false });

  $effect(() => {
    if (tooltip_state.active) {
      display_snapshot = { text: tooltip_state.text, preview: tooltip_state.preview, pinned: tooltip_state.pinned };
    }
  });

  const virtual_anchor = {
    getBoundingClientRect: () => ({
      x: tooltip_state.x,
      y: tooltip_state.y,
      left: tooltip_state.x,
      top: tooltip_state.y,
      right: tooltip_state.x,
      bottom: tooltip_state.y,
      width: 0,
      height: 0,
      toJSON() {
        return this;
      },
    }),
  };

  const active_anchor = $derived(tooltip_state.has_cursor ? virtual_anchor : tooltip_state.target);

  $effect(() => {
    if (!tooltip_state.pinned) return;

    return on_dismiss_outside(
      (event) => {
        const target = /** @type {HTMLElement | null} */ (event.target);
        if (target?.closest?.("[data-tooltip-preview]")) return true;
        if (event instanceof MouseEvent && event.button === 2) return true;
        return false;
      },
      () => {
        unpin_tooltip();
      },
    );
  });
</script>

<Tooltip.Provider delayDuration={0}>
  <Tooltip.Root open={tooltip_state.active}>
    <Tooltip.Portal>
      {#if tooltip_state.target && (display_snapshot.text || (display_snapshot.preview && preview_content))}
        <Tooltip.Content
          customAnchor={active_anchor}
          updatePositionStrategy="always"
          side="top"
          sideOffset={display_snapshot.preview ? 14 : 10}
          align="center"
          avoidCollisions={true}
          strategy="fixed"
          forceMount>
          {#snippet child({ wrapperProps, props, open })}
            {#if open}
              <div
                {...wrapperProps}
                class={[wrapperProps?.class || "", display_snapshot.pinned ? "pointer-events-auto" : "pointer-events-none"]}
                style:z-index="var(--z-index-tooltip)">
                <div
                  {...props}
                  class={[
                    props.class,
                    "group relative flex origin-(--transform-origin) flex-col items-center drop-shadow-lg transition-opacity duration-fast ease-out",
                    display_snapshot.pinned ? "pointer-events-auto" : "pointer-events-none",
                    open ? "opacity-100" : "opacity-0",
                  ]}
                  transition:scale={{
                    duration:
                      motion.is_reduced ? 0
                      : display_snapshot.pinned ? 250
                      : 150,
                    start: 0.95,
                    opacity: 0,
                  }}>
                  {#if display_snapshot.preview && preview_content}
                    <div data-tooltip-preview>
                      {@render preview_content({ preview: display_snapshot.preview, pinned: display_snapshot.pinned, closing: !open })}
                    </div>
                  {:else}
                    <div
                      class="
                        absolute
                        left-1/2
                        z-0
                        size-0
                        -translate-x-1/2

                        group-data-[side=bottom]:top-[-8px]
                        group-data-[side=bottom]:border-x-8
                        group-data-[side=bottom]:border-b-8
                        group-data-[side=bottom]:border-x-transparent
                        group-data-[side=bottom]:border-b-gunmetal

                        group-data-[side=top]:bottom-[-8px]
                        group-data-[side=top]:border-x-8
                        group-data-[side=top]:border-t-8
                        group-data-[side=top]:border-x-transparent
                        group-data-[side=top]:border-t-gunmetal
                      ">
                      <div
                        class="
                          absolute
                          left-1/2
                          size-0
                          -translate-x-1/2

                          group-data-[side=bottom]:top-px
                          group-data-[side=bottom]:border-x-8
                          group-data-[side=bottom]:border-b-8
                          group-data-[side=bottom]:border-x-transparent
                          group-data-[side=bottom]:border-b-chalk

                          group-data-[side=top]:bottom-px
                          group-data-[side=top]:border-x-8
                          group-data-[side=top]:border-t-8
                          group-data-[side=top]:border-x-transparent
                          group-data-[side=top]:border-t-chalk
                        ">
                      </div>
                    </div>

                    <div
                      class="isolate w-max max-w-100 transform-gpu rounded-sharp border border-gunmetal bg-chalk/95 px-tight py-1.5 text-center type-interact text-balance whitespace-pre-line text-frisk shadow-standard backface-hidden">
                      {display_snapshot.text}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          {/snippet}
        </Tooltip.Content>
      {/if}
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
