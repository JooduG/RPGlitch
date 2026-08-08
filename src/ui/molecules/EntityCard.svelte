<script>
  /**
   * @file EntityCard.svelte
   * THE UNIFIED CARD
   * Highly flexible consolidated card component supporting drawer library and storyboard slot/panel variants.
   * Standard: Ultra-Lean DOM and Svelte 5 `$props`.
   */

  import { Button, ProfilePicture, StyleBadge } from "@atoms";
  import { guarded_transition } from "@engine";
  import { get_signature_color } from "@media";
  import { motion } from "@motion";
  import { app } from "@state";
  import { flushSync } from "svelte";
  import { claim_menu, get_menu_epoch, claim_morph_epoch, get_morph_epoch } from "./EntityCardContextMenu.svelte.js";

  /**
   * @typedef {Object} Props
   * @property {"library" | "slot" | "panel" | "message"} [variant] - Visual variant layout
   * @property {any} [entity] - Entity data object
   * @property {"ai" | "user" | "fractal"} [type] - Entity archetype role
   * @property {boolean} [disabled] - Disabled interaction state (mostly library)
   * @property {string} [role_label] - Label for empty slot placeholders
   * @property {() => void} [onclick] - Select click handler
   * @property {() => void} [on_select] - Selection callback mapping
   * @property {any[]} [actions] - Context menu actions (config-driven: { label, onSelect, disabled, separator, danger })
   * @property {boolean} [launch_gesture] - Rack-pull-eject launch on select (default true; disable when the parent animates selection itself)
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
    actions = [],
    launch_gesture = true,
  } = $props();

  // --- STATE RUNES ---
  let is_pressing = $state(false);
  let is_launching = $state(false);
  let launch_triggered = $state(false);

  /** @type {HTMLElement | null} */
  let root_el = $state(null);

  // --- CONTEXT MENU STATE ---
  let menu_open = $state(false);
  let menu_x = $state(0);
  let menu_y = $state(0);
  let my_menu_epoch = 0;
  // Epoch of the last time THIS card's context menu opened. Only the most
  // recently opened menu's card is the profile-flip morph source.
  let my_morph_epoch = 0;

  function open_menu_at(x, y) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Anchor to the right edge of the menu on the right half, left edge on the left half
    if (x > vw / 2) {
      menu_x = Math.max(0, x - 160); // open leftward: left edge sits left of cursor
    } else {
      menu_x = Math.min(x, vw - 180);
    }
    // Spawn upward on the bottom half, downward on the top half
    if (y > vh / 2) {
      menu_y = y - 200; // initial estimate, corrected post-render
    } else {
      menu_y = Math.min(y, vh - 200);
    }
    my_menu_epoch = claim_menu();
    // Arm this card as the profile-flip source ("Profile" lives in the menu).
    my_morph_epoch = claim_morph_epoch();
    menu_open = true;
    // Re-clamp after render using actual menu dimensions
    requestAnimationFrame(() => {
      const menu = document.body.querySelector('[role="menu"]');
      if (!menu) return;
      const { width, height } = menu.getBoundingClientRect();
      // On bottom half: anchor bottom of menu to cursor position
      if (y > vh / 2) {
        menu_y = y - height;
      }
      if (menu_x + width > vw) menu_x = vw - width;
      if (menu_y + height > vh) menu_y = vh - height;
      if (menu_x < 0) menu_x = 0;
      if (menu_y < 0) menu_y = 0;
    });
  }

  // Close this menu when another card opens its menu.
  $effect(() => {
    const current = get_menu_epoch();
    if (menu_open && current !== my_menu_epoch) {
      menu_open = false;
    }
  });

  function handle_card_click(e) {
    if (disabled) return;
    if (variant !== "library" && !is_empty && actions.length) {
      e.stopPropagation();
      open_menu_at(e.clientX, e.clientY);
      return;
    }
    handle_select();
  }

  function portal_to_body(node) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  let fractal_storymode_ratio = $state("4 / 3");

  $effect(() => {
    if (type !== "fractal" || app.view !== "storymode" || variant === "library" || variant === "message") return;
    function update_ratio() {
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;width:var(--spacing-fractal-card-width);height:var(--spacing-fractal-card-height);";
      document.body.appendChild(probe);
      const fw = probe.offsetWidth;
      const fh = probe.offsetHeight;
      probe.remove();
      if (fw > 0 && fh > 0) fractal_storymode_ratio = `${fw} / ${fh}`;
    }
    update_ratio();
    window.addEventListener("resize", update_ratio);
    return () => window.removeEventListener("resize", update_ratio);
  });

  function handle_item_click(e, item) {
    e.stopPropagation();
    menu_open = false;
    if (item.onSelect) item.onSelect();
  }

  function close_menu() {
    menu_open = false;
  }

  // --- TRANSITION LOGIC ---
  const transition_name = $derived.by(() => {
    // 0. ALWAYS suppress transition_name when ANY backdrop/modal/panel is open to prevent browser top-layer stacking isolation
    if (app.control_panel_open || app.card_hand.open || app.profile_open) {
      return undefined;
    }

    // 0b. Suppress during the begin-story flip so the cards don't morph into
    // the side panels — they fly into the prologue message instead.
    if (app.suppress_card_transitions) {
      return undefined;
    }

    // 1. If actively transitioning profile, only the ARMED source card carries
    // the transition name (the card whose context menu opened last). This lets
    // any card — storyboard slot, storymode panel, or prologue message card —
    // flip into the profile, while the same entity shown elsewhere (message row
    // + side panel) never duplicates a view-transition-name.
    if (app.transitioning_profile) {
      if (variant === "library") return undefined;
      if (entity?.id === app.transition_target_id && my_morph_epoch === get_morph_epoch()) {
        return "card-slot-" + type;
      }
      return undefined;
    }

    // 2. Library or Message Card: No transition name
    if (variant === "library" || variant === "message") {
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

  // --- DERIVATIONS ---
  let is_empty = $derived(!entity);
  let signature_color = $derived(get_signature_color(entity, variant === "library" ? undefined : "var(--color-gunmetal)"));
  let name = $derived(entity?.name || "Untitled");
  let a11y_label = $derived(is_empty ? `Select ${role_label}` : `Change ${role_label}`);

  // Unified callback event mappings
  let select_handler = $derived(onclick || on_select || (() => {}));

  /**
   * Helper to perform the actual entity selection, wrapped inside guarded_transition.
   */
  function trigger_selection() {
    if (launch_triggered || !is_launching) return;
    launch_triggered = true;

    // Manually strip view-transition-name from any existing panel/slot cards of this type in the DOM
    // to guarantee zero duplicate transition name errors during snapshot capture.
    try {
      const target_name = "card-slot-" + type;
      const elements = document.querySelectorAll("[data-card-root]");
      elements.forEach((/** @type {any} */ el) => {
        const style_attr = el.getAttribute("style") || "";
        const has_transition_name = style_attr.includes("view-transition-name");
        const current_name = (el.style.getPropertyValue("view-transition-name") || el.style.viewTransitionName || "").trim();

        const is_match =
          current_name === target_name || current_name === `"${target_name}"` || (has_transition_name && style_attr.includes(target_name));

        if (is_match && el !== root_el) {
          el.style.removeProperty("view-transition-name");
          // Bulletproof fallback: manually strip the property from the style attribute directly
          const cleaned_style = style_attr
            .split(";")
            .filter((/** @type {string} */ part) => !part.trim().startsWith("view-transition-name"))
            .join(";");
          el.setAttribute("style", cleaned_style);
        }
      });
    } catch (err) {
      console.warn("[ViewTransition] DOM pre-flight sweep failed:", err);
    }

    guarded_transition(
      () => {
        flushSync(() => {
          is_launching = false; // Remove view-transition-name from old element before capture
          if (root_el) root_el.style.removeProperty("view-transition-name"); // Bulletproof DOM strip
          select_handler();
        });
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
      if (variant === "library" && !motion.is_reduced && launch_gesture) {
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
  data-card-root
  class="
    group
    @container
    relative
    cursor-pointer
    overflow-visible
    rounded-none
    border
    border-(--signature-color)
    bg-slate-950/95
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
      hover:shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color)_15%,transparent)]

      hover:after:border-(--signature-color,var(--color-slate-50))
      hover:after:shadow-[inset_0_0_0_1px_var(--signature-color,var(--color-slate-50))]
    `}
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
    backdrop-blur-md
  "
  class:w-[calc(var(--spacing-fractal-card-width)*0.5)]={type === "fractal" && variant === "library"}
  class:h-[calc(var(--spacing-fractal-card-height)*0.5)]={type === "fractal" && variant === "library"}
  class:w-[calc(var(--spacing-character-card-width)*0.5)]={type !== "fractal" && variant === "library"}
  class:h-[calc(var(--spacing-character-card-height)*0.5)]={type !== "fractal" && variant === "library"}
  class:w-full={variant !== "library" && !(type === "fractal" && app.view === "storymode" && variant !== "message")}
  class:h-full={variant !== "library" && !(type === "fractal" && app.view === "storymode" && variant !== "message")}
  class:md:w-[var(--spacing-fractal-card-width)]={type === "fractal" && variant !== "library" && variant !== "message" && app.view !== "storymode"}
  class:md:h-[var(--spacing-fractal-card-height)]={type === "fractal" && variant !== "library" && variant !== "message" && app.view !== "storymode"}
  class:md:w-[var(--spacing-character-card-width)]={type !== "fractal" && variant !== "library" && variant !== "message"}
  class:md:h-[var(--spacing-character-card-height)]={type !== "fractal" && variant !== "library" && variant !== "message"}
  style:--signature-color={signature_color}
  style:view-transition-name={transition_name}
  style:opacity={app.profile_open && app.editing_entity?.id === entity?.id && variant !== "library" ? 0 : undefined}
  style:width={type === "fractal" && app.view === "storymode" && variant !== "library" && variant !== "message"
    ? "var(--spacing-character-card-width)"
    : undefined}
  style:height={type === "fractal" && app.view === "storymode" && variant !== "library" && variant !== "message" ? "auto" : undefined}
  style:aspect-ratio={type === "fractal" && app.view === "storymode" && variant !== "library" && variant !== "message"
    ? fractal_storymode_ratio
    : undefined}
  role="button"
  tabindex={disabled ? -1 : 0}
  aria-label={variant === "library" ? (is_empty ? "Create New" : disabled ? "Already selected" : "Select " + name) : a11y_label}
  onclick={handle_card_click}
  onanimationend={handle_animation_end}
  onpointerdown={() => !disabled && variant === "library" && (is_pressing = true)}
  onpointerup={() => {
    is_pressing = false;
  }}
  onpointerleave={() => {
    is_pressing = false;
  }}
  onkeydown={(/** @type {KeyboardEvent} */ e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (variant !== "library" && !is_empty && actions.length) {
        if (root_el) {
          const rect = root_el.getBoundingClientRect();
          open_menu_at(rect.right, rect.bottom);
        }
      } else {
        handle_select();
      }
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
    {:else if variant === "library" && role_label.toLowerCase().includes("import")}
      <svg viewBox="0 0 24 24" class="h-20 w-20 fill-none stroke-current stroke-[1.5]" style="stroke-linecap: round; stroke-linejoin: round;">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
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
      from-black/95
      via-black/75
      via-45%
      to-transparent
      text-center
      transition-all
      duration-300
      ease-in-out

      {app.view === 'storymode' && variant !== 'library' && variant !== 'message'
      ? `
        opacity-0
        group-hover:opacity-100
      `
      : 'opacity-100'}

      {variant === 'library' || variant === 'message'
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
      data-card-text
      class="
        [display:-webkit-box]
        w-full
        overflow-hidden
        text-center
        font-heading
        font-bold
        wrap-break-word
        text-(--signature-color,var(--color-slate-50))
        uppercase
        [-webkit-box-orient:vertical]
        [-webkit-line-clamp:3]
        [line-clamp:3]

        {variant === 'library' || variant === 'message'
        ? `
          text-sm
          leading-snug
          tracking-wide
          [text-shadow:0_1px_3px_#000,0_2px_6px_#000,0_0_2px_#000]
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
    {#if !is_empty && variant !== "library" && variant !== "message" && app.view !== "storymode"}
      <p
        data-card-text
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

          {variant === 'library' || variant === 'message'
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

  {#if type === "fractal" && variant === "panel" && app.view !== "storymode"}
    <div
      data-card-badge
      class="pointer-events-none absolute top-[clamp(0.25rem,4cqi,0.5rem)] left-[clamp(0.25rem,4cqi,0.5rem)] z-50 flex flex-col gap-1.5"
    >
      <StyleBadge {entity} class="flex flex-col gap-1.5" />
    </div>
  {/if}
</div>

<svelte:window onclick={close_menu} onkeydown={(e) => e.key === "Escape" && close_menu()} />

{#if menu_open}
  <div
    use:portal_to_body
    class="fixed z-9999 min-w-40 overflow-hidden rounded-standard bg-glass-elevated shadow-(--shadow-standard) [backdrop-filter:var(--blur-mist)] outline-none
      before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(--noise-url) before:opacity-10 before:mix-blend-overlay"
    style="left:{menu_x}px;top:{menu_y}px"
    role="menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && close_menu()}
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

<style>
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
        0 calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 6) rgb(from var(--color-neutral-900) r g b / 0.5),
        0 0 calc(var(--spacing-unit) * 4) rgb(from var(--signature-color) r g b / var(--opacity-whisper));
    }
  }
</style>
