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
   * @property {HTMLElement | null} target - The element currently being hovered
   * @property {boolean} active - Visibility toggle
   */

  /**
   * Global reactive state for the tooltip system.
   * @type {TooltipState}
   */
  export const tooltip_state = $state({
    text: null,
    target: null,
    active: false,
  });

  /** @type {number | null} */
  let timer = null;

  /**
   * Triggers the tooltip visibility with a slight delay for kinetic comfort.
   * @param {HTMLElement} target
   * @param {string} text
   */
  export function show_tooltip(target, text) {
    if (!text) return;
    hide_tooltip();

    timer = window.setTimeout(() => {
      tooltip_state.text = text;
      tooltip_state.target = target;
      tooltip_state.active = true;
    }, 400); // Standard Nordic response (400ms)
  }

  /**
   * Immediately hides the tooltip and clears active timers.
   */
  export function hide_tooltip() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
    tooltip_state.active = false;
    tooltip_state.text = null;
    tooltip_state.target = null;
  }

  /**
   * Svelte Action: use:tooltip
   * @param {HTMLElement} node
   * @param {string | {text: string} | null} text
   */
  export function tooltip(node, text) {
    /** @param {MouseEvent | FocusEvent} e */
    const handle_enter = (e) => {
      if (
        e instanceof MouseEvent &&
        e.type === "mouseover" &&
        node.contains(/** @type {Node} */ (e.relatedTarget))
      )
        return;

      // Robustly handle both string and object parameters (use:tooltip={{ text: "..." }})
      const resolved_text = typeof text === "object" ? text?.text : text;
      const active_text =
        resolved_text || node.getAttribute("aria-label") || node.getAttribute("title");

      if (active_text) {
        if (node.hasAttribute("title")) {
          node.dataset.tooltipTitle = node.getAttribute("title") || "";
          node.setAttribute("title", "");
        }
        show_tooltip(node, active_text);
      }
    };

    /** @param {MouseEvent | FocusEvent} e */
    const handle_leave = (e) => {
      if (
        e instanceof MouseEvent &&
        e.type === "mouseout" &&
        node.contains(/** @type {Node} */ (e.relatedTarget))
      )
        return;
      if (node.dataset.tooltipTitle) {
        node.setAttribute("title", node.dataset.tooltipTitle);
        delete node.dataset.tooltipTitle;
      }
      hide_tooltip();
    };

    node.addEventListener("mouseover", handle_enter);
    node.addEventListener("mouseout", handle_leave);
    node.addEventListener("focusin", handle_enter);
    node.addEventListener("focusout", handle_leave);

    return {
      /** @param {string | {text: string} | null} new_text */
      update(new_text) {
        text = new_text;
        // If this node is the active target, sync the text immediately
        if (tooltip_state.target === node && tooltip_state.active) {
          const resolved_text = typeof text === "object" ? text?.text : text;
          const active_text =
            resolved_text || node.getAttribute("aria-label") || node.getAttribute("title");
          if (active_text) tooltip_state.text = active_text;
        }
      },
      destroy() {
        node.removeEventListener("mouseover", handle_enter);
        node.removeEventListener("mouseout", handle_leave);
        node.removeEventListener("focusin", handle_enter);
        node.removeEventListener("focusout", handle_leave);
        if (node.dataset.tooltipTitle) {
          node.setAttribute("title", node.dataset.tooltipTitle);
          delete node.dataset.tooltipTitle;
        }
        if (tooltip_state.target === node) hide_tooltip();
      },
    };
  }
</script>

<script>
  import { Tooltip } from "bits-ui";
  import { scale } from "svelte/transition";
</script>

<Tooltip.Provider delayDuration={0}>
  <Tooltip.Root open={tooltip_state.active}>
    <Tooltip.Portal>
      {#if tooltip_state.target && tooltip_state.text}
        <Tooltip.Content
          customAnchor={tooltip_state.target}
          side="top"
          sideOffset={8}
          align="center"
          avoidCollisions={true}
          strategy="fixed"
          forceMount
        >
          {#snippet child({ wrapperProps, props, open })}
            {#if open}
              <div
                {...wrapperProps}
                class="
                  pointer-events-none fixed z-999 flex flex-col items-center
                  transition-opacity duration-150
                  will-change-[transform,opacity]
                  {open ? 'opacity-100' : 'opacity-0'}"
              >
                <div
                  {...props}
                  class="{props.class}
                    group relative flex flex-col items-center drop-shadow-lg
                  "
                  transition:scale={{ duration: 150, start: 0.95, opacity: 0 }}
                >
                  <div
                    class="
                      absolute left-1/2 z-0 size-0 -translate-x-1/2
                      group-data-[side=bottom]:top-[-8px]
                      group-data-[side=bottom]:border-x-8
                      group-data-[side=bottom]:border-b-8
                      group-data-[side=bottom]:border-x-transparent
                      group-data-[side=bottom]:border-b-slate-400
                      group-data-[side=top]:bottom-[-8px]
                      group-data-[side=top]:border-x-8
                      group-data-[side=top]:border-t-8
                      group-data-[side=top]:border-x-transparent
                      group-data-[side=top]:border-t-slate-400
                    "
                  >
                    <div
                      class="
                        absolute left-1/2 size-0 -translate-x-1/2
                        group-data-[side=bottom]:top-px
                        group-data-[side=bottom]:border-x-8
                        group-data-[side=bottom]:border-b-8
                        group-data-[side=bottom]:border-x-transparent
                        group-data-[side=bottom]:border-b-slate-900
                        group-data-[side=top]:bottom-px
                        group-data-[side=top]:border-x-8
                        group-data-[side=top]:border-t-8
                        group-data-[side=top]:border-x-transparent
                        group-data-[side=top]:border-t-slate-900
                      "
                    ></div>
                  </div>

                  <div
                    class="
                      isolate w-max max-w-[240px] transform-gpu rounded-md
                      border border-slate-400 bg-slate-900/98 px-2 py-1.5
                      text-center font-sans text-xs/normal tracking-normal
                      whitespace-normal text-slate-100 normal-case
                      backface-hidden
                    "
                  >
                    {tooltip_state.text}
                  </div>
                </div>
              </div>
            {/if}
          {/snippet}
        </Tooltip.Content>
      {/if}
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
