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
  import { portal } from "@ui/actions/portal.js";
  import { scale } from "svelte/transition";
  import { resolve_px } from "@ui/components/ui-helpers.js";

  // --- RENDERER LOGIC ---
  /** @type {HTMLElement | null} */
  let tooltip_el = $state(null);
  let ready = $state(false);
  let transform_override = $state("translateX(-50%) translateY(-100%)");
  let flip_style = $state("");
  let arrow_flipped = $state(false);

  // Environmental tracking for reactivity to layout and scroll shifts
  let scroll_version = $state(0);
  let layout_version = $state(0);
  let padding = $state(12);

  $effect(() => {
    const on_scroll = () => scroll_version++;
    const on_layout = () => {
      layout_version++;
      scroll_version++; // Layout shift usually requires repositioning
    };
    window.addEventListener("resize", on_layout, { passive: true });
    window.addEventListener("scroll", on_scroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", on_layout);
      window.removeEventListener("scroll", on_scroll, { capture: true });
    };
  });

  $effect(() => {
    if (tooltip_state.active) {
      // 1. Resolve tokens only when needed (activation or layout shift)
      // This prevents resolve_px (which triggers reflow) from running during scroll
      layout_version;
      padding = resolve_px("--spacing-3", 12, document.documentElement);
    }
  });

  $effect(() => {
    if (!tooltip_state.active) ready = false;
  });

  $effect(() => {
    // 2. High-frequency positioning logic
    scroll_version;

    if (tooltip_state.active && tooltip_el) {
      const rect = tooltip_el.getBoundingClientRect();

      // Use cached padding to avoid resolve_px/reflow during scroll
      const current_padding = padding;

      let x_offset_px = 0;
      arrow_flipped = false;

      if (rect.right > window.innerWidth - current_padding) {
        x_offset_px = -(rect.right - (window.innerWidth - current_padding));
      } else if (rect.left < current_padding) {
        x_offset_px = current_padding - rect.left;
      }

      if (rect.top < current_padding && tooltip_state.target) {
        arrow_flipped = true;
        const target_rect = tooltip_state.target.getBoundingClientRect();
        flip_style = `top: calc(${target_rect.bottom}px + var(--gap-standard));`;
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
    style:top="calc({tooltip_state.y}px - var(--gap-standard))"
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
    z-index: var(--z-index-modal);
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
    filter: drop-shadow(var(--shadow-standard));
  }

  .tooltip-content {
    background: var(--glass-peak);
    backdrop-filter: var(--blur-void);
    color: var(--pure-white);
    padding: var(--padding-tight) var(--padding-tight);
    border-radius: var(--radius-standard);
    border: var(--spacing-pixel) solid rgb(from var(--pure-white) r g b / var(--opacity-whisper));
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

  .tooltip-portal[data-flipped="true"] .tooltip-arrow {
    top: calc(var(--gap-standard) * -1);
    bottom: auto;
    border-top: none;
    border-bottom: var(--gap-standard) solid
      rgb(from var(--pure-white) r g b / var(--opacity-whisper));
  }

  .tooltip-portal[data-flipped="true"] .tooltip-arrow::after {
    top: var(--spacing-pixel);
    bottom: auto;
    border-top: none;
    border-bottom: var(--gap-standard) solid var(--chalk);
  }
</style>
