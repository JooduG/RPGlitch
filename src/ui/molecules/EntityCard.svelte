<script>
  /**
   * @file EntityCard.svelte
   * ðŸƒ THE UNIFIED TAROT
   * Highly flexible consolidated card component supporting drawer library and storyboard slot/panel variants.
   * Standard: Ultra-Lean DOM, Svelte 5 `$props`, and Chalk Regime Enforcement.
   */

  import { tick } from "svelte";
  import { guardedTransition } from "@engine";
  import { ProfilePicture, Button, tooltip } from "@atoms";
  import { themeStore } from "@media";
  import { motion } from "@motion";
  import { app } from "@state";

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
  } = $props();

  // --- STATE RUNES ---
  let is_pressing = $state(false);
  let is_launching = $state(false);
  let launch_triggered = $state(false);

  /** @type {HTMLElement | null} */
  let root_el = $state(null);

  // --- TRANSITION LOGIC ---
  const transition_name = $derived.by(() => {
    // 1. Launching Library Card: Takes ownership of the slot's transition name to morph into the panel.
    if (variant === "library") {
      return is_launching ? "card-slot-" + type : undefined;
    }

    // 2. Panel/Slot Card: Holds the transition name normally, EXCEPT when the drawer is open for this specific type
    // to guarantee zero duplicate transition name errors during snapshot capture.
    if (app.drawer.open && app.drawer.type === type) {
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
  let signature_color = $derived(
    themeStore.get_signature_color(entity, variant === "library" ? undefined : "var(--gunmetal)"),
  );
  let name = $derived(entity?.name || "Untitled");
  let a11y_label = $derived(is_empty ? `Select ${role_label}` : `Change ${role_label}`);

  // Unified callback event mappings
  let select_handler = $derived(onclick || on_select || (() => {}));
  let view_profile_handler = $derived(on_view_profile || onViewProfile || (() => {}));

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
        const currentName = (
          el.style.getPropertyValue("view-transition-name") ||
          el.style.viewTransitionName ||
          ""
        ).trim();

        const isMatch =
          currentName === targetName ||
          currentName === `"${targetName}"` ||
          (hasTransitionName && styleAttr.includes(targetName));

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

    guardedTransition(async () => {
      is_launching = false; // Remove view-transition-name from old element before capture
      if (root_el) root_el.style.removeProperty("view-transition-name"); // Bulletproof DOM strip
      select_handler();
      await tick();
      launch_triggered = false;
    });
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
  class="entity-card-root interactable glass-elevated"
  class:is-empty={is_empty}
  class:is-fractal={type === "fractal"}
  class:is-slot={variant === "slot"}
  class:is-panel={variant === "panel"}
  class:is-library={variant === "library"}
  class:is-pressing={is_pressing}
  class:is-launching={is_launching}
  class:disabled
  style:--signature-color={signature_color}
  style:view-transition-name={transition_name}
  role="button"
  tabindex={disabled ? -1 : 0}
  aria-label={variant === "library"
    ? is_empty
      ? "Create New"
      : disabled
        ? "Already selected"
        : "Select " + name
    : a11y_label}
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
    if (variant === "library" || variant === "panel") {
      view_profile_handler();
    }
  }}
  onkeydown={(/** @type {KeyboardEvent} */ e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handle_select();
    }
  }}
>
  <div class="visual-container" class:is-placeholder={is_empty}>
    {#if !is_empty}
      <ProfilePicture {entity} />
    {:else if variant === "library"}
      <svg viewBox="0 0 24 24" class="icon icon-outline">
        <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
      </svg>
    {:else if type === "fractal"}
      <svg viewBox="0 0 24 24" class="icon icon-outline">
        <path d="M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" class="icon icon-outline">
        <path
          d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
        />
      </svg>
    {/if}
  </div>

  <div class="card-hud-panel">
    <span class="primary-title">{is_empty ? role_label || "Create New" : entity?.name || name}</span
    >
    {#if !is_empty && variant !== "library"}
      <p class="secondary-desc">{entity?.description || "No description provided."}</p>
    {/if}
  </div>

  <nav class="actions-toolbar">
    <Button
      class="item"
      actions={[[tooltip, { text: `View ${entity?.name || name} Profile` }]]}
      variant="secondary"
      aria-label="View {entity?.name || name} Profile"
      onclick={(/** @type {MouseEvent} */ e) => {
        e.stopPropagation();
        view_profile_handler();
      }}
      tabindex="-1"
    >
      <svg viewBox="0 0 24 24" class="icon-medium">
        <path
          d="M20,2H4C2.89,2 2,2.89 2,4V20C2,21.11 2.89,22 4,22H20C21.11,22 22,21.11 22,20V4C22,2.89 21.11,2 20,2M20,20H4V4H20V20M12,10H17V12H12V10M12,14H17V16H12V14M7,10H10V13H7V10M7,14H10V15H7V14"
        />
      </svg>
    </Button>
  </nav>
</div>

<style>
  .entity-card-root {
    /* 1. Base Proportional Dimensions derived directly from central Design Tokens */
    width: var(--storyboard-character-card-width);
    height: var(--storyboard-character-card-height);
    position: relative;
    overflow: visible;
    border-radius: var(--radius-standard);
    background: var(--glass-elevated);
    backdrop-filter: var(--blur-mist);
    border: var(--border-whisper);
    border-color: rgb(from var(--signature-color) r g b / var(--opacity-whisper));
    transition:
      width var(--duration-standard) var(--ease-standard),
      height var(--duration-standard) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
    container-type: inline-size;
    box-shadow: var(--shadow-ghost);
    outline: none;

    /* 2. Overrides for Fractal Anomaly Proportions derived directly from central Design Tokens */
    &.is-fractal {
      width: var(--storyboard-fractal-card-width);
      height: var(--storyboard-fractal-card-height);
    }

    /* 3. Layout Context Sizing Rules */
    &.is-library {
      width: calc(var(--storyboard-character-card-width) * 0.5);
      height: calc(var(--storyboard-character-card-height) * 0.5);
      backdrop-filter: none !important; /* Avoid redundant blurring and prevent WebKit/Blink transform-ghosting compositor bugs */
    }

    &.is-library.is-fractal {
      width: calc(var(--storyboard-fractal-card-width) * 0.5);
      height: calc(var(--storyboard-fractal-card-height) * 0.5);
      backdrop-filter: none !important; /* Avoid redundant blurring and prevent WebKit/Blink transform-ghosting compositor bugs */
    }
  }

  .entity-card-root:hover:not(.disabled) {
    border-color: var(--signature-color);
    box-shadow: 0 0 calc(var(--spacing-unit) * 4)
      rgb(from var(--signature-color) r g b / var(--opacity-whisper));
  }

  .entity-card-root.is-empty {
    opacity: 0.6;
  }

  .entity-card-root.disabled {
    pointer-events: none !important;
    filter: grayscale(1) brightness(0.7) opacity(0.5) !important;
    transform: none !important;
    box-shadow: none !important;
    border-color: rgb(from var(--pure-white) r g b / 0.15) !important;
    background: transparent !important;

    /* Prevent any interior layer modifiers from bleeding through */
    &::after {
      box-shadow: none !important;
      border-color: transparent !important;
    }

    .visual-container {
      filter: grayscale(1) opacity(0.2) !important;
    }
  }

  /* Structural Highlight (The Edge) */
  .entity-card-root::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    border: var(--border-width-base) solid transparent;
    box-shadow: inset 0 0 0 var(--spacing-pixel) transparent;
    transition:
      box-shadow var(--duration-standard) var(--ease-standard),
      border-color var(--duration-standard) var(--ease-standard);
    z-index: var(--z-index-surface);
  }

  .entity-card-root:hover:not(.disabled)::after {
    border-color: var(--signature-color, var(--frisk));
    box-shadow: inset 0 0 0 var(--spacing-pixel) var(--signature-color, var(--frisk));
  }

  /* --- CONTENT LAYER --- */
  .visual-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    border-radius: inherit;
    transition: opacity var(--duration-standard) var(--ease-standard);
    opacity: 1;
    pointer-events: auto;
  }

  .visual-container :global(img),
  .visual-container :global(.avatar-wrapper),
  .visual-container :global(.profile-picture) {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }

  /* --- PLACEHOLDER LAYER --- */
  .visual-container.is-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--gap-standard);
    color: var(--pure-white);
    opacity: var(--opacity-whisper);
  }

  .entity-card-root:hover .visual-container.is-placeholder {
    opacity: var(--opacity-solid);
  }

  .visual-container.is-placeholder .icon {
    width: calc(var(--spacing-unit) * 20);
    height: calc(var(--spacing-unit) * 20);
  }

  .icon-outline {
    fill: none;
    stroke: currentcolor;
    stroke-width: 1.5;
  }

  .card-hud-panel {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(
      to top,
      var(--chalk) 0%,
      rgb(from var(--chalk) r g b / var(--opacity-solid)) 40%,
      rgb(from var(--chalk) r g b / var(--opacity-muted)) 75%,
      transparent 100
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    text-align: center;
    padding: var(--padding-standard);
    z-index: var(--z-index-surface);
    pointer-events: none;
    border-radius: 0 0 var(--radius-standard) var(--radius-standard);

    /* Shared base height rules */
    height: 60%;
    transition:
      height var(--duration-standard) var(--ease-standard),
      opacity var(--duration-standard) var(--ease-standard),
      visibility var(--duration-standard) var(--ease-standard);
    opacity: 1;
    visibility: visible;
    overflow: hidden;
  }

  .card-hud-panel .primary-title {
    color: var(--signature-color, var(--frisk)) !important;
    text-shadow: var(--shadow-font);
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);

    /* ðŸ›¡ï¸ Impactful, fluid typography scale for full-sized Storyboard cards */
    font-size: clamp(var(--font-size-base), 12cqi, var(--font-size-h2)) !important;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: break-word;
    line-height: 1.15 !important;
    text-align: center;
    width: 100%;
  }

  .entity-card-root.is-empty .card-hud-panel .primary-title {
    color: var(--pure-white) !important;
    opacity: var(--opacity-whisper);
    transition: opacity var(--duration-standard) var(--ease-standard);
  }

  .entity-card-root.is-empty:hover .card-hud-panel .primary-title {
    opacity: var(--opacity-solid);
  }

  .card-hud-panel .secondary-desc {
    margin-top: var(--margin-tight);
    font-family: var(--font-family-base);
    font-size: var(--font-size-small);
    color: var(--pure-white);
    text-shadow: var(--shadow-font);
    line-height: var(--font-height-base);
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: break-word;

    /* Performant layout hide animations - 18 spacing units provides sufficient vertical budget to fit 3 lines without clipping ellipses */
    max-height: calc(var(--spacing-unit) * 18);
    transition:
      max-height var(--duration-standard) var(--ease-standard),
      opacity var(--duration-standard) var(--ease-standard);
  }

  /* --- CONTEXTUAL VARIANT MULTIPLIERS --- */
  .entity-card-root.is-fractal .card-hud-panel {
    height: auto !important;
    min-height: 40%;
    padding-top: var(--padding-standard) !important;
    background: linear-gradient(
      to top,
      var(--chalk) 0%,
      rgb(from var(--chalk) r g b / var(--opacity-solid)) 60%,
      transparent 100
    ) !important;
  }

  .is-library .card-hud-panel {
    display: flex !important;
    height: 40% !important;
    padding: var(--padding-tight) var(--padding-standard) !important;
  }

  .is-library .secondary-desc {
    max-height: 0 !important;
    opacity: 0 !important;
    margin: 0 !important;
  }

  .is-library .primary-title {
    font-size: var(--font-size-small) !important;
    letter-spacing: var(--font-spacing-base) !important;
    line-height: 1.2 !important;
  }

  /* --- ACTIONS TOOLBAR --- */
  .actions-toolbar {
    position: absolute;
    top: calc(var(--spacing-unit) * 2);
    right: calc(var(--spacing-unit) * 2);
    z-index: var(--z-index-modal);
    pointer-events: auto;
    visibility: hidden;
    opacity: var(--opacity-none);
    transition:
      transform var(--duration-standard) var(--ease-standard),
      opacity var(--duration-standard) var(--ease-standard),
      visibility var(--duration-standard) var(--ease-standard);
    transform: translateY(calc(var(--spacing-unit) * -1));
    display: none;
  }

  .is-panel .actions-toolbar {
    display: flex;
  }

  .entity-card-root:hover .actions-toolbar {
    visibility: visible;
    opacity: var(--opacity-solid);
    transform: translateY(0);
  }

  .actions-toolbar :global(.item) {
    width: var(--icon-giant);
    height: var(--icon-giant);
    border-radius: var(--radius-full);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 1. Tension Build-Up (Absorbing the Touch) */
  .entity-card-root.is-pressing {
    transform: scale(0.96) !important;
    border-color: rgb(from var(--signature-color) r g b / var(--opacity-solid)) !important;
  }

  /* 2. The Launch Reveal (Ejecting from the Server Rack Matrix) */
  .entity-card-root.is-launching {
    z-index: var(--z-index-overlay) !important;
    animation: rack-pull-eject var(--duration-standard) var(--ease-elastic) forwards;
  }

  /* --- KINETIC HARDWARE KEYFRAMES --- */
  @keyframes rack-pull-eject {
    0% {
      transform: scale(0.96) translateY(0);
      box-shadow: var(--shadow-ghost);
    }

    40% {
      transform: scale(1.04) translateY(calc(var(--spacing-unit) * -3));
      filter: brightness(1.15);
    }

    100% {
      transform: scale(1.02) translateY(calc(var(--spacing-unit) * -2));
      box-shadow:
        0 calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 6)
          rgb(from var(--chalk) r g b / 0.5),
        0 0 calc(var(--spacing-unit) * 4)
          rgb(from var(--signature-color) r g b / var(--opacity-whisper));
    }
  }
</style>
