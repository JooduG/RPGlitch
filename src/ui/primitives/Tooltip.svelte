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
   * @property {HTMLElement | null} target - The element currently being hovered
   * @property {boolean} active - Visibility toggle
   * @property {number} x - Viewport cursor X coordinate
   * @property {number} y - Viewport cursor Y coordinate
   * @property {boolean} has_cursor - Whether cursor tracking should anchor the tooltip
   */

  /**
   * Global reactive state for the tooltip system.
   * @type {TooltipState}
   */
  export const tooltip_state = $state({ text: null, entity: null, target: null, active: false, x: 0, y: 0, has_cursor: false });

  /** @type {number | null} */
  let timer = null;

  /**
   * Triggers the tooltip visibility with a slight delay for kinetic comfort.
   * @param {HTMLElement} target
   * @param {string | null} text
   * @param {any | null} [entity]
   */
  export function show_tooltip(target, text, entity = null) {
    if (!text && !entity) return;
    hide_tooltip();

    const delay = entity ? 120 : 400;
    timer = window.setTimeout(() => {
      tooltip_state.text = text || null;
      tooltip_state.entity = entity || null;
      tooltip_state.target = target;
      tooltip_state.active = true;
    }, delay);
  }

  /**
   * Immediately hides the tooltip and clears active timers.
   */
  export function hide_tooltip() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
    // Defer state mutation to avoid Svelte 5 state_unsafe_mutation.
    // DOM removal during unmount can trigger synchronous `mouseout` or `blur` events,
    // which execute this function while Svelte is in the middle of a reactive teardown.
    setTimeout(() => {
      tooltip_state.active = false;
      tooltip_state.text = null;
      tooltip_state.entity = null;
      tooltip_state.target = null;
    }, 0);
  }

  /**
   * Svelte Action: use:tooltip
   * @param {HTMLElement} node
   * @param {string | { text?: string, entity?: any } | null} param
   */
  export function tooltip(node, param) {
    const resolve_payload = (input) => {
      const resolved_text = typeof input === "object" ? input?.text : input;
      const resolved_entity = typeof input === "object" ? (input?.entity ?? null) : null;
      const active_text = resolved_text || node.getAttribute("aria-label") || node.getAttribute("title") || null;
      return { active_text, resolved_entity };
    };

    /** @param {MouseEvent | PointerEvent} e */
    const handle_move = (e) => {
      tooltip_state.x = e.clientX;
      tooltip_state.y = e.clientY;
      tooltip_state.has_cursor = true;
    };

    /** @param {MouseEvent | FocusEvent} e */
    const handle_enter = (e) => {
      if (e instanceof MouseEvent && e.type === "mouseover" && node.contains(/** @type {Node} */ (e.relatedTarget))) return;

      if (e instanceof MouseEvent) {
        tooltip_state.x = e.clientX;
        tooltip_state.y = e.clientY;
        tooltip_state.has_cursor = true;
      } else {
        tooltip_state.has_cursor = false;
      }

      const { active_text, resolved_entity } = resolve_payload(param);

      if (active_text || resolved_entity) {
        if (node.hasAttribute("title")) {
          node.dataset.tooltipTitle = node.getAttribute("title") || "";
          node.setAttribute("title", "");
        }
        show_tooltip(node, active_text, resolved_entity);
      }
    };

    /** @param {MouseEvent | FocusEvent} e */
    const handle_leave = (e) => {
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
      /** @param {string | { text?: string, entity?: any } | null} new_param */
      update(new_param) {
        param = new_param;
        // If this node is the active target, sync the payload immediately
        if (tooltip_state.target === node && tooltip_state.active) {
          const { active_text, resolved_entity } = resolve_payload(param);
          if (active_text) tooltip_state.text = active_text;
          tooltip_state.entity = resolved_entity;
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
          hide_tooltip();
        }
      },
    };
  }
</script>

<script>
  import { Tooltip } from "bits-ui";
  import { scale } from "svelte/transition";

  let { entity_preview = null } = $props();

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
</script>

<Tooltip.Provider delayDuration={0}>
  <Tooltip.Root open={tooltip_state.active}>
    <Tooltip.Portal>
      {#if tooltip_state.target && (tooltip_state.text || (tooltip_state.entity && entity_preview))}
        <Tooltip.Content
          customAnchor={active_anchor}
          updatePositionStrategy="always"
          side="top"
          sideOffset={tooltip_state.entity ? 14 : 10}
          align="center"
          avoidCollisions={true}
          strategy="fixed"
          forceMount>
          {#snippet child({ wrapperProps, props, open })}
            {#if open}
              <div {...wrapperProps} class="{wrapperProps?.class || ''} pointer-events-none" style:z-index="var(--z-index-tooltip)">
                <div
                  {...props}
                  class="{props.class}

                    group
                    pointer-events-none
                    relative
                    flex
                    origin-(--transform-origin)
                    flex-col
                    items-center
                    drop-shadow-lg
                    transition-opacity
                    duration-fast
                    ease-out

                    {open ? 'opacity-100' : 'opacity-0'}"
                  transition:scale={{ duration: 150, start: 0.95, opacity: 0 }}>
                  {#if tooltip_state.entity && entity_preview}
                    {@render entity_preview(tooltip_state.entity)}
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
                        group-data-[side=bottom]:border-b-slate-600

                        group-data-[side=top]:bottom-[-8px]
                        group-data-[side=top]:border-x-8
                        group-data-[side=top]:border-t-8
                        group-data-[side=top]:border-x-transparent
                        group-data-[side=top]:border-t-slate-600
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
                          group-data-[side=bottom]:border-b-neutral-900

                          group-data-[side=top]:bottom-px
                          group-data-[side=top]:border-x-8
                          group-data-[side=top]:border-t-8
                          group-data-[side=top]:border-x-transparent
                          group-data-[side=top]:border-t-neutral-900
                        ">
                      </div>
                    </div>

                    <div
                      class="
                        isolate
                        w-max
                        max-w-100
                        transform-gpu
                        rounded-md
                        border
                        border-slate-600
                        bg-neutral-900/98
                        px-tight
                        py-1.5
                        text-center
                        font-sans
                        text-xs/normal
                        tracking-normal
                        text-balance
                        whitespace-pre-line
                        text-slate-50
                        normal-case
                        backface-hidden
                      ">
                      {tooltip_state.text}
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
