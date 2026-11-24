<script module>
  const LAYER_Z = {
    sticky: "var(--z-index-sticky)",
    console: "var(--z-index-sticky)",
    image: "calc(var(--z-index-modal) + 10)",
    lightbox: "calc(var(--z-index-modal) + 10)",
    modal: "var(--z-index-modal)",
    max: "var(--z-index-max)",
  };
</script>

<script>
  /**
   * @file src/ui/atoms/Backdrop.svelte
   * Viewport shielding overlay for modals, drawers, and panels.
   */
  import { motion } from "@media";
  import { fade } from "svelte/transition";

  let { busy = false, layer = "overlay", animate = true, onclick = undefined, class: className = "", children = null, ...rest } = $props();

  const computed_z_index = $derived(LAYER_Z[layer] || "var(--z-index-overlay)");

  /** @type {EventTarget | null} */
  let pointer_down_target = null;

  function backdrop_transition(node) {
    if (!animate) return { duration: 0, css: () => "" };
    return fade(node, { duration: motion.is_reduced ? 0 : 150 });
  }
</script>

<div
  {...rest}
  class={[
    "pointer-events-auto fixed inset-0 cursor-default overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(22,36,59,0.3),rgba(0,0,0,0.3))] backdrop-blur-lg backdrop-brightness-90 backdrop-saturate-40 select-none [-webkit-tap-highlight-color:transparent]",
    busy && "pointer-events-none cursor-wait",
    className,
  ]}
  style:z-index={computed_z_index}
  data-modal-layer={layer}
  onpointerdown={(e) => (pointer_down_target = e.target)}
  onclick={(e) => {
    if (e.target === e.currentTarget && pointer_down_target === e.currentTarget) onclick?.(e);
  }}
  transition:backdrop_transition>
  <div class="pointer-events-none flex min-h-full w-full items-center justify-center p-standard [&>*:not(.pointer-events-none)]:pointer-events-auto">
    {@render children?.()}
  </div>
</div>
