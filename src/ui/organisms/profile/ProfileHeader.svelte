<script>
  /**
   * @file ProfileHeader.svelte
   * 🏷️ THE IDENTITY BANNER
   * Handles the top-level name and description of the entity.
   * Flattened Schema Compliant.
   */
  import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
  import { fitText } from "@ui/utils/actions/fit-text.js";
  import { safe_html } from "@ui/utils/actions/safe-html.js";
  let { char = $bindable(), is_editing, render_markdown, auto_resize } = $props();
</script>

<header class:is-editing={is_editing} data-testid="profile-header">
  {#if is_editing}
    <h1 class="name edit" aria-label="Edit Character Name">
      <span
        contenteditable="true"
        bind:innerText={char.name}
        role="textbox"
        tabindex="0"
        data-placeholder={ENTITY_FRAGMENTS.name}
      ></span>
    </h1>
  {:else}
    <h1
      class="name"
      aria-label="Character Name"
      use:fitText={{
        maxSize: 80,
        minSize: 16,
        lineHeight: "var(--line-height-heading)",
      }}
    >
      {char.name || ENTITY_FRAGMENTS.name}
    </h1>
  {/if}
  {#if is_editing}
    <textarea
      use:auto_resize
      class="description edit"
      value={char.description || ""}
      oninput={(e) => (char.description = e.target.value)}
      placeholder={ENTITY_FRAGMENTS.description}
    ></textarea>
  {:else}
    <div
      class="description readonly"
      class:muted-info={!char.description}
      use:safe_html={render_markdown(char.description || ENTITY_FRAGMENTS.description)}
    ></div>
  {/if}
</header>

<style>
  header {
    background: transparent;
    display: flex;
    flex-direction: column;
  }

  .name {
    width: 100%;
    color: var(--signature-color);
    font-size: var(--font-size-xxxxl);
    font-weight: 700;
    letter-spacing: -0.02em;
    text-shadow: var(--shadow-text);
    margin: 0;
    padding: var(--spacing-xs);
    text-align: left;
    border-radius: var(--border-radius-m);
    transition: background 0.2s;
    border: none;
    box-shadow: inset 0 0 0 1px transparent;
    min-height: 1.2em;
    line-height: var(--line-height-heading);
    outline: none;
    background: transparent;
  }

  .name.edit {
    cursor: text;
    pointer-events: auto;
    caret-color: var(--signature-color);
  }

  .name.edit:hover,
  .name.edit:focus-within {
    background: var(--surface-sunken);
    box-shadow: inset 0 0 0 1px var(--border-light);
  }

  .name.edit span {
    outline: none;
  }

  .name.edit span:empty::before {
    content: attr(data-placeholder);
    opacity: 0.3;
    font-style: italic;
    font-weight: 400;
  }

  .name:not(.edit) {
    cursor: default;
    pointer-events: none;
  }

  .description {
    width: 100%;
    color: var(--font-color);
    font-family: inherit;
    font-size: var(--font-size-m);
    line-height: 1.5;
    min-height: 1.4em;
    transition: all 0.2s;
    border-radius: var(--border-radius-m);
    padding: var(--spacing-s);
    margin: 0;
    border: none;
    box-shadow: inset 0 0 0 1px transparent;
    background: transparent;
    resize: none;
    text-align: left;
  }

  .description:focus {
    outline: none;
  }

  .description.muted-info {
    opacity: var(--opacity-l);
    font-size: 0.9em;
    font-weight: 400;
  }

  .description.edit {
    pointer-events: auto;
    caret-color: var(--color-white);
    cursor: text;
  }

  .description.edit:hover,
  .description.edit:focus {
    background: var(--surface-sunken);
    box-shadow: inset 0 0 0 1px var(--border-light);
    outline: none;
  }

  .description.readonly {
    pointer-events: auto;
    white-space: pre-wrap;
    cursor: default;
  }

  .description.readonly :global(strong) {
    font-weight: 800;
    color: var(--color-white);
  }

  .description.readonly :global(em) {
    font-style: italic;
    opacity: 0.9;
  }
</style>
