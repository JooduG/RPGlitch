<script>
  /**
   * @file Backdrop.svelte
   * 🕹️ SOTA ATOMIC BACKDROP
   * Standard shielding overlay for Modals, Drawers, and Panels.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { resolve_ms } from "@components";
  import { use_actions } from "@actions";
  import { fade } from "svelte/transition";

  let {
    // State
    is_blurred = true,
    busy = false,
    is_pass_through = false,

    // Design
    z_index = "var(--z-index-overlay)",
    class: className = "",

    // Slots/Snippets
    children = null,
    actions = [],

    ...rest
  } = $props();

  // Sync transition with design tokens
  let duration = $state(resolve_ms("--duration-fast", 250));

  // High-fidelity reactive orchestration array for framework parser peace of mind
  let computedClasses = $derived(
    [
      "fixed inset-0 flex items-start justify-center overflow-y-auto",
      "bg-[radial-gradient(circle_at_center,rgb(from_var(--background-gradient-4)_r_g_b_/_var(--opacity-whisper)),rgb(from_var(--void-black)_r_g_b_/_var(--opacity-whisper)))]",
      "cursor-pointer select-none [-webkit-tap-highlight-color:transparent] [&>*]:m-auto [&.profile-backdrop]:p-0",
      is_pass_through ? "pointer-events-none [&>*]:pointer-events-auto" : "pointer-events-auto",
      is_blurred ? "[backdrop-filter:var(--blur-mist)_saturate(0.4)_var(--brightness-dim)]" : "",
      busy ? "cursor-wait pointer-events-none" : "",
      className,
    ]
      .filter(Boolean)
      .join(" "),
  );
</script>

<div
  {...rest}
  class={computedClasses}
  style:z-index={z_index}
  transition:fade={{ duration }}
  use:use_actions={actions}
>
  {@render children?.()}
</div>
