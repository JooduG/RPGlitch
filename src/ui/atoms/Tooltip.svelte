<script module>
  /**
   * @file Tooltip.svelte
   * @module TooltipSystem
   * Consolidated Tooltip Atom: State, Action, and Renderer.
   * Flattened architecture for maximum efficiency and zero-bloat.
   */

  /**
   * @typedef {Object} TooltipState
   * @property {string | null} text - Current tooltip text
   * @property {HTMLElement | null} target - The element currently being hovered
   * @property {boolean} active - Visibility toggle
   * @property {number} x - Horizontal position
   * @property {number} y - Vertical position
   */

  /**
   * Global reactive state for the tooltip system.
   * @type {TooltipState}
   */
  export const tooltip_state = $state({
    text: null,
    target: null,
    active: false,
    x: 0,
    y: 0,
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
      let rect = target.getBoundingClientRect();

      // Handle display: contents or elements with zero dimensions
      // by falling back to children's bounding box via Range API
      if (rect.width === 0 && rect.height === 0) {
        try {
          const range = document.createRange();
          range.selectNodeContents(target);
          const rangeRect = range.getBoundingClientRect();
          if (rangeRect.width > 0 || rangeRect.height > 0) {
            rect = rangeRect;
          }
        } catch {
          // Fallback to target rect if range fails
        }
      }

      tooltip_state.text = text;
      tooltip_state.target = target;
      tooltip_state.x = rect.left + rect.width / 2;
      tooltip_state.y = rect.top;
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
  import { portal } from "@utils/portal.js";
  import { scale } from "svelte/transition";
  import { resolve_px } from "@utils/dom.js";

  // --- RENDERER LOGIC ---
  /** @type {HTMLElement | null} */
  let tooltip_el = $state(null);
  let ready = $state(false);
  let transform_override = $state("translateX(-50%) translateY(-100%)");
  let flip_style = $state("");
  let arrow_flipped = $state(false);

  // Environmental tracking for reactivity to layout shifts
  let env_version = $state(0);

  $effect(() => {
    const handler = () => env_version++;
    window.addEventListener("resize", handler, { passive: true });
    window.addEventListener("scroll", handler, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, { capture: true });
    };
  });

  $effect(() => {
    if (!tooltip_state.active) ready = false;
  });

  $effect(() => {
    // Read env_version to trigger re-run on resize/scroll

    env_version;

    if (tooltip_state.active && tooltip_el) {
      const rect = tooltip_el.getBoundingClientRect();

      // 0. Load tokens dynamically (Chalk Regime)
      // Use document.documentElement as context for root tokens
      const padding = resolve_px("--spacing-3", 12, document.documentElement);

      let x_offset_px = 0;
      arrow_flipped = false;

      if (rect.right > window.innerWidth - padding) {
        x_offset_px = -(rect.right - (window.innerWidth - padding));
      } else if (rect.left < padding) {
        x_offset_px = padding - rect.left;
      }

      if (rect.top < padding && tooltip_state.target) {
        arrow_flipped = true;
        const target_rect = tooltip_state.target.getBoundingClientRect();
        flip_style = `top: calc(${target_rect.bottom}px + var(--spacing-2));`;
        transform_override = `translateX(-50%) translateY(0%) translateX(${x_offset_px}px)`;
      } else {
        flip_style = "";
        transform_override = `translateX(-50%) translateY(-100%) translateX(${x_offset_px}px)`;
      }

      requestAnimationFrame(() => {
        ready = true;
      });
    }
  });
</script>

{#if tooltip_state.active && tooltip_state.text}
  <!-- GLOBAL RENDERER INSTANCE -->
  <div
    use:portal
    class="tooltip-portal"
    bind:this={tooltip_el}
    class:ready
    style:left="{tooltip_state.x}px"
    style:top="calc({tooltip_state.y}px - var(--spacing-2))"
    style={flip_style}
    style:transform={transform_override}
    data-flipped={arrow_flipped}
  >
    {#if ready}
      <div class="tooltip-container" transition:scale={{ duration: 150, start: 0.95, opacity: 0 }}>
        <div class="tooltip-arrow"></div>
        <div class="tooltip-content">
          {tooltip_state.text}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .tooltip-portal {
    position: fixed;
    z-index: var(--max-z-index);
    pointer-events: none;
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
    filter: drop-shadow(var(--shadow-heavy));
  }

  .tooltip-content {
    background: var(--glass-peak);
    backdrop-filter: var(--glass-peak-blur);
    color: var(--color-white);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-standard);
    border: var(--spacing-pixel) solid rgb(from var(--color-white) r g b / var(--opacity-muted));
    font-size: var(--font-size-tiny);
    font-family: var(--font-family-base);
    text-transform: none;
    letter-spacing: normal;
    white-space: normal;
    width: max-content;
    max-width: 15rem;
    text-align: center;
    line-height: var(--font-height-short);
  }

  .tooltip-arrow {
    width: 0;
    height: 0;
    border-left: var(--spacing-2) solid transparent;
    border-right: var(--spacing-2) solid transparent;
    border-top: var(--spacing-2) solid rgb(from var(--color-white) r g b / var(--opacity-muted));
    position: absolute;
    bottom: calc(var(--spacing-2) * -1);
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--floor-z-index);
  }

  .tooltip-arrow::after {
    content: "";
    position: absolute;
    bottom: var(--spacing-pixel);
    left: calc(var(--spacing-2) * -1);
    border-left: var(--spacing-2) solid transparent;
    border-right: var(--spacing-2) solid transparent;
    border-top: var(--spacing-2) solid var(--background-base);
    opacity: var(--opacity-heavy);
  }

  .tooltip-portal[data-flipped="true"] .tooltip-arrow {
    top: calc(var(--spacing-2) * -1);
    bottom: auto;
    border-top: none;
    border-bottom: var(--spacing-2) solid rgb(from var(--color-white) r g b / var(--opacity-muted));
  }

  .tooltip-portal[data-flipped="true"] .tooltip-arrow::after {
    top: var(--spacing-pixel);
    bottom: auto;
    border-top: none;
    border-bottom: var(--spacing-2) solid var(--background-base);
  }
</style>
