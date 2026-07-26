<script>
  /**
   * @file StyleBadges.svelte
   * Narrative & visual style indicator squares.
   * - `storymode` (standalone below card): gradient name overlay on hover.
   * - `default` (overlaid on card in storyboard): floating tooltip on hover.
   */
  import { tooltip } from "@atoms";
  import { get_signature_color } from "@media";
  import { NARRATIVE_STYLES, VISUAL_STYLES } from "@data";

  /** @type {{ entity?: any, class?: string, layout?: "storymode" | "default" }} */
  let { entity = undefined, class: className = "flex w-full justify-center gap-1.5", layout = "default" } = $props();

  let badge_size_class = $derived(
    layout === "storymode"
      ? "flex-1 aspect-square max-w-[calc((var(--spacing-storyboard-character-card-width)_-_var(--spacing-gap-standard))_/_2)]"
      : "h-[clamp(2rem,18cqi,3rem)] w-[clamp(2rem,18cqi,3rem)]",
  );

  let opacity_class = $derived(layout === "storymode" ? "opacity-100" : "opacity-70 hover:opacity-100");

  let narrative_style_details = $derived(
    entity?.narrative_style && entity.narrative_style !== "default" ? NARRATIVE_STYLES[entity.narrative_style] : null,
  );
  let visual_style_details = $derived(
    entity?.visual_style && entity.visual_style !== "none" && entity.visual_style !== "default" ? VISUAL_STYLES[entity.visual_style] : null,
  );
  let signature_color = $derived(get_signature_color(entity, "var(--color-gunmetal)"));

  let badges = $derived([narrative_style_details, visual_style_details].filter((s) => s !== null));

  /** Conditionally apply tooltip only in default layout. */
  function badgeTooltip(node, { enabled, text }) {
    if (enabled) return tooltip(node, { text });
  }
</script>

{#if badges.length > 0}
  <div class="pointer-events-none flex {className}">
    {#each badges as badge (badge.name)}
      <div
        use:badgeTooltip={{ enabled: layout === "default", text: badge.name }}
        style:--signature-color={signature_color}
        class="
          group
          pointer-events-auto
          relative
          flex
          {badge_size_class}
          transform-gpu
          items-center
          justify-center
          overflow-hidden
          rounded-none
          border
          border-solid
          border-(--signature-color)
          bg-black/40
          {opacity_class}
          shadow-md
          transition-all
          duration-300
          ease-in-out
          hover:scale-lift
          md:rounded-2xl
        "
      >
        <div
          class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit] select-none"
          style="background-color: {signature_color};"
        >
          {#if badge.portrait}
            <img src={badge.portrait} alt={badge.name} class="h-full w-full object-cover object-center" draggable="false" />
          {/if}
        </div>

        {#if layout === "storymode"}
          <div
            class="pointer-events-none absolute bottom-0 left-0 z-10 line-clamp-2 flex w-full items-center justify-center bg-linear-to-t from-black/95 via-black/75 via-45% to-transparent p-1 text-center text-[clamp(0.4rem,4cqi,0.65rem)] leading-tight font-bold text-(--signature-color) uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            {badge.name}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
