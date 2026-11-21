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
   * @property {string} [portrait_src]
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
    portrait_src = "",
    signature_color = "var(--color-frisk)",
    embedded = false,
    on_close = () => {},
  } = $props();

  /** @type {HTMLElement | null} */
  let menu_el = $state(null);

  /**
   * Appends the standalone menu to `document.body` and clamps coordinates
   * synchronously on mount and position updates so there is no 1-frame jump.
   * @param {HTMLElement} node
   * @param {{ x: number, y: number }} coords
   */
  function portal_and_clamp(node, coords) {
    document.body.appendChild(node);

    const apply_position = ({ x: raw_x, y: raw_y }) => {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
      const vh = typeof window !== "undefined" ? window.innerHeight : 768;
      const w = node.offsetWidth || 180;
      const h = node.offsetHeight || 160;
      const clamped_x = Math.max(0, Math.min(raw_x > vw / 2 ? raw_x - w : raw_x, vw - w));
      const clamped_y = Math.max(0, Math.min(raw_y > vh / 2 ? raw_y - h : raw_y, vh - h));
      node.style.left = `${clamped_x}px`;
      node.style.top = `${clamped_y}px`;
    };

    apply_position(coords);

    return {
      update(next_coords) {
        apply_position(next_coords);
      },
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
      if (e.type === "pointerdown" && e.button === 2) return;
      if (e.type === "pointerdown") {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      close();
    };
    const handle_scroll = () => close();
    const handle_blur = () => close();
    const handle_keydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
    };

    window.addEventListener("pointerdown", handle_outside_pointer, true);
    window.addEventListener("contextmenu", handle_outside_pointer, true);
    window.addEventListener("scroll", handle_scroll, true);
    window.addEventListener("blur", handle_blur);
    window.addEventListener("keydown", handle_keydown, true);

    return () => {
      window.removeEventListener("pointerdown", handle_outside_pointer, true);
      window.removeEventListener("contextmenu", handle_outside_pointer, true);
      window.removeEventListener("scroll", handle_scroll, true);
      window.removeEventListener("blur", handle_blur);
      window.removeEventListener("keydown", handle_keydown, true);
      set_tooltip_suppressed(false);
    };
  });
</script>

{#snippet menu_shell_layers()}
  {#if embedded && portrait_src}
    <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
      <img src={portrait_src} alt="" class="h-full w-full scale-110 -scale-x-100 object-cover opacity-whisper blur-md brightness-muted" />
      <div class="absolute inset-0 bg-[color-mix(in_srgb,var(--signature-color)_10%,var(--color-background-gradient-1))]/80"></div>
    </div>
  {/if}
  <div class="pointer-events-none absolute inset-0 bg-(image:--noise-url) opacity-ghost mix-blend-overlay" aria-hidden="true"></div>
{/snippet}

{#snippet menu_body()}
  {#if target_name}
    <header class="relative z-10 border-b border-white/10 px-standard py-tight text-left">
      <div class="truncate pb-0.5 font-heading text-sm font-bold tracking-normal text-(--signature-color) text-shadow-(--shadow-ambient)">
        {target_name}
      </div>
    </header>
  {/if}
  {#if actions.length === 0}
    <div
      class={[
        "relative z-10 flex font-mono text-xs tracking-wide text-frisk/50 select-none",
        embedded ? "flex-1 items-center justify-center p-standard text-center" : "items-center px-standard py-3 text-left",
      ]}>
      No actions available
    </div>
  {:else}
    <div class="relative z-10 flex min-h-0 flex-1 scrollbar-none flex-col gap-0.5 overflow-y-auto p-tight [&::-webkit-scrollbar]:hidden">
      {#each actions as item, i (i)}
        {#if item.separator}
          <div class="my-1 block h-px shrink-0 bg-white/10"></div>
        {:else}
          <Button
            variant="bare"
            class={[
              "flex min-h-8 w-full shrink-0 cursor-pointer items-center gap-tight rounded-sharp px-tight py-1.5 text-left font-sans text-xs font-medium tracking-wide transition-[background-color,color,transform] duration-fast ease-out outline-none select-none active:scale-sink disabled:cursor-not-allowed disabled:opacity-30",
              item.danger ? "text-crimson-red/90 hover:bg-crimson-red/15 hover:text-crimson-red"
              : item.active ? "text-(--signature-color) hover:bg-[color-mix(in_srgb,var(--signature-color)_16%,transparent)] hover:text-pure-white"
              : "text-frisk/90 hover:bg-[color-mix(in_srgb,var(--signature-color)_16%,transparent)] hover:text-pure-white",
            ]}
            disabled={item.disabled}
            onclick={(e) => handle_item_click(e, item)}
            role="menuitem">
            {#if item.active}
              <span class="size-1.5 shrink-0 rounded-full bg-(--signature-color) shadow-(--signature-glow)"></span>
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
    class="relative isolate flex h-full w-full flex-col overflow-hidden rounded-standard bg-[color-mix(in_srgb,var(--signature-color)_7%,var(--color-glass-sunken))] shadow-standard [backdrop-filter:var(--blur-mist)] outline-none
      before:pointer-events-none before:absolute before:inset-0 before:z-20 before:rounded-[inherit] before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--signature-color)_65%,transparent),rgb(from_var(--color-frisk)_r_g_b/0.12)_35%,transparent_85%)] before:mask-border-solid before:p-px before:content-['']"
    style:--signature-color={signature_color}
    role="menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && close()}>
    {@render menu_shell_layers()}
    {@render menu_body()}
  </div>
{:else if open}
  <div
    bind:this={menu_el}
    use:portal_and_clamp={{ x, y }}
    class="fixed isolate z-tooltip flex max-w-72 min-w-48 flex-col overflow-hidden rounded-standard bg-[color-mix(in_srgb,var(--signature-color)_7%,var(--color-glass-sunken))] shadow-standard [backdrop-filter:var(--blur-mist)] outline-none
      before:pointer-events-none before:absolute before:inset-0 before:z-20 before:rounded-[inherit] before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--signature-color)_65%,transparent),rgb(from_var(--color-frisk)_r_g_b/0.12)_35%,transparent_85%)] before:mask-border-solid before:p-px before:content-['']"
    style:--signature-color={signature_color}
    role="menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && close()}>
    {@render menu_shell_layers()}
    {@render menu_body()}
  </div>
{/if}

<!--
CHANGELOG:
- Initial extraction of reusable ContextMenu component.
-->
