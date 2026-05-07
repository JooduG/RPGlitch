<script>
  import { app } from "@state/app.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { pickRandom } from "@core/utils.js";
  // ============================================
  // LOCAL STATE (Component-Owned)
  // ============================================
  let custom_title = $state("");
  let is_custom = $state(false);
  // ============================================
  // TITLE PREFIXES (Content, not state)
  // ============================================
  const STANDARD_PREFIXES = [
    "The Story of",
    "The Adventures of",
    "The Tale of",
    "The Legend of",
    "The Saga of",
    "Chronicles of",
    "The Journey of",
  ];
  const FRACTAL_PREFIXES = ["Adventures in", "Tales from", "The Fractal of", "Journey to"];
  // ============================================
  // DERIVED TITLE PARTS
  // ============================================
  /** @param {any} entity */
  const get_color = (entity) => themeStore.get_signature_color(entity);
  /**
   * Generates structured title parts with entity colors for rich rendering
   */
  let title_parts = $derived.by(() => {
    // If custom title is set, return plain text
    if (is_custom && custom_title) {
      return [{ text: custom_title }];
    }
    // Reference reroll_count to trigger recalculation
    void app.drawer.reroll_count;
    const ai = app.selected_ai;
    const user = app.selected_user;
    const fractal = app.selected_fractal;
    // Standard mode - full format
    const has_entities = ai || user;
    const has_fractal = !!fractal;
    if (has_entities && has_fractal) {
      const prefix = pickRandom(STANDARD_PREFIXES);
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
    } else if (has_entities) {
      const prefix = pickRandom(STANDARD_PREFIXES);
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
    } else if (has_fractal) {
      const prefix = pickRandom(FRACTAL_PREFIXES);
      return [{ text: `${prefix} ` }, { text: fractal.name, color: get_color(fractal) }];
    }
    return [{ text: "Your story begins here..." }];
  });
  // ============================================
  // EVENT HANDLERS
  // ============================================
  /** @param {Event & { currentTarget: HTMLElement }} e */
  function handle_input(e) {
    custom_title = e.currentTarget.textContent;
    is_custom = true;
  }
  function handle_dbl_click() {
    is_custom = false;
    custom_title = "";
    app.reroll_title();
  }
</script>

<h1
  use:tooltip={{ text: "Double-click to re-roll title" }}
  contenteditable="true"
  aria-label="Double-click to re-roll title"
  oninput={handle_input}
  ondblclick={handle_dbl_click}
>
  {#if is_custom}
    {custom_title}
  {:else}
    <span class="title-content">
      {#each title_parts as part, i (i)}
        {#if part.color}
          <span class="entity-name" style="--part-color: {part.color}; color: var(--part-color);"
            >{part.text}</span
          >
        {:else}
          {part.text}
        {/if}
      {/each}
    </span>
  {/if}
</h1>

<style>
  /* Import Satisfy font for the special story title */
  @import "https://fonts.googleapis.com/css2?family=Satisfy&display=swap";

  h1 {
    font-size: clamp(var(--font-size-xxxl), 10vw, var(--font-size-xxxxxl));
    line-height: 1.1;
    min-height: calc(var(--line-height-s) * 2em);
    margin: 0;
    font-family: Satisfy, cursive;
    letter-spacing: var(--letter-spacing-s);
    cursor: text;
    transition: all var(--motion-l) var(--motion-elastic);
    border-radius: var(--border-radius-l);
    padding: var(--spacing-xxs) var(--spacing-s);
    text-wrap: balance;
    max-width: 80vw;
    margin-inline: auto;

    /* Soft ethereal glow */
    text-shadow: 0 0 20px rgb(var(--color-black-rgb) / 50%);
    display: block;
    min-width: 300px;
    text-align: center;
  }

  h1:hover {
    background: var(--glass-xs);
  }

  h1:focus-within {
    outline: none;
    background: var(--glass-l);
    --title-focus-shadow:
      0 0 0 var(--spacing-xxs) var(--signature-color), 0 0 var(--spacing-l) var(--color-pink);

    box-shadow: var(--title-focus-shadow);
  }

  h1 .title-content {
    display: inline;
    text-wrap: balance;
  }

  h1 .entity-name {
    font-weight: inherit;
    text-shadow: var(--shadow-font);
    white-space: nowrap;
  }
</style>
