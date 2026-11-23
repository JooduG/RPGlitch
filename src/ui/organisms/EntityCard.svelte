<script module>
  let morph_epoch = $state(0);

  export function claim_morph_epoch() {
    morph_epoch += 1;
    return morph_epoch;
  }

  export function get_morph_epoch() {
    return morph_epoch;
  }
</script>

<script>
  /**
   * @file src/ui/organisms/EntityCard.svelte
   * Unified card component supporting library fan, storyboard slot/panel, and message variants.
   */
  import { Avatar, Icon, StyleTile } from "@atoms";
  import { resolve_entity_style_tiles } from "@definitions";
  import { motion } from "@media";
  import { BracketList, MacroText } from "@molecules";
  import { app, session } from "@state";
  import { entity_avatar_props, get_signature_color } from "@utils";
  import { open_context_menu } from "./ContextMenu.svelte";

  /**
   * @typedef {Object} Props
   * @property {"library" | "slot" | "panel" | "message"} [variant]
   * @property {any} [entity]
   * @property {"ai" | "user" | "fractal"} [type]
   * @property {boolean} [disabled]
   * @property {string} [role_label]
   * @property {() => void} [onclick]
   * @property {() => void} [on_select]
   * @property {boolean} [launch_gesture]
   * @property {string | null} [description_override]
   * @property {any} [description_owner]
   * @property {Array<{ key: string, value: string, is_hidden?: boolean }> | null} [bracket_items]
   * @property {boolean} [incoming_only]
   * @property {boolean} [preview]
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
    launch_gesture = true,
    description_override = null,
    description_owner = null,
    bracket_items = null,
    incoming_only = false,
    preview = false,
  } = $props();

  let is_pressing = $state(false);
  let is_launching = $state(false);
  let fractal_storymode_ratio = $state("4 / 3");
  let my_morph_epoch = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let fallback_timeout = null;

  // --- LAYOUT & MODE DERIVATIONS ---
  const is_empty = $derived(!entity);
  const is_fractal = $derived(type === "fractal");
  const is_library = $derived(variant === "library");
  const is_message = $derived(variant === "message");
  const is_storymode_fractal = $derived(is_fractal && app.view === "storymode" && !is_library && !is_message);
  const signature_color = $derived(get_signature_color(entity, is_library ? undefined : "var(--color-gunmetal)"));
  const name = $derived(entity?.name || "Untitled");
  const select_handler = $derived(onclick || on_select || (() => {}));

  const has_brackets = $derived(Array.isArray(bracket_items) && bracket_items.length > 0);
  const total_bracket_chars = $derived(
    has_brackets ? bracket_items.reduce((sum, item) => sum + String(item?.key || "").length + String(item?.value || "").length, 0) : 0,
  );
  const hide_title_for_brackets = $derived(!incoming_only && is_library && has_brackets && (bracket_items.length > 1 || total_bracket_chars > 75));
  const show_description = $derived(
    !is_empty && !incoming_only && !has_brackets && (Boolean(description_override) || (!is_library && !is_message && app.view !== "storymode")),
  );
  const needs_macro_context = $derived(has_brackets || show_description);

  const display_entities = $derived.by(() => {
    if (!needs_macro_context) return null;
    return {
      AI: session.active_ai || app.selected_ai,
      USER: session.active_user || app.selected_user,
      FRACTAL: session.active_fractal || app.selected_fractal,
      ALL: [
        session.active_ai,
        session.active_user,
        session.active_fractal,
        ...(app.ai_list || []),
        ...(app.user_list || []),
        ...(app.fractal_list || []),
      ].filter(Boolean),
    };
  });

  const aria_label = $derived(
    is_library ?
      is_empty ? role_label || "Create New"
      : disabled ? "Already selected"
      : `Select ${name}`
    : is_empty ? `Select ${role_label}`
    : `Change ${role_label}`,
  );

  const empty_icon = $derived(
    is_library && role_label.toLowerCase().includes("import") ? "download"
    : is_library ? "plus"
    : is_fractal ? "fractal"
    : "character",
  );

  const transition_name = $derived.by(() => {
    if (app.control_panel_open || app.card_hand.open || app.profile_open || app.suppress_card_transitions) return undefined;
    if (app.transitioning_profile) {
      if (is_library) return undefined;
      return entity?.id === app.transition_target_id && my_morph_epoch === get_morph_epoch() ? `card-slot-${type}` : undefined;
    }
    return is_library || is_message ? undefined : `card-slot-${type}`;
  });

  $effect(() => {
    if (!is_storymode_fractal) return;
    function update_ratio() {
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;width:var(--spacing-fractal-card-width);height:var(--spacing-fractal-card-height);";
      document.body.appendChild(probe);
      const { offsetWidth: fw, offsetHeight: fh } = probe;
      probe.remove();
      if (fw > 0 && fh > 0) fractal_storymode_ratio = `${fw} / ${fh}`;
    }
    update_ratio();
    window.addEventListener("resize", update_ratio);
    return () => window.removeEventListener("resize", update_ratio);
  });

  $effect(() => () => {
    if (fallback_timeout) clearTimeout(fallback_timeout);
  });

  // --- INTERACTION ---
  function complete_launch() {
    if (!is_launching) return;
    if (fallback_timeout) {
      clearTimeout(fallback_timeout);
      fallback_timeout = null;
    }
    is_launching = false;
    select_handler();
  }

  function handle_select() {
    if (disabled) return;
    if (is_library && !motion.is_reduced && launch_gesture) {
      is_launching = true;
      if (fallback_timeout) clearTimeout(fallback_timeout);
      fallback_timeout = setTimeout(complete_launch, 350);
    } else {
      select_handler();
    }
  }

  function handle_contextmenu(e) {
    if (disabled || preview || is_library || is_empty || !entity) return;
    e.preventDefault();
    e.stopPropagation();
    my_morph_epoch = claim_morph_epoch();
    open_context_menu({ entity, type, surface: app.view === "storyboard" ? "storyboard" : "storymode", x: e.clientX, y: e.clientY });
  }
</script>

<div
  data-card-root
  class={[
    "group group/card @container relative isolate overflow-visible border border-(--signature-color) bg-gunmetal/25 shadow-standard transition duration-standard ease-in-out outline-none select-none after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:border after:border-transparent after:shadow-[inset_0_0_0_1px_transparent] after:transition after:duration-standard after:ease-in-out",
    preview ? "pointer-events-none rounded-standard" : (
      "cursor-pointer rounded-none backdrop-blur-md hover:scale-lift hover:brightness-glow active:scale-sink active:brightness-dim md:rounded-standard"
    ),
    disabled ?
      "pointer-events-none transform-none! border-white/15 bg-transparent opacity-85 shadow-none! grayscale-[0.6] filter after:border-transparent after:shadow-none"
    : !preview &&
      "hover:border-(--signature-color) hover:shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color)_15%,transparent)] hover:after:border-(--signature-color,var(--color-slate-50)) hover:after:shadow-[inset_0_0_0_1px_var(--signature-color,var(--color-slate-50))]",
    is_pressing && !disabled && !preview && "scale-sink border-(--signature-color)",
    is_launching && "z-20 animate-[rack-pull-eject_var(--transition-duration-standard)_var(--ease-out)_forwards]",
    is_library &&
      (is_fractal ?
        "h-[calc(var(--spacing-fractal-card-height)*0.5)] w-[calc(var(--spacing-fractal-card-width)*0.5)]"
      : "h-[calc(var(--spacing-character-card-height)*0.5)] w-[calc(var(--spacing-character-card-width)*0.5)]"),
    !is_library && !is_storymode_fractal && "h-full w-full",
    !is_library &&
      !is_message &&
      (is_fractal ? app.view !== "storymode" && "md:h-fractal-card-height md:w-fractal-card-width" : "md:h-character-card-height md:w-character-card-width"),
  ]}
  style:--signature-color={signature_color}
  style:view-transition-name={transition_name}
  style:opacity={app.profile_open && app.editing_entity?.id === entity?.id && !is_library ? 0 : undefined}
  style:width={is_storymode_fractal ? "var(--spacing-character-card-width)" : undefined}
  style:height={is_storymode_fractal ? "auto" : undefined}
  style:aspect-ratio={is_storymode_fractal ? fractal_storymode_ratio : undefined}
  role="button"
  tabindex={disabled || preview ? -1 : 0}
  aria-hidden={preview ? "true" : undefined}
  aria-label={aria_label}
  onclick={() => !disabled && !preview && handle_select()}
  oncontextmenu={handle_contextmenu}
  onanimationend={(e) => e.animationName === "rack-pull-eject" && complete_launch()}
  onpointerdown={() => !disabled && !preview && is_library && (is_pressing = true)}
  onpointerup={() => (is_pressing = false)}
  onpointerleave={() => (is_pressing = false)}
  onkeydown={(e) => {
    if (!preview && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handle_select();
    }
  }}>
  <div
    class={[
      "pointer-events-auto relative h-full w-full overflow-hidden rounded-[inherit] transition-opacity duration-300 ease-in-out [&_.avatar-wrapper]:h-full [&_.avatar-wrapper]:w-full [&_.avatar-wrapper]:object-cover [&_.profile-picture]:h-full [&_.profile-picture]:w-full [&_.profile-picture]:object-cover [&_img]:h-full [&_img]:w-full [&_img]:object-cover",
      disabled ? "opacity-20 grayscale filter"
      : incoming_only ? "opacity-muted grayscale"
      : is_empty ? "flex flex-col items-center justify-center gap-standard text-slate-50 opacity-60 group-hover/card:opacity-100"
      : "opacity-100",
    ]}>
    {#if !is_empty}
      <Avatar {...entity_avatar_props(entity)} />
    {:else}
      <Icon name={empty_icon} class="size-20 stroke-[1.5]" />
    {/if}
  </div>

  <div
    class={[
      "pointer-events-none absolute right-0 bottom-0 left-0 z-10 flex h-auto flex-col items-center justify-end overflow-hidden rounded-b-[inherit] text-center transition-opacity duration-300 ease-in-out",
      !(has_brackets || incoming_only) && "bg-linear-to-t from-black/75 via-black/55 via-45% to-transparent",
      app.view === "storymode" && !is_library ? "opacity-0 group-hover/card:opacity-100" : "opacity-100",
      is_library ?
        has_brackets || incoming_only ?
          "max-h-full px-tight pt-8 pb-tight"
        : "min-h-[40%] p-tight"
      : "min-h-[50%] px-tight pt-8 pb-standard",
    ]}
    style:background={has_brackets || incoming_only ?
      "linear-gradient(to top, rgb(from var(--color-background-gradient-1) r g b / 0.96) 0%, rgb(from var(--color-background-gradient-1) r g b / 0.86) calc(100% - 2rem), transparent 100%)"
    : undefined}>
    {#if !hide_title_for_brackets}
      <svelte:element
        this={is_library ? "h5" : "h3"}
        data-card-text
        class={[
          "line-clamp-3 w-full text-center wrap-break-word text-(--signature-color,var(--color-frisk))",
          is_library ?
            "[text-shadow:0_1px_3px_var(--color-background-gradient-1),0_2px_6px_var(--color-background-gradient-1)]"
          : "[text-shadow:0_2px_4px_var(--color-void-black)]",
          is_empty && "text-frisk opacity-60 transition-opacity duration-standard ease-in-out group-hover/card:opacity-100",
        ]}>
        {is_empty ? role_label || "Create New" : name}
      </svelte:element>
    {/if}

    {#if incoming_only}
      <div
        class="mt-tight flex w-full flex-col items-center gap-1.5 rounded-standard border border-white/10 bg-glass-sunken/80 px-tight py-2 text-center [backdrop-filter:var(--blur-mist)]">
        <span class="type-uppercase-label text-(--signature-color,var(--color-dev-accent))">Unidirectional Relation</span>
        <p class="type-body text-balance text-frisk">
          This connection originates exclusively from <span class="font-semibold text-frisk">{name}</span>'s profile. Open their profile to inspect.
        </p>
      </div>
    {:else if has_brackets}
      <div class={[!hide_title_for_brackets && "mt-tight", "w-full overflow-hidden"]}>
        <BracketList
          entries={bracket_items}
          owner={description_owner || entity}
          entities={display_entities}
          compact={true}
          sort_by_length={false}
          on_select={(ent) => app.open_profile(ent)} />
      </div>
    {:else if show_description}
      <p
        data-card-text
        class={[
          "type-body wrap-break-word whitespace-normal text-frisk transition-opacity duration-standard ease-in-out [text-shadow:0_1px_3px_rgb(from_var(--color-background-gradient-1)_r_g_b/0.8)]",
          is_library && description_override ? "mt-0.5 line-clamp-2 max-h-9 opacity-90" : "mt-tight line-clamp-3 max-h-18 opacity-80",
        ]}>
        {#if description_override}
          <MacroText text={description_override} owner={description_owner || entity} entities={display_entities} on_select={(ent) => app.open_profile(ent)} />
        {:else if entity?.description}
          <MacroText text={entity.description} owner={entity} entities={display_entities} on_select={(ent) => app.open_profile(ent)} />
        {:else}
          No description provided.
        {/if}
      </p>
    {/if}
  </div>

  {#if is_fractal && variant === "panel" && app.view !== "storymode"}
    {@const tiles = resolve_entity_style_tiles(entity)}
    {@const active_tiles = [tiles.narrative, tiles.visual].filter(Boolean)}
    {#if active_tiles.length > 0}
      <div data-card-badge class="pointer-events-none absolute top-[clamp(0.25rem,4cqi,0.5rem)] left-[clamp(0.25rem,4cqi,0.5rem)] z-20 flex flex-col gap-tight">
        {#each active_tiles as tile (tile.name)}
          <StyleTile
            {tile}
            {signature_color}
            tooltip_text={tile.tooltip}
            fallback_class="text-[clamp(0.75rem,8cqi,1.1rem)]"
            class="h-[clamp(2rem,18cqi,3rem)] w-[clamp(2rem,18cqi,3rem)] transform-gpu rounded-[clamp(0.5rem,9cqi,1rem)]" />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
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
