<script>
  /**
   * @file src/ui/primitives/StyleBadge.svelte
   * Narrative & visual style indicator squares. Rendered underneath/over the fractal
   * card in storymode/storyboard layouts, as prologue message tiles, and — in
   * `layout="profile"` — as the selectable style tiles inside the fractal profile
   * modal's dropdown triggers.
   *
   * Portraits render with a subtle tint: a `color`-blend layer painted with the
   * entity's signature color sits over the portrait — it recolors toward the
   * signature hue while preserving each pixel's exact brightness, so the image
   * never darkens. Hovering fades the wash (300ms), revealing the original
   * portrait.
   */
  import { tooltip } from "@primitives";
  import { get_signature_color } from "@media";
  import { NARRATIVE_STYLES, VISUAL_STYLES } from "@data";
  import { get_style_initials } from "@utils";

  /**
   * `layout` controls badge sizing & interaction:
   * - `"storymode"`: badges are ~half the character card width total, sized via
   *   inline style using the same dynamic CSS variable the cards use. No Tailwind
   *   size class is used (Tailwind's !important on arbitrary classes would
   *   override the inline style). Includes the entity-card-style hover overlay
   *   (name in signature color on dark gradient) + zoom. No tooltip in this mode.
   * - `"prologue"`: badges are flex-filled — each takes half the parent row's
   *   width (minus the gap) at a perfect 1:1 ratio, so the row height derives
   *   from the container width on the spot. Same hover overlay + zoom as storymode.
   * - `"profile"`: one fixed-size tile that fills its parent (the profile modal
   *   sizes the Dropdown trigger to 8.5rem). Renders a placeholder tile ("No
   *   Narrative Style" / "No Visual Style") when the entity has no style set, so
   *   it works as an edit-mode picker trigger. Tooltip is opt-in via the `tooltip`
   *   prop. Use `which` to request just one tile.
   * - default: container-query responsive sizing for the storyboard overlay.
   */
  /** @type {{ entity?: any, class?: string, layout?: "storymode" | "prologue" | "profile" | "default", which?: "both" | "narrative" | "visual", tooltip?: string }} */
  let {
    entity = undefined,
    class: className = "flex w-full justify-center gap-1.5",
    layout = "default",
    which = "both",
    tooltip: tooltip_text = undefined,
  } = $props();

  let is_storymode = $derived(layout === "storymode");
  let is_prologue = $derived(layout === "prologue");
  let is_profile = $derived(layout === "profile");
  let render_narrative = $derived(which !== "visual");
  let render_visual = $derived(which !== "narrative");

  let badge_size_class = $derived(
    is_profile ? "h-full w-full" : is_storymode || is_prologue ? "" : "h-[clamp(2rem,18cqi,3rem)] w-[clamp(2rem,18cqi,3rem)]",
  );

  // In storymode, set only the height and use aspect-ratio for a perfect 1:1 square.
  // Subtract the inter-badge gap so two badges + gap = exactly the card width above.
  // flex-shrink: 0 prevents the flex container from compressing the width.
  let badge_size_style = $derived(
    is_storymode
      ? "height: calc((var(--spacing-character-card-width) - var(--spacing-gap-standard)) / 2); aspect-ratio: 1 / 1; flex-shrink: 0;"
      : is_prologue
        ? "flex: 1 1 0%; aspect-ratio: 1 / 1; min-width: 0;"
        : "",
  );

  let opacity_class = "opacity-100";

  // Storymode/prologue hover zoom — same utilities the entity cards use
  let hover_zoom_class = $derived(is_storymode || is_prologue ? "hover:scale-lift hover:brightness-glow" : "");

  let badge_radius_class = $derived(is_profile ? "rounded-xl" : "rounded-[clamp(0.5rem,9cqi,1rem)]");

  let initials_class = $derived(is_profile ? "text-lg" : "text-[clamp(0.75rem,8cqi,1.1rem)]");

  let style_details = $derived(entity?.narrative_style && entity.narrative_style !== "default" ? NARRATIVE_STYLES[entity.narrative_style] : null);
  let vstyle_details = $derived(
    entity?.visual_style && entity.visual_style !== "none" && entity.visual_style !== "default" ? VISUAL_STYLES[entity.visual_style] : null,
  );
  let signature_color = $derived(get_signature_color(entity, "var(--color-gunmetal)"));
</script>

{#snippet storymode_overlay(name)}
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
      px-1
      pt-4
      pb-1
      text-center
      opacity-0
      transition-all
      duration-300
      ease-in-out
      group-hover/badge:opacity-100
    "
  >
    <span
      class="
        [display:-webkit-box]
        w-full
        overflow-hidden
        text-center
        font-heading
        text-[clamp(0.45rem,4.5cqi,0.65rem)]
        leading-tight
        font-bold
        tracking-widest
        wrap-break-word
        text-(--signature-color,var(--color-slate-50))
        uppercase
        [-webkit-box-orient:vertical]
        [-webkit-line-clamp:2]
        [line-clamp:2]
        [text-shadow:0_2px_4px_var(--color-void-black)]
      ">{name}</span
    >
  </div>
{/snippet}

{#if (render_narrative && (style_details || is_profile)) || (render_visual && (vstyle_details || is_profile))}
  <div class="pointer-events-none flex {className}" style={is_storymode || is_profile ? `--signature-color: ${signature_color};` : ""}>
    {#if render_narrative && (style_details || is_profile)}
      {@const dname = style_details?.name || "No Narrative Style"}
      {@const dportrait = style_details?.portrait}
      <div
        use:tooltip={is_profile ? tooltip_text : is_storymode || is_prologue ? null : { text: `Narrative Style: ${style_details.name}` }}
        style={badge_size_style}
        class="
          group/badge
          pointer-events-auto
          relative
          flex
          {badge_size_class}
          transform-gpu
          items-center
          justify-center
          overflow-hidden
          border
          border-solid
          border-(--signature-color)
          bg-black/40
          {opacity_class}
          {hover_zoom_class}
          {badge_radius_class}
          shadow-md
          transition-all
          duration-300
          ease-in-out
        "
      >
        <div
          class="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit] font-heading {initials_class} font-bold text-white uppercase select-none"
          style="background-color: {signature_color};"
        >
          {#if dportrait}
            <img src={dportrait} alt={dname} class="h-full w-full object-cover object-center" draggable="false" />
          {:else}
            {get_style_initials(dname)}
          {/if}
        </div>

        {#if dportrait}
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-25 transition-opacity duration-300 ease-in-out group-hover/badge:opacity-0"
            style="background-color: {signature_color}; mix-blend-mode: color;"
          ></div>
        {/if}

        {#if is_storymode || is_prologue}
          {@render storymode_overlay(dname)}
        {/if}
      </div>
    {/if}

    {#if render_visual && (vstyle_details || is_profile)}
      {@const vname = vstyle_details?.name || "No Visual Style"}
      {@const vportrait = vstyle_details?.portrait}
      {@const vfontsize = is_profile
        ? vname.length > 12
          ? "text-[8px]"
          : vname.length > 8
            ? "text-[9px]"
            : "text-[10px]"
        : vname.length > 12
          ? "text-[clamp(0.35rem,3.4cqi,0.48rem)]"
          : vname.length > 8
            ? "text-[clamp(0.44rem,4.4cqi,0.6rem)]"
            : "text-[clamp(0.55rem,5.5cqi,0.75rem)]"}
      <div
        use:tooltip={is_profile ? tooltip_text : is_storymode || is_prologue ? null : { text: `Visual Style: ${vstyle_details.name}` }}
        style={badge_size_style}
        class="
          group/badge
          pointer-events-auto
          relative
          flex
          {badge_size_class}
          transform-gpu
          items-center
          justify-center
          overflow-hidden
          border
          border-solid
          border-(--signature-color)
          bg-black/40
          {opacity_class}
          {hover_zoom_class}
          {badge_radius_class}
          shadow-md
          transition-all
          duration-300
          ease-in-out
        "
      >
        <div
          class="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[inherit] text-center font-heading {vfontsize} leading-[1.1] font-bold tracking-tighter wrap-break-word hyphens-auto text-white uppercase select-none"
          style="background-color: {signature_color};"
        >
          {#if vportrait}
            <img src={vportrait} alt={vname} class="h-full w-full object-cover object-center" draggable="false" />
          {:else}
            {vname}
          {/if}
        </div>

        {#if vportrait}
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-25 transition-opacity duration-300 ease-in-out group-hover/badge:opacity-0"
            style="background-color: {signature_color}; mix-blend-mode: color;"
          ></div>
        {/if}

        {#if is_storymode || is_prologue}
          {@render storymode_overlay(vname)}
        {/if}
      </div>
    {/if}
  </div>
{/if}
