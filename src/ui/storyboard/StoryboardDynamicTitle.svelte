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
  const get_color = (entity) => themeStore.get_signature_color(entity, "var(--gunmetal)");

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
    {custom_title}
  {:else}
    {#each title_parts as part, i (i)}
      {#if part.color}
        <span class="entity" style:--entity-color={part.color}>{part.text}</span>
      {:else}
        {part.text}
      {/if}
    {/each}
  {/if}
</h1>

<style>
  @import "https://fonts.googleapis.com/css2?family=Satisfy&display=swap";

  .root {
    /* Fluid size relative to column units */
    font-size: clamp(var(--font-size-h3), var(--columns-2), var(--font-size-h1));
    line-height: var(--font-height-short);
    margin: var(--spacing-0);
    font-family: Satisfy, cursive;
    letter-spacing: var(--font-spacing-tight);
    cursor: text;
    transition:
      background var(--motion-standard),
      transform var(--motion-standard),
      box-shadow var(--motion-standard);
    border-radius: var(--radius-standard);
    padding: var(--spacing-1) var(--spacing-4);
    text-wrap: balance;
    max-width: var(--columns-10);
    margin-inline: var(--spacing-0);
    display: block;
    text-align: center;
  }

  .root:hover {
    background: var(--glass-sunken);
    transform: var(--hover-lift);
  }

  .root:focus-within {
    outline: none;
    background: var(--glass-elevated);
    box-shadow: var(--title-shadow-focus);
  }

  .entity {
    font-weight: inherit;
    color: var(--entity-color);
    text-shadow:
      var(--shadow-font),
      0 0 var(--spacing-1) var(--entity-color),
      0 0 var(--spacing-pixel) var(--entity-color);
    white-space: nowrap;
    filter: drop-shadow(0 0 var(--spacing-pixel) var(--entity-color));
  }
</style>
