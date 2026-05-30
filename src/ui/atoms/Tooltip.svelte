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
              <div {...wrapperProps} class="tooltip-portal ready">
                <div
                  {...props}
                  class="tooltip-container"
                  transition:scale={{ duration: 150, start: 0.95, opacity: 0 }}
                >
                  <div class="tooltip-arrow"></div>
                  <div class="tooltip-content">
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

<style>
  .tooltip-portal {
    position: fixed !important;
    z-index: var(--z-index-max) !important;
    pointer-events: none !important;
    will-change: transform, opacity;
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0;
  }

  .tooltip-portal.ready {
    opacity: 1;
  }

  .tooltip-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    filter: drop-shadow(var(--shadow-standard));
  }

  .tooltip-content {
    padding: var(--padding-tight) var(--padding-tight);
    border-radius: var(--radius-standard);
    font-size: var(--font-size-tiny);
    font-family: var(--font-family-base);
    text-transform: none;
    letter-spacing: normal;
    white-space: normal;
    width: max-content;
    max-width: calc(var(--spacing-unit) * 60);
    text-align: center;
    line-height: var(--font-height-base);
  }

  .tooltip-panel,
  [role="tooltip"],
  .tooltip-content {
    background: rgb(from var(--chalk) r g b / 0.98) !important;
    border: var(--border-width-base) solid var(--signature-color, var(--frisk)) !important;
    box-shadow: var(--shadow-standard) !important;
    color: var(--pure-white) !important;

    /* Force Hardware Compositor Layer Separation */
    isolation: isolate;
    transform: translateZ(0);
    backface-visibility: hidden;
  }

  .tooltip-arrow {
    width: 0;
    height: 0;
    border-left: var(--gap-standard) solid transparent;
    border-right: var(--gap-standard) solid transparent;
    border-top: var(--gap-standard) solid rgb(from var(--pure-white) r g b / var(--opacity-whisper));
    position: absolute;
    bottom: calc(var(--gap-standard) * -1);
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-index-base);
  }

  .tooltip-arrow::after {
    content: "";
    position: absolute;
    bottom: var(--spacing-pixel);
    left: calc(var(--gap-standard) * -1);
    border-left: var(--gap-standard) solid transparent;
    border-right: var(--gap-standard) solid transparent;
    border-top: var(--gap-standard) solid var(--chalk);
    opacity: var(--opacity-whisper);
  }

  .tooltip-container[data-side="bottom"] .tooltip-arrow {
    top: calc(var(--gap-standard) * -1);
    bottom: auto;
    border-top: none;
    border-bottom: var(--gap-standard) solid
      rgb(from var(--pure-white) r g b / var(--opacity-whisper));
  }

  .tooltip-container[data-side="bottom"] .tooltip-arrow::after {
    top: var(--spacing-pixel);
    bottom: auto;
    border-top: none;
    border-bottom: var(--gap-standard) solid var(--chalk);
  }
</style>
