<script>
  /**
   * @file StoryCard.svelte
   * 📖 STORY MODULE
   * A high-fidelity atmospheric card representing a story archive.
   */
  import Button from "@atoms/Button.svelte";
  import { themeStore } from "@theme/palette.svelte.js";

  /** @type {{
   *    story: Object,
   *    onclick?: (e: MouseEvent) => void
   *  }} */
  let { story, onclick = () => {} } = $props();

  /**
   * Formats timestamps to a standard Swedish/ISO-adjacent format.
   * Clean YYYY-MM-DD HH:mm without seconds or commas.
   */
  function format_timestamp(ts) {
    if (!ts) return "---";
    return new Date(ts)
      .toLocaleString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "");
  }

  let signature_color = $derived(
    themeStore.get_signature_color({ signature_color: story.signature_color }),
  );
</script>

<div class="story-item" style="--signature-color: {signature_color}">
  <Button variant="invisible" cover={true} {onclick} />

  <div class="story-info">
    <span class="story-title">{story.title}</span>
    <span class="story-meta">{format_timestamp(story.lastPlayed)}</span>
  </div>

  {#if story.fractal_profile_picture}
    <div
      class="story-backdrop has-image"
      style="background-image: url({story.fractal_profile_picture})"
    ></div>
  {:else}
    <div class="story-backdrop" style="background-color: var(--signature-color)"></div>
  {/if}
</div>

<style>
  .story-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: var(--spacing-s);
    background: var(--glass-s);
    backdrop-filter: var(--blur-s);
    border: var(--border-s);
    border-left: var(--spacing-xxs) solid var(--signature-color, var(--color-white));
    border-radius: var(--border-radius-m);
    box-shadow: var(--shadow-s);
    cursor: pointer;
    transition: all var(--motion-s);
    text-align: left;
    position: relative;
    overflow: hidden;
    width: 100%;
  }

  .story-item:hover {
    background: var(--glass-l);
    border-top-color: var(--signature-color);
    border-right-color: var(--signature-color);
    border-bottom-color: var(--signature-color);
    box-shadow: var(--shadow-m);
  }

  .story-backdrop {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 70%;
    z-index: 0;
    pointer-events: none;
    opacity: 0.15;
    mask-image: linear-gradient(to left, black 0%, black 20%, transparent 100%);
    transition:
      opacity var(--motion-m),
      width var(--motion-s);
  }

  .story-backdrop.has-image {
    background-size: cover;
    background-position: center;
    opacity: 0.25;
  }

  .story-item:hover .story-backdrop {
    opacity: 0.4;
    width: 80%;
  }

  .story-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxxs);
    z-index: 1;
    position: relative;
  }

  .story-title {
    font-size: var(--font-size-m);
    font-weight: var(--font-weight-m);
    color: var(--color-white);
  }

  .story-meta {
    font-size: var(--font-size-xs);
    color: var(--font-color-m);
  }
</style>
