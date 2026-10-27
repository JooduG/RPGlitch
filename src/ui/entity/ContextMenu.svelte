<!--
  src/ui/entity/ContextMenu.svelte
  📋 PORTALLED CONTEXT MENU COMPONENT
-->
<script>
  /**
   * @file src/ui/entity/ContextMenu.svelte
   * 📋 Portalled, Viewport-Clamped Context Menu Component
   */
  import { Button } from "@primitives";
  import { get_menu_epoch } from "./ContextMenu.svelte.js";

  /**
   * @typedef {Object} MenuItem
   * @property {string} [label]
   * @property {() => void} [onSelect]
   * @property {boolean} [disabled]
   * @property {boolean} [separator]
   * @property {boolean} [danger]
   * @property {boolean} [active]
   */

  /**
   * @typedef {Object} Props
   * @property {boolean} open
   * @property {number} x
   * @property {number} y
   * @property {number} epoch
   * @property {MenuItem[]} actions
   * @property {string} [signature_color]
   * @property {() => void} on_close
   */

  /** @type {Props} */
  let { open = $bindable(false), x = 0, y = 0, epoch = 0, actions = [], signature_color = "var(--color-slate-50)", on_close = () => {} } = $props();

  let clamped_x = $state(0);
  let clamped_y = $state(0);

  function portal_to_body(node) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function close() {
    open = false;
    on_close();
  }

  function handle_item_click(e, item) {
    e.stopPropagation();
    close();
    if (item.onSelect) item.onSelect();
  }

  // Close when another card/badge claims the menu epoch
  $effect(() => {
    const current = get_menu_epoch();
    if (open && current !== epoch) {
      close();
    }
  });

  // Clamping calculation when open or position changes
  $effect(() => {
    if (!open) return;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;

    if (x > vw / 2) {
      clamped_x = Math.max(0, x - 160);
    } else {
      clamped_x = Math.min(x, vw - 180);
    }

    if (y > vh / 2) {
      clamped_y = y - 200;
    } else {
      clamped_y = Math.min(y, vh - 200);
    }

    requestAnimationFrame(() => {
      const menu = document.body.querySelector('[role="menu"]');
      if (!menu) return;
      const { width, height } = menu.getBoundingClientRect();
      if (y > vh / 2) {
        clamped_y = y - height;
      }
      if (clamped_x + width > vw) clamped_x = vw - width;
      if (clamped_y + height > vh) clamped_y = vh - height;
      if (clamped_x < 0) clamped_x = 0;
      if (clamped_y < 0) clamped_y = 0;
    });
  });
</script>

<svelte:window onclick={close} onkeydown={(e) => e.key === "Escape" && close()} />

{#if open}
  <div
    use:portal_to_body
    class="fixed z-9999 min-w-40 overflow-hidden rounded-standard bg-glass-elevated shadow-(--shadow-standard) [backdrop-filter:var(--blur-mist)] outline-none
      before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(--noise-url) before:opacity-10 before:mix-blend-overlay"
    style="left:{clamped_x}px;top:{clamped_y}px;--signature-color:{signature_color}"
    role="menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && close()}
  >
    {#each actions as item, i (i)}
      {#if item.separator}
        <div class="block h-px bg-current opacity-20"></div>
      {:else}
        <Button
          variant="bare"
          class="
            flex h-9 w-full cursor-default items-center gap-2 px-2.5 text-xs font-bold tracking-widest text-slate-200 uppercase transition-colors duration-150 outline-none select-none hover:bg-(--signature-color,var(--color-slate-50))/10 hover:text-white
            {item.danger ? 'text-red-400/80 hover:text-red-400' : ''}
            {item.active ? 'text-(--signature-color,var(--color-slate-50))' : ''}
          "
          disabled={item.disabled}
          onclick={(e) => handle_item_click(e, item)}
          role="menuitem"
        >
          {#if item.active}
            <span
              class="size-1.5 shrink-0 rounded-full bg-(--signature-color,var(--color-slate-50)) shadow-[0_0_4px_var(--signature-color,var(--color-slate-50))]"
            ></span>
          {/if}
          {item.label}
        </Button>
      {/if}
    {/each}
  </div>
{/if}

<!--
CHANGELOG:
- Initial extraction of reusable ContextMenu component.
-->
