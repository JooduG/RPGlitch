<script>
  /**
   * @file StorymodePanel.svelte
   * 🎭 THE ENTITY SHOWCASE
   * High-fidelity visual representing an entity in the story feed.
   * Flattened Schema Compliant.
   */
  import { app } from "@state/app.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import ProfilePicture from "@ui/atoms/ProfilePicture.svelte";
  let { entity, side = "left" } = $props();
  // Default Fallbacks
  let name = $derived(entity?.name || "Unknown");
  let signature_color = $derived(themeStore.get_signature_color(entity));
</script>

<article
  class="panel-container"
  class:side-left={side === "left"}
  class:side-right={side === "right"}
  style="--entity-color: {signature_color}"
>
  <div
    class="visual-anchor"
    role="button"
    tabindex="0"
    onclick={() => app.toggle_profile(true, entity)}
    onkeydown={(e) => e.key === "Enter" && app.toggle_profile(true, entity)}
    aria-label="View Profile: {name}"
  >
    <ProfilePicture {entity} />
  </div>
</article>

<style>
  .panel-container {
    width: 100%;
    height: 100%;
    pointer-events: auto;
    position: relative;
    overflow: hidden;
  }

  .visual-anchor {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
    background: var(--glass-xs);
  }
</style>
