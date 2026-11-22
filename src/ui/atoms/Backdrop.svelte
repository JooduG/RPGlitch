<script>
  /**
   * @file src/ui/atoms/Backdrop.svelte
   * Viewport shielding overlay for modals, drawers, and panels.
   */
  import { motion } from "@media";
  import { use_actions } from "@utils";
  import { fade } from "svelte/transition";

  let {
    is_blurred = true,
    busy = false,
    is_pass_through = false,
    layer = "overlay",
    animate = true,
    onclick = undefined,
    class: className = "",
    children = null,
    actions = [],
    ...rest
  } = $props();

  const is_profile = $derived(className === "profile");
  const computed_z_index = $derived(
    layer === "sticky" || layer === "console" ? "var(--z-index-sticky)"
    : layer === "image" || layer === "lightbox" ? "calc(var(--z-index-modal) + 10)"
    : layer === "modal" ? "var(--z-index-modal)"
    : layer === "max" ? "var(--z-index-max)"
    : "var(--z-index-overlay)",
  );

  let pointer_down_target = null;

  function handle_pointerdown(e) {
    pointer_down_target = e.target;
  }

  function handle_click(e) {
    if (e.target === e.currentTarget && pointer_down_target === e.currentTarget) {
      onclick?.(e);
    }
  }

  /**
   * @param {HTMLElement} node
   * @returns {import("svelte/transition").TransitionConfig}
   */
  function backdrop_transition(node) {
    if (!animate || is_profile) {
      return { duration: 0, css: () => "" };
    }
    return fade(node, { duration: motion.is_reduced ? 0 : 150 });
  }
</script>

<div
  {...rest}
  class={[
    "fixed inset-0 cursor-default overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(22,36,59,0.3),rgba(0,0,0,0.3))] select-none [-webkit-tap-highlight-color:transparent]",
    is_pass_through ? "pointer-events-none" : "pointer-events-auto",
    is_blurred && "backdrop-blur-lg backdrop-brightness-90 backdrop-saturate-40",
    busy && "pointer-events-none cursor-wait",
    className,
  ]}
  style:z-index={computed_z_index}
  data-modal-layer={layer}
  onpointerdown={handle_pointerdown}
  onclick={handle_click}
  transition:backdrop_transition
  use:use_actions={actions}>
  <div class={["pointer-events-none flex min-h-full w-full items-center justify-center", is_profile ? "p-0" : "p-standard"]}>
    <div class="contents [&>*:not(.pointer-events-none)]:pointer-events-auto">
      {@render children?.()}
    </div>
  </div>
</div>
