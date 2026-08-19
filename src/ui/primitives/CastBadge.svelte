<script>
  /**
   * @file src/ui/primitives/CastBadge.svelte
   * 🎭 NPC presence badge — a square portrait tile for world-cast NPCs on the
   * storymode stage. Uses the same design language as StyleBadge (signature-color
   * border + color wash + hover name overlay) but renders the entity's own
   * profile image instead of a style portrait.
   *
   * On-stage NPCs render at full opacity with a green status dot; off-stage
   * (stasis) NPCs render dimmed/desaturated with a slate dot. Clicking the badge
   * opens the entity's profile modal.
   *
   * Sizing is delegated to the parent: the button fills whatever width the
   * container grants (aspect-square keeps it a perfect square), so the stage
   * row can shrink badges as the cast grows.
   */
  import { tooltip } from "@primitives";
  import { ProfilePicture } from "@image";
  import { get_signature_color } from "@media";

  /** @type {{ entity?: any, dimmed?: boolean, onclick?: (event: MouseEvent) => any, class?: string, style?: string }} */
  let { entity = null, dimmed = false, onclick = undefined, class: className = "", style = "" } = $props();

  let signature_color = $derived(get_signature_color(entity, "var(--color-gunmetal)"));
  let name = $derived(entity?.name || "NPC");
</script>

{#if entity}
  <button
    type="button"
    use:tooltip={{ text: dimmed ? `${name} — off-stage` : `${name} — on stage` }}
    {onclick}
    style="--signature-color: {signature_color}; {style}"
    class="
      group/badge
      pointer-events-auto
      relative
      block
      aspect-square
      flex-shrink-0
      cursor-pointer
      overflow-hidden
      rounded-[clamp(0.4rem,7cqi,0.75rem)]
      border
      border-solid
      border-(--signature-color)
      bg-black/40
      shadow-md
      transition-all
      duration-300
      ease-in-out
      hover:scale-lift
      hover:brightness-glow
      focus-visible:outline-none

      {dimmed ? 'opacity-40 grayscale-[0.8] saturate-50' : 'opacity-100'}

      {className}
    "
    aria-label={`Open ${name}'s profile`}
  >
    <ProfilePicture {entity} alt={`${name} portrait`} />

    <!-- Signature color wash — fades on hover to reveal the original portrait -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-25 transition-opacity duration-300 ease-in-out group-hover/badge:opacity-0"
      style="background-color: {signature_color}; mix-blend-mode: color;"
    ></div>

    <!-- On / off-stage status dot -->
    <span
      aria-hidden="true"
      class="absolute right-1 bottom-1 z-10 size-2 rounded-full {dimmed
        ? 'bg-slate-500'
        : 'bg-emerald-400 shadow-[0_0_4px_var(--color-emerald-400)]'}"
    ></span>

    <!-- Hover name overlay -->
    <span
      class="
        pointer-events-none
        absolute
        inset-0
        z-10
        flex
        items-end
        justify-center
        overflow-hidden
        rounded-b-[inherit]
        bg-linear-to-t
        from-black/95
        via-black/75
        via-45%
        to-transparent
        px-0.5
        pt-3
        pb-1
        text-center
        font-heading
        text-[clamp(0.4rem,4cqi,0.55rem)]
        leading-tight
        font-bold
        tracking-widest
        text-(--signature-color)
        uppercase
        opacity-0
        transition-opacity
        duration-300
        ease-in-out
        [text-shadow:0_1px_2px_var(--color-void-black)]
        group-hover/badge:opacity-100
      ">{name}</span
    >
  </button>
{/if}
