<script>
  /**
   * @file StoryboardDynamicTitle.svelte
   * THE DYNAMIC NARRATIVE HEADER
   * Logic:
   * 1. Generates a randomized "cinematic" title based on selected entities.
   * 2. Supports direct editing via contenteditable.
   * 3. Harmonized with Chalk Regime and Chess Grid.
   */
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { pickRandom } from "@core/utils.js";
  import { app } from "@state/app.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";

  // ============================================
  // LOCAL STATE
  // ============================================
  let custom_title = $state("");
  let is_custom = $state(false);

  // ============================================
  // CONSTANTS
  // ============================================
  const PREFIXES = {
    STANDARD: [
      "The Story of",
      "The Adventures of",
      "The Tale of",
      "The Legend of",
      "The Saga of",
      "Chronicles of",
      "The Journey of",
    ],
    FRACTAL: ["Adventures in", "Tales from", "The Fractal of", "Journey to"],
  };

  // ============================================
  // DERIVED DATA
  // ============================================
  /** @param {any} entity */
  const get_color = (entity) => themeStore.get_signature_color(entity);

  /**
   * Generates structured title parts with entity colors
   */
  let title_parts = $derived.by(() => {
    if (is_custom && custom_title) return [{ text: custom_title }];

    // Trigger on reroll
    void app.drawer.reroll_count;

    const { selected_ai: ai, selected_user: user, selected_fractal: fractal } = app;
    const has_entities = ai || user;
    const has_fractal = !!fractal;

    if (has_entities && has_fractal) {
      const prefix = pickRandom(PREFIXES.STANDARD);
      /** @type {Array<{text: string, color?: string}>} */
      const parts = [{ text: `${prefix} ` }];

      if (ai && user && ai.id === user.id) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else if (ai && user) {
        parts.push({ text: ai.name, color: get_color(ai) });
        parts.push({ text: " & " });
        parts.push({ text: user.name, color: get_color(user) });
      } else if (ai) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else {
        parts.push({ text: user.name, color: get_color(user) });
      }

      parts.push({ text: " in " });
      parts.push({ text: fractal.name, color: get_color(fractal) });
      return parts;
    }

    if (has_entities) {
      const prefix = pickRandom(PREFIXES.STANDARD);
      /** @type {Array<{text: string, color?: string}>} */
      const parts = [{ text: `${prefix} ` }];

      if (ai && user && ai.id === user.id) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else if (ai && user) {
        parts.push({ text: ai.name, color: get_color(ai) });
        parts.push({ text: " & " });
        parts.push({ text: user.name, color: get_color(user) });
      } else if (ai) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else {
        parts.push({ text: user.name, color: get_color(user) });
      }
      return parts;
    }

    if (has_fractal) {
      const prefix = pickRandom(PREFIXES.FRACTAL);
      return [{ text: `${prefix} ` }, { text: fractal.name, color: get_color(fractal) }];
    }

    return [{ text: "Your story begins here..." }];
  });

  // ============================================
  // HANDLERS
  // ============================================
  /** @param {Event & { currentTarget: EventTarget & HTMLElement }} e */
  function handle_input(e) {
    custom_title = e.currentTarget.textContent;
    is_custom = true;
  }

  /**
   *
   */
  function handle_reset() {
    is_custom = false;
    custom_title = "";
    app.reroll_title();
  }
</script>

<h1
  class="root"
  use:tooltip={{ text: "Double-click to re-roll title" }}
  contenteditable="true"
  aria-label="Story Title"
  oninput={handle_input}
  ondblclick={handle_reset}
>
  {#if is_custom}
    <span class="text-shadow-outline">{custom_title}</span>
  {:else}
    {#each title_parts as part, i (i)}
      {#if part.color}
        <span
          class="entity text-shadow-bloom"
          style:--entity-color={part.color}
          style:--signature-color={part.color}>{part.text}</span
        >
      {:else}
        <span class="prefix text-shadow-outline">{part.text}</span>
      {/if}
    {/each}
  {/if}
</h1>

<style>
  .root {
    /* Layout & Alignment */
    display: block;
    width: 100%;
    max-width: var(--columns-12);
    margin: 0 auto;
    padding: var(--spacing-2) var(--spacing-4);

    /* Typography */
    font-family: var(--font-family-cursive);
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-base);
    line-height: var(--font-height-short);
    letter-spacing: var(--font-spacing-tight);
    text-align: center;
    text-wrap: balance;
    color: var(--pure-white);
    box-shadow: var(--title-shadow-ambient);

    /* Interactive */
    cursor: text;
    user-select: text;
    pointer-events: none; /* Allow interaction through to cards */
    transition:
      background var(--motion-standard),
      transform var(--motion-standard),
      box-shadow var(--motion-standard);

    /* Positioning */
    transform: translateY(calc(var(--spacing-12) * -1));
    z-index: var(--overlay-z-index);
  }

  /* Re-enable pointer events for the actual text content */
  .root > span {
    pointer-events: auto;
  }

  .root:hover {
    background: var(--glass-base);
    border-radius: var(--radius-subtle);
  }

  .root:focus {
    background: var(--glass-sunken);
    outline: none;
    box-shadow: var(--title-shadow-focus);
    border-radius: var(--radius-subtle);
  }

  .prefix,
  .entity {
    display: inline;
    padding: 0 var(--spacing-1);
  }

  .text-shadow-outline {
    text-shadow: 0 0 var(--spacing-4) var(--void-black);
  }

  .entity {
    color: var(--entity-color);
    text-shadow:
      0 var(--spacing-pixel) var(--spacing-2px) var(--void-black),
      0 0 var(--spacing-2) var(--entity-color);

    /* Extra Bloom for entities */
    filter: drop-shadow(0 0 var(--spacing-1) var(--void-black));
  }
</style>
