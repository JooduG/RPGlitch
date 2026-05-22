<script>
  /**
   * @file StoryCard.svelte
   * 📖 STORY MODULE
   * A high-fidelity atmospheric card representing a story archive.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import Button from "@atoms/Button.svelte";
  import { themeStore } from "@theme/palette.svelte.js";

  /** @typedef {import('@data/repository.js').Story} Story */
  /** @type {{
   *    story: Story,
   *    active?: boolean,
   *    onclick?: (e: MouseEvent) => void
   *  }} */
  let { story, active = false, onclick = () => {} } = $props();

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
    themeStore.get_signature_color({ signature_color: story.signature_color }, "var(--gunmetal)"),
  );
</script>

<div
  class="root interactable"
  class:is-active={active}
  style="--signature-color: {signature_color}"
>
  <Button variant="invisible" cover={true} {onclick} />

  <div class="body">
    <span class="primary">{story.title}</span>
    <span class="secondary">
      {format_timestamp(story.lastPlayed)}{#if active} · ACTIVE{/if}
    </span>
  </div>

  {#if story.fractal_profile_picture}
    <div
      class="backdrop has-image"
      style="background-image: url({story.fractal_profile_picture})"
    ></div>
  {:else}
    <div class="backdrop" style="background-color: var(--signature-color)"></div>
  {/if}
</div>

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .root - The story card container.
   * .body - Inside metadata text area.
   * .primary - Story title.
   * .secondary - Timestamp & active badge.
   * .backdrop - Aesthetic backdrop overlay.
   */

  .root {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: var(--padding-standard);
    background: var(--glass-base);
    backdrop-filter: var(--blur-whisper);

    /* Standard 1px border all around for radius consistency */
    border: var(--border-muted);

    /* Accent bar via inset shadow to avoid corner clipping */
    box-shadow: var(--shadow-ambient);
    border-radius: var(--radius-standard);
    cursor: pointer;
    transition: all var(--duration-standard) var(--ease-standard);
    text-align: left;
    position: relative;
    overflow: hidden;
    width: 100%;
  }

  .root:hover {
    background: var(--glass-elevated);
    border-color: var(--signature-color);
    box-shadow: var(--shadow-standard);
  }

  /* --- ACTIVE STATE HIGHLIGHT --- */
  .root.is-active {
    background: var(--glass-elevated);
    border-color: var(--signature-color);
    box-shadow: var(--signature-glow), var(--shadow-standard);
  }

  /* --- BACKDROP --- */
  .backdrop {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 70%;
    z-index: var(--z-index-base);
    pointer-events: none;
    opacity: var(--opacity-whisper);
    mask-image: linear-gradient(
      to left,
      var(--void-black) 0%,
      var(--void-black) 20%,
      transparent 100%
    );
    transition:
      opacity var(--duration-fast),
      width var(--duration-fast);
  }

  .backdrop.has-image {
    background-size: cover;
    background-position: center;
    opacity: var(--opacity-whisper);
  }

  .root:hover .backdrop,
  .root.is-active .backdrop {
    opacity: var(--opacity-muted);
    width: 80%;
  }

  /* --- BODY & METADATA --- */
  .body {
    display: flex;
    flex-direction: column;
    gap: var(--gap-tight);
    z-index: var(--z-index-elevated);
    position: relative;
    padding-left: var(--padding-tight); /* Breath for the accent bar */
    pointer-events: none; /* Clicks pass through to the absolute Button layer */
  }

  .primary {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--pure-white);
  }

  .secondary {
    font-size: var(--font-size-tiny);
    color: var(--frisk);
  }

  .root.is-active .secondary {
    color: var(--signature-color);
    font-weight: var(--font-weight-bold);
  }
</style>
