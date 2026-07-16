<script>
  /**
   * @file EntityCard.svelte
   * THE UNIFIED CARD
   * Highly flexible consolidated card component supporting drawer library and storyboard slot/panel variants.
   * Standard: Ultra-Lean DOM and Svelte 5 `$props`.
   */

  import { Button, ProfilePicture, tooltip } from "@atoms";
  import { guardedTransition } from "@engine";
  import { get_signature_color } from "@media";
  import { motion } from "@motion";
  import { app } from "@state";
  import { tick } from "svelte";

  /**
   * @typedef {Object} Props
   * @property {"library" | "slot" | "panel"} [variant] - Visual variant layout
   * @property {any} [entity] - Entity data object
   * @property {"ai" | "user" | "fractal"} [type] - Entity archetype role
   * @property {boolean} [disabled] - Disabled interaction state (mostly library)
   * @property {string} [role_label] - Label for empty slot placeholders
   * @property {() => void} [onclick] - Select click handler
   * @property {() => void} [on_select] - Selection callback mapping
   * @property {() => void} [onViewProfile] - View profile context mapping
   * @property {() => void} [on_view_profile] - View profile callback mapping
   * @property {() => void} [on_swap] - Swap callback mapping
   */

  /** @type {Props} */
  let {
    variant = "library",
    entity = undefined,
    type = "ai",
    disabled = false,
    role_label = "",
    onclick = undefined,
    on_select = undefined,
    onViewProfile = undefined,
    on_view_profile = undefined,
    on_swap = undefined,
  } = $props();

  // --- STATE RUNES ---
  let is_pressing = $state(false);
  let is_launching = $state(false);
  let launch_triggered = $state(false);

  /** @type {HTMLElement | null} */
  let root_el = $state(null);

  // --- TRANSITION LOGIC ---
  const transition_name = $derived.by(() => {
    // If we are actively transitioning a profile modal, only the active morphing card gets the name!
    // Inactive card slots must suppress their names to prevent them from being isolated from the root.
    if (app.transitioning_profile) {
      if (app.profile_open) {
        return undefined;
      }
      if (entity?.id === app.transition_target_id) {
        return "card-slot-" + type;
      }
      return undefined;
    }

    // 0. Profile open for this entity: suppress transition name to prevent duplicate errors
    if (app.profile_open && app.editing_entity?.id === entity?.id) {
      return undefined;
    }

    // 1. Launching Library Card: Takes ownership of the slot's transition name to morph into the panel.
    if (variant === "library") {
      return is_launching ? "card-slot-" + type : undefined;
    }

    // 2. Panel/Slot Card: Holds the transition name normally, EXCEPT when the card hand is open for this specific type
    // to guarantee zero duplicate transition name errors during snapshot capture.
    if (app.card_hand.open && app.card_hand.type === type) {
      return undefined;
    }

    return "card-slot-" + type;
  });
  /** @type {any} */
  let fallback_timeout = null;

  $effect(() => {
    return () => {
      if (fallback_timeout) clearTimeout(fallback_timeout);
    };
  });

  // --- DERIVATIONS & COMPATIBILITY ---
  let is_empty = $derived(!entity);
  let signature_color = $derived(get_signature_color(entity, variant === "library" ? undefined : "var(--color-gunmetal)"));
  let name = $derived(entity?.name || "Untitled");
  let a11y_label = $derived(is_empty ? `Select ${role_label}` : `Change ${role_label}`);

  // Unified callback event mappings
  let select_handler = $derived(onclick || on_select || (() => {}));
  let view_profile_handler = $derived(on_view_profile || onViewProfile || (() => {}));
  let swap_handler = $derived(on_swap || (() => {}));

  /**
   * Helper to perform the actual entity selection, wrapped inside guardedTransition.
   */
  function trigger_selection() {
    if (launch_triggered || !is_launching) return;
    launch_triggered = true;

    // Manually strip view-transition-name from any existing panel/slot cards of this type in the DOM
    // to guarantee zero duplicate transition name errors during snapshot capture.
    try {
      const targetName = "card-slot-" + type;
      const elements = document.querySelectorAll(".entity-card-root");
      elements.forEach((/** @type {any} */ el) => {
        const styleAttr = el.getAttribute("style") || "";
        const hasTransitionName = styleAttr.includes("view-transition-name");
        const currentName = (el.style.getPropertyValue("view-transition-name") || el.style.viewTransitionName || "").trim();

        const isMatch = currentName === targetName || currentName === `"${targetName}"` || (hasTransitionName && styleAttr.includes(targetName));

        if (isMatch && el !== root_el) {
          el.style.removeProperty("view-transition-name");
          // Bulletproof fallback: manually strip the property from the style attribute directly
          const cleanedStyle = styleAttr
            .split(";")
            .filter((/** @type {string} */ part) => !part.trim().startsWith("view-transition-name"))
            .join(";");
          el.setAttribute("style", cleanedStyle);
        }
      });
    } catch (err) {
      console.warn("[ViewTransition] DOM pre-flight sweep failed:", err);
    }

    guardedTransition(
      async () => {
        is_launching = false; // Remove view-transition-name from old element before capture
        if (root_el) root_el.style.removeProperty("view-transition-name"); // Bulletproof DOM strip
        select_handler();
        await tick();
        launch_triggered = false;
      },
      { className: "is-swapping-card" },
    );
  }

  /**
   * Selection handler representing card selection gestures (click / Enter key / Space key).
   * Bypasses the macro-task macro timeouts by offloading synchronization entirely to framework cycles.
   */
  function handle_select() {
    if (!disabled) {
      if (variant === "library" && !motion.isReduced) {
        // Build spring tension state; compilation execution defers to the native hardware animation lifecycle
        is_launching = true;
        // Fallback: If animationend event fails to fire (e.g. browser lag, test environment), force selection trigger after animation duration
        if (fallback_timeout) clearTimeout(fallback_timeout);
        fallback_timeout = setTimeout(() => {
          trigger_selection();
        }, 300);
      } else {
        // Direct layout injection if motion suppression is active or not in library layout tracking
        select_handler();
      }
    }
  }

  /**
   * Event listener bound directly to compositor keyframes.
   * Guarantees view transitions execute on the exact frame the component reaches peak momentum.
   * @param {AnimationEvent} e
   */
  function handle_animation_end(e) {
    if (e.animationName === "rack-pull-eject" && is_launching) {
      trigger_selection();
    }
  }
</script>

<div
  bind:this={root_el}
  class="
    group
    @container
    relative
    cursor-pointer
    overflow-visible
    rounded-none
    border
    border-(--signature-color)
    bg-black/15
    shadow-sm
    transition-all
    duration-300
    ease-in-out
    outline-none
    select-none
    after:pointer-events-none
    after:absolute
    after:inset-0
    after:z-10
    after:rounded-[inherit]

    after:border
    after:border-transparent
    after:shadow-[inset_0_0_0_1px_transparent]
    after:transition-all
    after:duration-300
    after:ease-in-out
    hover:scale-lift
    hover:brightness-glow
    active:scale-sink
    active:brightness-dim
    md:rounded-2xl

    {disabled
    ? `
      pointer-events-none
      transform-none!
      border-[rgba(255,255,255,0.15)]
      bg-transparent
      opacity-50
      shadow-none!
      brightness-75
      grayscale
      filter

      after:border-transparent
      after:shadow-none
    `
    : `
      hover:border-(--signature-color)
      hover:shadow-[0_0_calc(var(--spacing-spacing-unit)*4)_color-mix(in_srgb,var(--signature-color)_15%,transparent)]

      hover:after:border-(--signature-color,var(--color-slate-50))
      hover:after:shadow-[inset_0_0_0_1px_var(--signature-color,var(--color-slate-50))]
    `}
    {is_empty && !disabled ? 'opacity-60' : ''}
    {is_pressing && !disabled
    ? `
      scale-96
      border-[color-mix(in_srgb,var(--signature-color)_100%,transparent)]
    `
    : ''}
    {is_launching
    ? `
      z-50
      animate-[rack-pull-eject_0.35s_cubic-bezier(0.4,0,0.2,1)_forwards]
    `
    : ''}
    {variant === 'library' ? 'backdrop-blur-none' : 'backdrop-blur-md'}
  "
  class:w-[calc(var(--spacing-storyboard-fractal-card-width)*0.5)]={type === "fractal" && variant === "library"}
  class:h-[calc(var(--spacing-storyboard-fractal-card-height)*0.5)]={type === "fractal" && variant === "library"}
  class:w-[calc(var(--spacing-storyboard-character-card-width)*0.5)]={type !== "fractal" && variant === "library"}
  class:h-[calc(var(--spacing-storyboard-character-card-height)*0.5)]={type !== "fractal" && variant === "library"}
  class:w-full={variant !== "library"}
  class:h-full={variant !== "library"}
  class:md:w-[var(--spacing-storyboard-fractal-card-width)]={type === "fractal" && variant !== "library"}
  class:md:h-[var(--spacing-storyboard-fractal-card-height)]={type === "fractal" && variant !== "library"}
  class:md:w-[var(--spacing-storyboard-character-card-width)]={type !== "fractal" && variant !== "library"}
  class:md:h-[var(--spacing-storyboard-character-card-height)]={type !== "fractal" && variant !== "library"}
  style:--signature-color={signature_color}
  style:view-transition-name={transition_name}
  style:opacity={app.profile_open && app.editing_entity?.id === entity?.id && variant !== "library" ? 0 : undefined}
  role="button"
  tabindex={disabled ? -1 : 0}
  aria-label={variant === "library" ? (is_empty ? "Create New" : disabled ? "Already selected" : "Select " + name) : a11y_label}
  onclick={handle_select}
  onanimationend={handle_animation_end}
  onpointerdown={() => !disabled && variant === "library" && (is_pressing = true)}
  onpointerup={() => {
    is_pressing = false;
  }}
  onpointerleave={() => {
    is_pressing = false;
  }}
  oncontextmenu={(/** @type {MouseEvent} */ e) => {
    e.preventDefault();
    if (variant === "library") {
      view_profile_handler();
    } else if (variant === "panel") {
      swap_handler();
    }
  }}
  onkeydown={(/** @type {KeyboardEvent} */ e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handle_select();
    }
  }}
>
  <div
    class="
      pointer-events-auto
      relative
      h-full
      w-full
      overflow-hidden
      rounded-[inherit]
      transition-opacity
      duration-300
      ease-in-out

      [&_.avatar-wrapper]:h-full
      [&_.avatar-wrapper]:w-full
      [&_.avatar-wrapper]:object-cover

      [&_.profile-picture]:h-full
      [&_.profile-picture]:w-full
      [&_.profile-picture]:object-cover

      [&_img]:h-full
      [&_img]:w-full
      [&_img]:object-cover

      {disabled
      ? `
        opacity-20
        grayscale
        filter
      `
      : 'opacity-100'}
      {is_empty
      ? `
        flex
        flex-col
        items-center
        justify-center
        gap-4
        text-slate-50
        opacity-15

        group-hover:opacity-100
      `
      : ''}"
  >
    {#if !is_empty}
      <ProfilePicture {entity} />
    {:else if variant === "library"}
      <svg viewBox="0 0 24 24" class="h-20 w-20 fill-none stroke-current stroke-[1.5]">
        <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
      </svg>
    {:else if type === "fractal"}
      <svg viewBox="0 0 24 24" class="h-20 w-20 fill-none stroke-current stroke-[1.5]">
        <path d="M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" class="h-20 w-20 fill-none stroke-current stroke-[1.5]">
        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
      </svg>
    {/if}
  </div>

  <div
    class="
      pointer-events-none
      absolute
      right-0
      bottom-0
      left-0
      z-10
      flex
      flex-col
      items-center
      justify-end
      overflow-hidden
      rounded-b-[inherit]
      bg-linear-to-t
      from-black/90
      via-black/40
      to-transparent
      text-center
      opacity-100
      transition-all
      duration-300
      ease-in-out

      {variant === 'library'
      ? `
        h-auto
        min-h-[40%]
        p-2
      `
      : `
        h-auto
        min-h-[50%]
        px-2
        pt-8
        pb-4
      `}"
  >
    <span
      class="
        [display:-webkit-box]
        w-full
        overflow-hidden
        text-center
        font-(family-name:--font-family-heading)
        font-bold
        wrap-break-word
        text-(--signature-color,var(--color-slate-50))
        uppercase
        [-webkit-box-orient:vertical]
        [-webkit-line-clamp:3]
        [line-clamp:3]

        {variant === 'library'
        ? `
          text-sm
          leading-snug
          tracking-wide
          [text-shadow:0_1px_2px_var(--color-void-black)]
        `
        : `
          text-[clamp(1rem,12cqi,1.5rem)]
          leading-tight
          tracking-widest
          [text-shadow:0_2px_4px_var(--color-void-black)]
        `}
        {is_empty
        ? `
          text-slate-50
          opacity-15
          transition-opacity
          duration-300
          ease-in-out

          group-hover:opacity-100
        `
        : ''}">{is_empty ? role_label || "Create New" : entity?.name || name}</span
    >
    {#if !is_empty && variant !== "library"}
      <p
        class="
          mt-2
          [display:-webkit-box]
          max-h-18
          overflow-hidden
          font-sans
          text-sm
          leading-relaxed
          wrap-break-word
          whitespace-normal
          text-slate-50
          opacity-80
          transition-all
          duration-300
          ease-in-out
          [-webkit-box-orient:vertical]
          [-webkit-line-clamp:3]
          [line-clamp:3]
          [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]

          {variant === 'library'
          ? `
            m-0
            max-h-0
            opacity-0
          `
          : ''}"
      >
        {entity?.description || "No description provided."}
      </p>
    {/if}
  </div>

  {#if !is_empty && variant === "panel" && app.view !== "storymode"}
    <nav
      class="
      pointer-events-auto
      absolute
      top-[clamp(0.25rem,4cqi,0.5rem)]
      right-[clamp(0.25rem,4cqi,0.5rem)]
      z-50
      flex
      opacity-50
      transition-all
      duration-300
      ease-in-out

      focus-within:opacity-100
      hover:opacity-100
    "
    >
      <Button
        class="
        flex
        h-[clamp(2rem,18cqi,3rem)]
        w-[clamp(2rem,18cqi,3rem)]
        items-center
        justify-center
        rounded-full
        p-0!
      "
        actions={[[tooltip, { text: `Swap ${entity?.name || name}` }]]}
        variant="secondary"
        aria-label="Swap {entity?.name || name}"
        onclick={(/** @type {MouseEvent} */ e) => {
          e.stopPropagation();
          swap_handler();
        }}
        tabindex="-1"
      >
        <svg viewBox="0 0 24 24" class="h-[clamp(1.25rem,10cqi,1.75rem)] w-[clamp(1.25rem,10cqi,1.75rem)] fill-white text-white">
          <path d="M16,17.01V10H14V17.01H11L15,21L19,17.01H16M9,3L5,6.99H8V14H10V6.99H13L9,3Z" />
        </svg></Button
      >
    </nav>
  {/if}
</div>

<style>
  /* --- KINETIC HARDWARE KEYFRAMES --- */
  @keyframes rack-pull-eject {
    0% {
      transform: scale(0.96) translateY(0);
      box-shadow: var(--shadow-ghost);
    }

    40% {
      transform: scale(1.04) translateY(calc(var(--spacing-spacing-unit) * -3));
      filter: brightness(1.15);
    }

    100% {
      transform: scale(1.02) translateY(calc(var(--spacing-spacing-unit) * -2));
      box-shadow:
        0 calc(var(--spacing-spacing-unit) * 4) calc(var(--spacing-spacing-unit) * 6) rgb(from var(--color-neutral-900) r g b / 0.5),
        0 0 calc(var(--spacing-spacing-unit) * 4) rgb(from var(--signature-color) r g b / var(--opacity-whisper));
    }
  }
</style>
