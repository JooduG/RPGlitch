<script>
  /**
   * @file StyleBadges.svelte
   * Narrative & visual style indicator squares, sized to match the fractal card width.
   * Rendered underneath the fractal card in storymode/storyboard layouts.
   */
  import { tooltip } from "@atoms";
  import { get_signature_color } from "@media";
  import { NARRATIVE_STYLES, VISUAL_STYLES } from "@data";
  import { get_style_initials } from "@utils";

  /**
   * `layout` controls badge sizing:
   * - `"storymode"`: badges are half the character card width (square), via a
   *   literal Tailwind arbitrary class referencing the design-token CSS var.
   * - default: container-query responsive sizing for the storyboard overlay.
   * Both branches use LITERAL class strings so Tailwind's scanner generates CSS
   * for them (dynamically-built classes or inline styles are unreliable here).
   */
  /** @type {{ entity?: any, class?: string, layout?: "storymode" | "default" }} */
  let { entity = undefined, class: className = "flex w-full justify-center gap-1.5", layout = "default" } = $props();

  let badge_size_class = $derived(
    layout === "storymode"
      ? "h-[calc(var(--spacing-storyboard-character-card-width)*0.5)] w-[calc(var(--spacing-storyboard-character-card-width)*0.5)]"
      : "h-[clamp(2rem,18cqi,3rem)] w-[clamp(2rem,18cqi,3rem)]",
  );

  let style_details = $derived(entity?.narrative_style && entity.narrative_style !== "default" ? NARRATIVE_STYLES[entity.narrative_style] : null);
  let vstyle_details = $derived(
    entity?.visual_style && entity.visual_style !== "none" && entity.visual_style !== "default" ? VISUAL_STYLES[entity.visual_style] : null,
  );
  let signature_color = $derived(get_signature_color(entity, "var(--color-gunmetal)"));
</script>

{#if style_details || vstyle_details}
  <div class="pointer-events-none flex {className}">
    {#if style_details}
      <div
        use:tooltip={{ text: `Narrative Style: ${style_details.name}` }}
        class="
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
          opacity-70
          shadow-md
          transition-all
          duration-300
          ease-in-out
          hover:opacity-100
          md:rounded-2xl
        "
      >
        <div
          class="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit] font-heading text-[clamp(0.75rem,8cqi,1.1rem)] font-bold text-white uppercase select-none"
          style="background-color: {signature_color};"
        >
          {#if style_details.portrait}
            <img src={style_details.portrait} alt={style_details.name} class="h-full w-full object-cover object-center" draggable="false" />
          {:else}
            {get_style_initials(style_details.name)}
          {/if}
        </div>
      </div>
    {/if}

    {#if vstyle_details}
      {@const vname = vstyle_details.name}
      {@const vfontsize =
        vname.length > 12
          ? "text-[clamp(0.35rem,3.4cqi,0.48rem)]"
          : vname.length > 8
            ? "text-[clamp(0.44rem,4.4cqi,0.6rem)]"
            : "text-[clamp(0.55rem,5.5cqi,0.75rem)]"}
      <div
        use:tooltip={{ text: `Visual Style: ${vstyle_details.name}` }}
        class="
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
          opacity-70
          shadow-md
          transition-all
          duration-300
          ease-in-out
          hover:opacity-100
          md:rounded-2xl
        "
      >
        <div
          class="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[inherit] text-center font-heading {vfontsize} leading-[1.1] font-bold tracking-tighter wrap-break-word hyphens-auto text-white uppercase select-none"
          style="background-color: {signature_color};"
        >
          {#if vstyle_details.portrait}
            <img src={vstyle_details.portrait} alt={vstyle_details.name} class="h-full w-full object-cover object-center" draggable="false" />
          {:else}
            {vname}
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}
