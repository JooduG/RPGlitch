<script context="module">
  /**
   * @file Tooltip.svelte
   * @module TooltipSystem
   * Consolidated Tooltip Atom: State, Action, Wrapper, and Renderer.
   */

  class TooltipManager {
    state = $state({
      text: null,
      target: null,
      active: false,
      x: 0,
      y: 0,
    });

    #timer = null;

    show(target, text) {
      if (!text) return;
      this.hide();
      this.#timer = window.setTimeout(() => {
        const rect = target.getBoundingClientRect();
        this.state.text = text;
        this.state.target = target;
        this.state.x = rect.left + rect.width / 2;
        this.state.y = rect.top;
        this.state.active = true;
      }, 500);
    }

    hide() {
      if (this.#timer) {
        window.clearTimeout(this.#timer);
        this.#timer = null;
      }
      this.state.active = false;
      this.state.text = null;
      this.state.target = null;
    }
  }

  export const tooltip_manager = new TooltipManager();

  /**
   * Svelte Action: use:tooltip
   */
  export function tooltip(node, text) {
    const handle_enter = (e) => {
      if (e.type === "mouseover" && node.contains(e.relatedTarget)) return;
      const active_text = text || node.getAttribute("aria-label") || node.getAttribute("title");
      if (active_text) {
        if (node.hasAttribute("title")) {
          node.dataset.tooltipTitle = node.getAttribute("title");
          node.setAttribute("title", "");
        }
        tooltip_manager.show(node, active_text);
      }
    };

    const handle_leave = (e) => {
      if (e.type === "mouseout" && node.contains(e.relatedTarget)) return;
      if (node.dataset.tooltipTitle) {
        node.setAttribute("title", node.dataset.tooltipTitle);
        delete node.dataset.tooltipTitle;
      }
      tooltip_manager.hide();
    };

    node.addEventListener("mouseover", handle_enter);
    node.addEventListener("mouseout", handle_leave);
    node.addEventListener("focusin", handle_enter);
    node.addEventListener("focusout", handle_leave);

    return {
      update(new_text) {
        text = new_text;
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
        if (tooltip_manager.state.target === node) tooltip_manager.hide();
      },
    };
  }
</script>

<script>
  import { portal } from "@utils/portal.js";
  import { scale } from "svelte/transition";

  /** @type {{text?: string, children?: import('svelte').Snippet}} */
  let { text, children } = $props();

  // --- RENDERER LOGIC ---
  const { state: tooltip_state } = tooltip_manager;
  let tooltip_el = $state(null);
  let ready = $state(false);
  let transform_override = $state("translateX(-50%) translateY(-100%)");
  let flip_style = $state("");
  let arrow_flipped = $state(false);

  $effect(() => {
    if (!tooltip_state.active) ready = false;
  });

  $effect(() => {
    if (tooltip_state.active && tooltip_el) {
      const rect = tooltip_el.getBoundingClientRect();
      const padding = 12;
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
        flip_style = `top: ${target_rect.bottom + 8}px;`;
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

{#if children}
  <div class="tooltip-trigger" use:tooltip={text}>
    {@render children()}
  </div>
{:else if text}
  <span use:tooltip={text} class="tooltip-dot"></span>
{:else if tooltip_state.active && tooltip_state.text}
  <!-- GLOBAL RENDERER INSTANCE -->
  <div
    use:portal
    class="tooltip-portal"
    bind:this={tooltip_el}
    class:ready
    style:left="{tooltip_state.x}px"
    style:top="{tooltip_state.y - 8}px"
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
  .tooltip-trigger {
    display: contents;
  }

  .tooltip-dot {
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--color-chalk);
    opacity: 0.5;
  }

  .tooltip-portal {
    position: fixed;
    z-index: var(--z-index-max);
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
    filter: drop-shadow(var(--shadow-m));
  }

  .tooltip-content {
    background: var(--glass-xl);
    backdrop-filter: var(--blur-l);
    color: var(--color-white);
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--border-radius-m);
    border: var(--border-xl);
    font-size: var(--font-size-xs);
    font-family: var(--font-family-body);
    text-transform: none;
    letter-spacing: normal;
    white-space: normal;
    width: max-content;
    max-width: 14rem;
    text-align: center;
    line-height: var(--line-height-s);
  }

  .tooltip-arrow {
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid var(--border-color, rgb(var(--color-white-rgb) / 20%));
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
  }

  .tooltip-arrow::after {
    content: "";
    position: absolute;
    bottom: 2px;
    left: -6px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid var(--color-frozen);
    opacity: 0.4;
  }

  .tooltip-portal[data-flipped="true"] .tooltip-arrow {
    top: -6px;
    bottom: auto;
    border-top: none;
    border-bottom: 6px solid var(--border-color, rgb(var(--color-white-rgb) / 20%));
  }

  .tooltip-portal[data-flipped="true"] .tooltip-arrow::after {
    top: 2px;
    bottom: auto;
    border-top: none;
    border-bottom: 6px solid var(--color-frozen);
  }
</style>
