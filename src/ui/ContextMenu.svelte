<!--
  src/ui/entity/ContextMenu.svelte
  📋 PORTALLED CONTEXT MENU COMPONENT
-->
<script>
  /**
   * @file src/ui/entity/ContextMenu.svelte
   * 📋 Portalled, Viewport-Clamped Context Menu Component
   */
  import { Button, set_tooltip_suppressed } from "@primitives";
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
   * @property {boolean} [open]
   * @property {number} [x]
   * @property {number} [y]
   * @property {number} [epoch]
   * @property {MenuItem[]} [actions]
   * @property {string} [target_name]
   * @property {string} [signature_color]
   * @property {boolean} [embedded]
   * @property {() => void} [on_close]
   */

  /** @type {Props} */
  let {
    open = $bindable(false),
    x = 0,
    y = 0,
    epoch = 0,
    actions = [],
    target_name = "",
    signature_color = "var(--color-slate-50)",
    embedded = false,
    on_close = () => {},
  } = $props();

  let clamped_x = $state(0);
  let clamped_y = $state(0);
  /** @type {HTMLElement | null} */
  let menu_el = $state(null);

  function portal_to_body(node) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function close() {
    if (!open) return;
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
    if (embedded) return;
    const current = get_menu_epoch();
    if (open && current !== epoch) {
      close();
    }
  });

  // Suppress hover tooltips and bind capture-phase outside-dismissal while standalone menu is open
  $effect(() => {
    if (embedded || !open) return;
    set_tooltip_suppressed(true);

    const handle_outside_pointer = (e) => {
      if (menu_el && e.target instanceof Node && menu_el.contains(e.target)) return;
      close();
    };
    const handle_scroll = () => close();
    const handle_blur = () => close();
    const handle_keydown = (e) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("pointerdown", handle_outside_pointer, true);
    window.addEventListener("contextmenu", handle_outside_pointer, true);
    window.addEventListener("scroll", handle_scroll, true);
    window.addEventListener("blur", handle_blur);
    window.addEventListener("keydown", handle_keydown);

    return () => {
      window.removeEventListener("pointerdown", handle_outside_pointer, true);
      window.removeEventListener("contextmenu", handle_outside_pointer, true);
      window.removeEventListener("scroll", handle_scroll, true);
      window.removeEventListener("blur", handle_blur);
      window.removeEventListener("keydown", handle_keydown);
      set_tooltip_suppressed(false);
    };
  });

  // Clamping calculation when open or position changes (standalone mode)
  $effect(() => {
    if (embedded || !open) return;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;

    if (x > vw / 2) {
      clamped_x = Math.max(0, x - 180);
    } else {
      clamped_x = Math.min(x, vw - 180);
    }

    if (y > vh / 2) {
      clamped_y = y - 200;
    } else {
      clamped_y = Math.min(y, vh - 200);
    }

    requestAnimationFrame(() => {
      const menu = menu_el || document.body.querySelector('[role="menu"]');
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

{#snippet menu_body()}
  {#if target_name}
    <div class="border-b border-white/10 px-2.5 py-1.5 text-left">
      <div class="truncate font-heading text-xs font-bold tracking-wider uppercase" style="color: {signature_color};">
        {target_name}
      </div>
    </div>
  {/if}
  {#if actions.length === 0}
    <div class="px-2.5 py-2 text-left text-xs leading-snug text-slate-300/80 select-none">
      Contextual actions for this entity will appear here when available. None are currently active.
    </div>
  {:else}
    <div class="flex flex-col py-0.5">
      {#each actions as item, i (i)}
        {#if item.separator}
          <div class="my-0.5 block h-px bg-white/10"></div>
        {:else}
          <Button
            variant="bare"
            class="
              flex min-h-8 w-full cursor-pointer items-center gap-tight px-2.5 py-1 text-left text-xs font-bold tracking-wider text-slate-200 uppercase transition-colors duration-150 outline-none select-none hover:bg-(--signature-color,var(--color-slate-50))/15 hover:text-white
              {item.danger ? 'text-red-400/80 hover:text-red-400' : ''}
              {item.active ? 'text-(--signature-color,var(--color-slate-50))' : ''}
            "
            disabled={item.disabled}
            onclick={(e) => handle_item_click(e, item)}
            role="menuitem">
            {#if item.active}
              <span
                class="size-1.5 shrink-0 rounded-full bg-(--signature-color,var(--color-slate-50)) shadow-[0_0_4px_var(--signature-color,var(--color-slate-50))]"
              ></span>
            {/if}
            <span class="truncate">{item.label}</span>
          </Button>
        {/if}
      {/each}
    </div>
  {/if}
{/snippet}

{#if embedded}
  <div
    bind:this={menu_el}
    class="relative flex h-full w-full flex-col overflow-y-auto rounded-[inherit] border bg-slate-950/95 shadow-standard [backdrop-filter:var(--blur-mist)] outline-none
      before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(--noise-url) before:opacity-10 before:mix-blend-overlay"
    style:--signature-color={signature_color}
    style:border-color="color-mix(in srgb, var(--signature-color) 45%, transparent)"
    role="menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && close()}>
    {@render menu_body()}
  </div>
{:else if open}
  <div
    bind:this={menu_el}
    use:portal_to_body
    class="fixed max-w-60 min-w-44 overflow-hidden rounded-standard border bg-slate-950/95 shadow-standard [backdrop-filter:var(--blur-mist)] outline-none
      before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(--noise-url) before:opacity-10 before:mix-blend-overlay"
    style="left:{clamped_x}px;top:{clamped_y}px;--signature-color:{signature_color};z-index:var(--z-index-tooltip)"
    style:border-color="color-mix(in srgb, var(--signature-color) 45%, transparent)"
    role="menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && close()}>
    {@render menu_body()}
  </div>
{/if}

<!--
CHANGELOG:
- Initial extraction of reusable ContextMenu component.
-->
