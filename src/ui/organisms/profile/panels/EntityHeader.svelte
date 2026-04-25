<script>
  /**
   * @file src/ui/organisms/profile/panels/EntityHeader.svelte
   * 🏷️ THE IDENTITY BANNER
   * Handles the top-level name and description of the entity.
   */
  import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
  import TextField from "@ui/atoms/TextField.svelte";
  import { fitText } from "@ui/utils/actions/fit-text.js";

  let { char = $bindable(), is_editing } = $props();
</script>

<header class:is-editing={is_editing} data-testid="profile-header">
  {#if is_editing}
    <h1 class="name edit no-tooltip" aria-label="Edit Entity Name">
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
      class="name no-tooltip"
      aria-label="Entity Name"
      use:fitText={{
        maxSize: 80,
        minSize: 16,
        lineHeight: "var(--line-height-s)",
      }}
    >
      {char.name || ENTITY_FRAGMENTS.name}
    </h1>
  {/if}
  <div class="description">
    <TextField
      is_edit={is_editing}
      class="description"
      placeholder={ENTITY_FRAGMENTS.description}
      value={char.description || ""}
      oninput={(e) => (char.description = e.target.value)}
    />
  </div>
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
    font-size: var(--font-size-xxxxxl); /* 80px */
    font-weight: var(--font-weight-l);
    letter-spacing: -(var(--letter-spacing-s));
    text-shadow: var(--shadow-font);
    margin: 0;
    padding: var(--spacing-xs);
    text-align: left;
    border-radius: var(--border-radius-m);
    transition:
      background var(--motion-l),
      border-color var(--motion-l),
      box-shadow var(--motion-l);
    box-shadow: inset 0 0 0 1px transparent;
    min-height: 1.5em; /* Stable height ceiling */
    line-height: var(--line-height-s);
    outline: none;
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
  }

  .name.edit {
    cursor: text;
    pointer-events: auto;
    caret-color: var(--signature-color);
  }

  .name.edit:focus-within {
    outline: none;
    background: rgb(var(--color-white-rgb) / 3%);
    border-bottom-color: var(--signature-color, var(--color-frisk));
  }

  .name.edit span {
    display: inline-block;
    min-width: 2px;
    outline: none;
  }

  .name.edit span:empty::before {
    content: attr(data-placeholder);
    color: var(--color-frisk);
    opacity: 0.4;
    font-style: italic;
    pointer-events: none;
  }

  .description {
    width: 100%;
    padding: 0 var(--spacing-xs);
  }

  /* Target both edit and readonly modes of the TextField */
  .description :global(.field-foundation),
  .description :global(.readonly-field) {
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    box-shadow: none;
    padding: 0;
    font-size: var(--font-size-l);
    font-weight: var(--font-weight-m);
    color: var(--font-color-m);
    line-height: var(--line-height-m);
    min-height: 1.5em;
    min-width: 2px;
    transition:
      color var(--motion-l),
      background var(--motion-l),
      border-color var(--motion-l);
    border-radius: 0;
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .description :global(.field-foundation:hover) {
    background: transparent;
    border-color: transparent;
  }

  .description :global(.field-foundation:focus) {
    background: rgb(var(--color-white-rgb) / 3%);
    border-bottom-color: var(--signature-color, var(--color-frisk));
    outline: none;
  }

  .description :global(.field-foundation::placeholder) {
    font-size: var(--font-size-m);
    opacity: 0.6;
  }
</style>
