<script module>
  /**
   * @file Tooltip.svelte
   * @module TooltipSystem
   * Consolidated Tooltip Atom: State, Action, and Renderer.
   * Headless refactor powered by bits-ui/Tooltip and Svelte 5.
   */

  /**
   * @typedef {Object} TooltipState
   * @property {string | null} text - Current tooltip text
   * @property {any | null} entity - Optional entity for rich EntityCard preview
   * @property {Array<{ key: string, value: string, is_hidden?: boolean, quadrant?: string }> | null} bracket_items - Optional relationship bracket list
   * @property {any | null} description_owner - Optional perspective owner for MacroText rendering inside previews
   * @property {boolean} incoming_only - Whether the hovered relationship is strictly incoming-only
   * @property {boolean} pinned - Whether the entity preview card is pinned & 3D-flipped to its ContextMenu backside
   * @property {any[]} actions - Contextual actions shown on the pinned backside
   * @property {HTMLElement | null} target - The element currently being hovered or pinned
   * @property {boolean} active - Visibility toggle
   * @property {number} x - Viewport cursor X coordinate
   * @property {number} y - Viewport cursor Y coordinate
   * @property {boolean} has_cursor - Whether cursor tracking should anchor the tooltip
   */

  /**
   * Global reactive state for the tooltip system.
   * @type {TooltipState}
   */
  export const tooltip_state = $state({
    text: null,
    entity: null,
    bracket_items: null,
    description_owner: null,
    incoming_only: false,
    pinned: false,
    actions: [],
    target: null,
    active: false,
    x: 0,
    y: 0,
    has_cursor: false,
  });

  /** @type {number | null} */
  let timer = null;
  /** @type {number | null} */
  let hide_timer = null;
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
  }

  function reset_tooltip_state() {
    tooltip_state.active = false;
    tooltip_state.text = null;
    tooltip_state.entity = null;
    tooltip_state.bracket_items = null;
    tooltip_state.description_owner = null;
    tooltip_state.incoming_only = false;
    tooltip_state.pinned = false;
    tooltip_state.actions = [];
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
   * Triggers the tooltip visibility with a slight delay for kinetic comfort.
   * Enforces the global 1-tooltip rule by clearing any active or pending tooltip first.
   * @param {HTMLElement} target
   * @param {string | null} text
   * @param {any | { entity?: any, bracket_items?: any[] | null, description_owner?: any, incoming_only?: boolean, delay?: number }} [options]
   */
  export function show_tooltip(target, text, options = null) {
    if (is_suppressed || tooltip_state.pinned) return;
    const opts = options && typeof options === "object" && "entity" in options ? options : { entity: options };
    const resolved_entity = opts?.entity ?? null;
    if (!text && !resolved_entity) return;

    const delay =
      typeof opts?.delay === "number" ? opts.delay
      : resolved_entity ? 120
      : 400;
    const commit = () => {
      if (is_suppressed || tooltip_state.pinned) return;
      clear_tooltip_timers();
      tooltip_state.text = text || null;
      tooltip_state.entity = resolved_entity;
      tooltip_state.bracket_items = opts?.bracket_items ?? null;
      tooltip_state.description_owner = opts?.description_owner ?? null;
      tooltip_state.incoming_only = Boolean(opts?.incoming_only);
      tooltip_state.pinned = false;
      tooltip_state.actions = [];
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
   * Pins and 3D-flips an entity preview card at `(x, y)` so its backside ContextMenu is interactive.
   * @param {HTMLElement} target
   * @param {{ entity: any, text?: string | null, bracket_items?: any[] | null, description_owner?: any, incoming_only?: boolean, actions?: any[], x: number, y: number }} options
   */
  export function pin_tooltip_menu(target, options) {
    if (!options?.entity) return;
    clear_tooltip_timers();
    tooltip_state.x = options.x;
    tooltip_state.y = options.y;
    tooltip_state.has_cursor = true;
    tooltip_state.text = options.text || options.entity.name || null;
    tooltip_state.entity = options.entity;
    tooltip_state.bracket_items = options.bracket_items ?? null;
    tooltip_state.description_owner = options.description_owner ?? null;
    tooltip_state.incoming_only = Boolean(options.incoming_only);
    tooltip_state.actions = Array.isArray(options.actions) ? options.actions : [];
    tooltip_state.pinned = true;
    tooltip_state.target = target;
    tooltip_state.active = true;
  }

  /**
   * Unpins and closes any pinned entity preview card.
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
    // Defer state mutation to avoid Svelte 5 state_unsafe_mutation.
    // DOM removal during unmount can trigger synchronous `mouseout` or `blur` events,
    // which execute this function while Svelte is in the middle of a reactive teardown.
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
   * @param {string | { text?: string, entity?: any, bracket_items?: any[] | null, description_owner?: any, incoming_only?: boolean, delay?: number } | null} param
   */
  export function tooltip(node, param) {
    const resolve_payload = (input) => {
      const is_obj = input && typeof input === "object";
      const resolved_text = is_obj ? input?.text : input;
      const resolved_entity = is_obj ? (input?.entity ?? null) : null;
      const active_text = resolved_text || node.getAttribute("aria-label") || node.getAttribute("title") || null;
      return {
        active_text,
        resolved_entity,
        bracket_items: is_obj ? (input?.bracket_items ?? null) : null,
        description_owner: is_obj ? (input?.description_owner ?? null) : null,
        incoming_only: is_obj ? Boolean(input?.incoming_only) : false,
        delay: is_obj ? input?.delay : undefined,
      };
    };

    /** @param {MouseEvent | PointerEvent} e */
    const handle_move = (e) => {
      if (tooltip_state.pinned || is_suppressed) return;
      if (e.clientX || e.clientY) {
        tooltip_state.x = e.clientX;
        tooltip_state.y = e.clientY;
        tooltip_state.has_cursor = true;
      }
    };

    /** @param {MouseEvent | FocusEvent} e */
    const handle_enter = (e) => {
      if (tooltip_state.pinned || is_suppressed) return;
      if (e instanceof MouseEvent && e.type === "mouseover" && node.contains(/** @type {Node} */ (e.relatedTarget))) return;

      if (e instanceof MouseEvent && (e.clientX || e.clientY)) {
        tooltip_state.x = e.clientX;
        tooltip_state.y = e.clientY;
        tooltip_state.has_cursor = true;
      } else {
        tooltip_state.has_cursor = false;
      }

      const payload = resolve_payload(param);

      if (payload.active_text || payload.resolved_entity) {
        if (node.hasAttribute("title")) {
          node.dataset.tooltipTitle = node.getAttribute("title") || "";
          node.setAttribute("title", "");
        }
        show_tooltip(node, payload.active_text, {
          entity: payload.resolved_entity,
          bracket_items: payload.bracket_items,
          description_owner: payload.description_owner,
          incoming_only: payload.incoming_only,
          delay: payload.delay,
        });
      }
    };

    /** @param {MouseEvent | FocusEvent} e */
    const handle_leave = (e) => {
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
      /** @param {string | { text?: string, entity?: any, bracket_items?: any[] | null, description_owner?: any, incoming_only?: boolean, delay?: number } | null} new_param */
      update(new_param) {
        param = new_param;
        // If this node is the active target, sync the payload immediately
        if (tooltip_state.target === node && tooltip_state.active && !tooltip_state.pinned) {
          const payload = resolve_payload(param);
          if (payload.active_text) tooltip_state.text = payload.active_text;
          tooltip_state.entity = payload.resolved_entity;
          tooltip_state.bracket_items = payload.bracket_items;
          tooltip_state.description_owner = payload.description_owner;
          tooltip_state.incoming_only = payload.incoming_only;
        }
      },
      destroy() {
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
  import { Tooltip } from "bits-ui";
  import { scale } from "svelte/transition";

  let { entity_preview = null } = $props();

  let display_snapshot = $state({
    text: /** @type {string | null} */ (null),
    entity: /** @type {any} */ (null),
    bracket_items: /** @type {any[] | null} */ (null),
    description_owner: /** @type {any} */ (null),
    incoming_only: false,
    pinned: false,
    actions: /** @type {any[]} */ ([]),
  });

  $effect(() => {
    if (tooltip_state.active) {
      display_snapshot = {
        text: tooltip_state.text,
        entity: tooltip_state.entity,
        bracket_items: tooltip_state.bracket_items,
        description_owner: tooltip_state.description_owner,
        incoming_only: tooltip_state.incoming_only,
        pinned: tooltip_state.pinned,
        actions: tooltip_state.actions,
      };
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

    function handle_pointer_down(e) {
      const target = /** @type {HTMLElement | null} */ (e.target);
      if (target?.closest?.('[data-testid="relational-hover-card"]')) return;
      if (e.button === 2) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      unpin_tooltip();
    }

    function handle_context_menu(e) {
      const target = /** @type {HTMLElement | null} */ (e.target);
      if (target?.closest?.('[data-testid="relational-hover-card"]')) return;
      unpin_tooltip();
    }

    function handle_scroll() {
      unpin_tooltip();
    }

    function handle_blur() {
      unpin_tooltip();
    }

    function handle_key_down(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        unpin_tooltip();
      }
    }

    window.addEventListener("pointerdown", handle_pointer_down, true);
    window.addEventListener("contextmenu", handle_context_menu, true);
    window.addEventListener("scroll", handle_scroll, true);
    window.addEventListener("blur", handle_blur);
    window.addEventListener("keydown", handle_key_down, true);

    return () => {
      window.removeEventListener("pointerdown", handle_pointer_down, true);
      window.removeEventListener("contextmenu", handle_context_menu, true);
      window.removeEventListener("scroll", handle_scroll, true);
      window.removeEventListener("blur", handle_blur);
      window.removeEventListener("keydown", handle_key_down, true);
    };
  });
</script>

<Tooltip.Provider delayDuration={0}>
  <Tooltip.Root open={tooltip_state.active}>
    <Tooltip.Portal>
      {#if tooltip_state.target && (display_snapshot.text || (display_snapshot.entity && entity_preview))}
        <Tooltip.Content
          customAnchor={active_anchor}
          updatePositionStrategy="always"
          side="top"
          sideOffset={display_snapshot.entity ? 14 : 10}
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
                  transition:scale={{ duration: motion.is_reduced ? 0 : 150, start: 0.95, opacity: 0 }}>
                  {#if display_snapshot.entity && entity_preview}
                    <div data-testid="relational-hover-card">
                      {@render entity_preview({
                        entity: display_snapshot.entity,
                        bracket_items: display_snapshot.bracket_items,
                        description_owner: display_snapshot.description_owner,
                        incoming_only: display_snapshot.incoming_only,
                        pinned: display_snapshot.pinned,
                        actions: display_snapshot.actions,
                      })}
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
                      class="
                        isolate
                        w-max
                        max-w-100
                        transform-gpu
                        rounded-sharp
                        border
                        border-gunmetal
                        bg-chalk/95
                        px-tight
                        py-1.5
                        text-center
                        font-sans
                        text-xs/normal
                        tracking-normal
                        text-balance
                        whitespace-pre-line
                        text-frisk
                        normal-case
                        shadow-standard
                        backface-hidden
                      ">
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
