<script>
  /**
   * @file EntityCard.svelte
   * THE UNIFIED CARD
   * Highly flexible consolidated card component supporting drawer library and storyboard slot/panel variants.
   * Standard: Ultra-Lean DOM and Svelte 5 `$props`.
   */

  import { runtime } from "@state";
  import { motion } from "@media";
  import StyleBadge from "./StyleBadge.svelte";
  import { get_signature_color } from "@utils";
  import ContextMenu from "./ContextMenu.svelte";
  import { claim_menu, claim_morph_epoch, get_morph_epoch } from "./ContextMenu.svelte.js";
  import { app } from "@state";
  import BracketList from "./BracketList.svelte";
  import MacroText from "./MacroText.svelte";
  import ProfilePicture from "./ProfilePicture.svelte";

  const display_entities = $derived({
    AI: runtime.active_ai || app.selected_ai,
    USER: runtime.active_user || app.selected_user,
    FRACTAL: runtime.active_fractal || app.selected_fractal,
    ALL: [runtime.active_ai, runtime.active_user, runtime.active_fractal, ...(app.ai_list || []), ...(app.user_list || []), ...(app.fractal_list || [])].filter(
      Boolean,
    ),
  });

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
   * @property {string | null} [description_override] - Optional override text rendered in the card summary block (also enables summary in library variant)
   * @property {any} [description_owner] - Optional perspective owner passed to MacroText when rendering description_override
   * @property {Array<{ key: string, value: string, is_hidden?: boolean }> | null} [bracket_items] - Optional structured relationship brackets rendered via BracketList
   * @property {boolean} [incoming_only] - Dim/desaturate card when representing a strictly incoming-only relationship
   * @property {boolean} [preview] - Non-interactive hover-preview mode (uniform radius, no hover scale or backdrop-filter compositing)
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
    description_override = null,
    description_owner = null,
    bracket_items = null,
    incoming_only = false,
    preview = false,
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
  let my_menu_epoch = $state(0);
  // Epoch of the last time THIS card's context menu opened. Only the most
  // recently opened menu's card is the profile-flip morph source.
  let my_morph_epoch = 0;

  function open_menu_at(x, y) {
    menu_x = x;
    menu_y = y;
    my_menu_epoch = claim_menu();
    my_morph_epoch = claim_morph_epoch();
    menu_open = true;
  }

  function handle_card_click() {
    if (disabled || preview) return;
    handle_select();
  }

  function handle_card_contextmenu(e) {
    if (disabled || preview || variant === "library" || is_empty) return;
    e.preventDefault();
    e.stopPropagation();
    open_menu_at(e.clientX, e.clientY);
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

  // --- TRANSITION LOGIC ---
  const transition_name = $derived.by(() => {
    // 0. ALWAYS suppress transition_name when ANY backdrop/modal/panel is open to prevent browser top-layer stacking isolation
    if (app.control_panel_open || app.card_hand.open || app.profile_open) {
      return undefined;
    }

    // 0b. Suppress during the begin-story flip so the cards don't morph into
    // the side panels - they fly into the prologue message instead.
    if (app.suppress_card_transitions) {
      return undefined;
    }

    // 1. If actively transitioning profile, only the ARMED source card carries
    // the transition name (the card whose context menu opened last). This lets
    // any card - storyboard slot, storymode panel, or prologue message card -
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
  let has_brackets = $derived(Array.isArray(bracket_items) && bracket_items.length > 0);
  let total_bracket_chars = $derived(
    has_brackets ? bracket_items.reduce((sum, item) => sum + String(item?.key || "").length + String(item?.value || "").length, 0) : 0,
  );
  let hide_title_for_brackets = $derived(!incoming_only && variant === "library" && has_brackets && (bracket_items.length > 1 || total_bracket_chars > 75));

  // Unified callback event mappings
  let select_handler = $derived(onclick || on_select || (() => {}));

  /**
   * Completes the card selection gesture and delegates transition ownership to the parent controller.
   */
  function trigger_selection() {
    if (launch_triggered || !is_launching) return;
    launch_triggered = true;
    if (fallback_timeout) {
      clearTimeout(fallback_timeout);
      fallback_timeout = null;
    }
    is_launching = false;
    launch_triggered = false;
    select_handler();
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
        // Fallback: exceed the 300ms (--transition-duration-standard) rack-pull-eject keyframe by 50ms so animationend completes first
        if (fallback_timeout) clearTimeout(fallback_timeout);
        fallback_timeout = setTimeout(() => {
          trigger_selection();
        }, 350);
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
      if (fallback_timeout) {
        clearTimeout(fallback_timeout);
        fallback_timeout = null;
      }
      trigger_selection();
    }
  }
</script>

<div
  bind:this={root_el}
  data-card-root
  class="
    group group/card
    @container
    relative
    isolate
    overflow-visible
    border
    border-(--signature-color)
    bg-chalk/95
    shadow-standard
    transition
    duration-standard
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
    after:transition
    after:duration-standard
    after:ease-in-out

    {preview ? 'pointer-events-none rounded-standard' : (
    `
      cursor-pointer
      rounded-none
      backdrop-blur-md
      hover:scale-lift
      hover:brightness-glow
      active:scale-sink
      active:brightness-dim
      md:rounded-standard
    `
  )}

    {disabled ?
    `
      pointer-events-none
      transform-none!
      border-[rgba(255,255,255,0.15)]
      bg-transparent
      opacity-85
      shadow-none!
      grayscale-[0.6]
      filter

      after:border-transparent
      after:shadow-none
    `
  : preview ? ''
  : `
      hover:border-(--signature-color)
      hover:shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color)_15%,transparent)]

      hover:after:border-(--signature-color,var(--color-slate-50))
      hover:after:shadow-[inset_0_0_0_1px_var(--signature-color,var(--color-slate-50))]
    `}
    {is_pressing && !disabled && !preview ?
    `
      scale-sink
      border-[color-mix(in_srgb,var(--signature-color)_100%,transparent)]
    `
  : ''}
    {is_launching ?
    `
      z-20
      animate-[rack-pull-eject_var(--transition-duration-standard)_var(--ease-out)_forwards]
    `
  : ''}
    {incoming_only && !disabled ? 'opacity-muted grayscale' : ''}
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
  style:width={type === "fractal" && app.view === "storymode" && variant !== "library" && variant !== "message" ?
    "var(--spacing-character-card-width)"
  : undefined}
  style:height={type === "fractal" && app.view === "storymode" && variant !== "library" && variant !== "message" ? "auto" : undefined}
  style:aspect-ratio={type === "fractal" && app.view === "storymode" && variant !== "library" && variant !== "message" ? fractal_storymode_ratio : undefined}
  role="button"
  tabindex={disabled || preview ? -1 : 0}
  aria-hidden={preview ? "true" : undefined}
  aria-label={variant === "library" ?
    is_empty ? "Create New"
    : disabled ? "Already selected"
    : "Select " + name
  : a11y_label}
  onclick={handle_card_click}
  oncontextmenu={handle_card_contextmenu}
  onanimationend={handle_animation_end}
  onpointerdown={() => !disabled && !preview && variant === "library" && (is_pressing = true)}
  onpointerup={() => {
    is_pressing = false;
  }}
  onpointerleave={() => {
    is_pressing = false;
  }}
  onkeydown={(/** @type {KeyboardEvent} */ e) => {
    if (preview) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handle_select();
    }
  }}>
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

      {disabled ?
      `
        opacity-20
        grayscale
        filter
      `
    : 'opacity-100'}
      {is_empty ?
      `
        flex
        flex-col
        items-center
        justify-center
        gap-standard
        text-slate-50
        opacity-15

        group-hover/card:opacity-100
      `
    : ''}">
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
      {has_brackets || incoming_only ? '' : 'bg-linear-to-t from-black/95 via-black/75 via-45% to-transparent'}
      text-center
      transition-opacity
      duration-300
      ease-in-out

      {app.view === 'storymode' && variant !== 'library' ?
      `
        opacity-0
        group-hover/card:opacity-100
      `
    : 'opacity-100'}

      {variant === 'library' ?
      has_brackets || incoming_only ?
        `
            h-auto
            max-h-full
            px-tight
            pt-8
            pb-tight
          `
      : `
            h-auto
            min-h-[40%]
            p-tight
          `
    : `
          h-auto
          min-h-[50%]
          px-tight
          pt-8
          pb-standard
        `}"
    style:background={has_brackets || incoming_only ?
      "linear-gradient(to top, rgb(from var(--color-background-gradient-1) r g b / 0.96) 0%, rgb(from var(--color-background-gradient-1) r g b / 0.86) calc(100% - 2rem), transparent 100%)"
    : undefined}>
    {#if !hide_title_for_brackets}
      <span
        data-card-text
        class="
          line-clamp-3
          w-full
          text-center
          font-heading
          font-bold
          wrap-break-word
          text-(--signature-color,var(--color-frisk))
          uppercase

          {variant === 'library' ?
          `
            text-sm
            leading-snug
            tracking-wide
            [text-shadow:0_1px_3px_var(--color-background-gradient-1),0_2px_6px_var(--color-background-gradient-1)]
          `
        : `
            text-[clamp(1rem,12cqi,1.5rem)]
            leading-tight
            tracking-widest
            [text-shadow:0_2px_4px_var(--color-void-black)]
          `}
          {is_empty ?
          `
            text-frisk
            opacity-15
            transition-opacity
            duration-standard
            ease-in-out

            group-hover/card:opacity-100
          `
        : ''}">{is_empty ? role_label || "Create New" : entity?.name || name}</span>
    {/if}
    {#if incoming_only}
      <div
        class="
          mt-tight
          flex
          w-full
          flex-col
          items-center
          gap-1.5
          rounded-standard
          border
          border-white/10
          bg-glass-sunken/80
          px-tight
          py-2
          text-center
          [backdrop-filter:var(--blur-mist)]
        ">
        <span class="font-mono text-[0.625rem] font-bold tracking-widest text-(--signature-color,var(--color-dev-accent)) uppercase">
          Unidirectional Relation
        </span>
        <p class="font-sans text-xs leading-relaxed text-balance text-frisk/80">
          This connection originates exclusively from <span class="font-semibold text-frisk">{entity?.name || name}</span>'s profile. Open their profile to
          inspect.
        </p>
      </div>
    {:else if has_brackets}
      <div class="{hide_title_for_brackets ? '' : 'mt-tight'} w-full overflow-hidden">
        <BracketList entries={bracket_items} owner={description_owner || entity} entities={display_entities} compact={true} sort_by_length={false} />
      </div>
    {:else if !is_empty && (Boolean(description_override) || (variant !== "library" && variant !== "message" && app.view !== "storymode"))}
      <p
        data-card-text
        class="
          font-sans
          wrap-break-word
          whitespace-normal
          text-frisk
          transition-opacity
          duration-standard
          ease-in-out
          [text-shadow:0_1px_3px_rgb(from_var(--color-background-gradient-1)_r_g_b/0.8)]

          {variant === 'library' && description_override ?
          `
            mt-0.5
            line-clamp-2
            max-h-9
            text-xs
            leading-snug
            opacity-90
          `
        : `
            mt-tight
            line-clamp-3
            max-h-18
            text-sm
            leading-relaxed
            opacity-80
          `}

          {(variant === 'library' || variant === 'message') && !description_override ?
          `
            m-0
            max-h-0
            opacity-0
          `
        : ''}">
        {#if description_override}
          <MacroText text={description_override} owner={description_owner || entity} entities={display_entities} />
        {:else if entity?.description}
          <MacroText text={entity.description} owner={entity} entities={display_entities} />
        {:else}
          No description provided.
        {/if}
      </p>
    {/if}
  </div>

  {#if type === "fractal" && variant === "panel" && app.view !== "storymode"}
    <div data-card-badge class="pointer-events-none absolute top-[clamp(0.25rem,4cqi,0.5rem)] left-[clamp(0.25rem,4cqi,0.5rem)] z-20 flex flex-col gap-tight">
      <StyleBadge {entity} class="flex flex-col gap-tight" />
    </div>
  {/if}
</div>

<ContextMenu bind:open={menu_open} x={menu_x} y={menu_y} epoch={my_menu_epoch} {actions} target_name={entity?.name || name} {signature_color} />

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
