<script>
  /**
   * @file StoryCard.svelte
   * 📖 STORY MODULE
   * A high-fidelity atmospheric card representing a story archive.
   */
  import Button from "@atoms/Button.svelte";
  import { themeStore } from "@theme/palette.svelte.js";

  /** @typedef {import('@data/repository.js').Story} Story */
  /** @type {{
   *    story: Story,
   *    onclick?: (e: MouseEvent) => void
   *  }} */
  let { story, onclick = () => {} } = $props();

  /**
   * Formats timestamps to a standard Swedish/ISO-adjacent format.
   * Clean YYYY-MM-DD HH:mm without seconds or commas.
   * @param {number|string|Date} ts
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

<div class="story-item interactable" style="--signature-color: {signature_color}">
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
    padding: var(--spacing-3);
    background: var(--glass-base);
    backdrop-filter: var(--blur-whisper);

    /* Standard 1px border all around for radius consistency */
    border: var(--border-muted);

    /* Accent bar via inset shadow to avoid corner clipping */
    box-shadow: var(--shadow-ambient);
    border-radius: var(--radius-subtle);
    cursor: pointer;
    transition: all var(--duration-standard) var(--ease-standard);
    text-align: left;
    position: relative;
    overflow: hidden;
    width: 100%;
  }

  .story-item:hover {
    background: var(--glass-elevated);
    border-color: var(--signature-color);
    box-shadow: var(--shadow-focus);
  }

  .story-backdrop {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 70%;
    z-index: var(--floor-z-index);
    pointer-events: none;
    opacity: var(--opacity-whisper);
    mask-image: linear-gradient(
      to left,
      var(--color-black) 0%,
      var(--color-black) 20%,
      transparent 100%
    );
    transition:
      opacity var(--duration-fast),
      width var(--duration-reflex);
  }

  .story-backdrop.has-image {
    background-size: cover;
    background-position: center;
    opacity: var(--opacity-muted);
  }

  .story-item:hover .story-backdrop {
    opacity: var(--opacity-base);
    width: 80%;
  }

  .story-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-px);
    z-index: var(--mid-z-index);
    position: relative;
    padding-left: var(--spacing-2); /* Breath for the accent bar */
  }

  .story-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-white);
  }

  .story-meta {
    font-size: var(--font-size-tiny);
    color: var(--font-color-base);
  }
</style>
