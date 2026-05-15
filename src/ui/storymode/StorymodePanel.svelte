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
  style:--entity-color={signature_color}
>
  <button
    class="anchor interactable"
    use:tooltip={{ text: a11y_label }}
    onclick={() => app.toggle_profile(true, entity)}
    aria-label={a11y_label}
  >
    <ProfilePicture {entity} />
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
    background: var(--entity-color, var(--gunmetal));
    border: none;
    padding: var(--spacing-0);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform var(--motion-standard),
      filter var(--motion-standard);
  }

  .anchor:hover {
    transform: var(--hover-lift);
    filter: var(--hover-glow);
  }
</style>
