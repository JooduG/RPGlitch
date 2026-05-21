<script>
  /**
   * @file StorymodePanel.svelte
   * THE ENTITY SHOWCASE
   * Logic:
   * 1. High-fidelity visual representing an entity in the story feed.
   * 2. Supports profile view on interaction.
   * 3. Integrated with Nordic Collection & Chess Grid.
   */
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { app } from "@state/app.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";

  let { entity, side = "left" } = $props();

  // --- DERIVATIONS ---
  let name = $derived(entity?.name || "Unknown");
  let signature_color = $derived(themeStore.get_signature_color(entity, "var(--gunmetal)"));
  let a11y_label = $derived(`View Profile: ${name}`);
</script>

<article
  class="root"
  class:is-left={side === "left"}
  class:is-right={side === "right"}
  style:--signature-color={signature_color}
>
  <button
    class="anchor interactable"
    use:tooltip={{ text: a11y_label }}
    onclick={() => app.toggle_profile(true, entity)}
    aria-label={a11y_label}
  >
    <div class="panel-background"></div>
    <div class="panel-content">
      <ProfilePicture {entity} class="panel-pic" />
    </div>
  </button>
</article>

<style>
  .root {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    pointer-events: auto;
  }

  .anchor {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform var(--motion-standard),
      filter var(--motion-standard);
  }

  .anchor:hover {
    transform: var(--scale-lift);
    filter: var(--brightness-glow);
  }

  /* Full-bleed vertical atmospheric pillar: signature color top fading to abyssal black bottom */
  .panel-background {
    position: absolute;
    inset: calc(var(--spacing-unit) * 0);
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--signature-color), transparent 30%) 0%,
      color-mix(in srgb, var(--void-black), var(--signature-color) 5%) 50%,
      var(--void-black) 100%
    );
    z-index: var(--z-index-base);
  }

  /* Subtle border line on the inner side of the panel */
  .is-left .panel-background {
    border-right: var(--spacing-pixel) solid
      rgb(from var(--pure-white) r g b / var(--opacity-ghost));
  }

  .is-right .panel-background {
    border-left: var(--spacing-pixel) solid rgb(from var(--pure-white) r g b / var(--opacity-ghost));
  }

  .panel-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-index-surface);
  }

  /* Target ProfilePicture custom class to make background transparent so our panel background shows through */
  :global(.panel-pic .profile-placeholder) {
    background-color: transparent !important;
    background-image: none !important;
  }
</style>
