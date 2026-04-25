<script>
  /**
   * @file src/ui/organisms/profile/panels/EntityHeader.svelte
   * 🏷️ THE IDENTITY BANNER
   * Handles the top-level name and description of the entity.
   */
  import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
  import TextField from "@ui/atoms/TextField.svelte";
  import { fitText } from "@ui/utils/actions/fit-text.js";

  let { char = $bindable(), is_editing, busy_fields } = $props();
</script>

<header class:is-editing={is_editing} data-testid="profile-header">
  <div class="header-glass-context">
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
        class="description-field"
        placeholder={ENTITY_FRAGMENTS.description}
        value={char.description || ""}
        oninput={(e) => (char.description = e.target.value)}
        busy={busy_fields.has("description")}
      />
    </div>
  </div>
</header>

<style>
  header {
    position: sticky;
    top: calc(-1 * var(--spacing-m));
    margin: calc(-1 * var(--spacing-m)) calc(-1 * var(--spacing-m)) 0;
    padding: var(--spacing-m);
    background: color-mix(in srgb, var(--color-gunmetal) 85%, var(--signature-color) 15%);
    backdrop-filter: var(--blur-l);
    border-bottom: var(--border-s);
    z-index: var(--z-index-xl);
    transition: all var(--motion-l);
  }

  .header-glass-context {
    display: flex;
    flex-direction: column;
    width: 100%;
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
    box-shadow: none;
    min-height: 1.5em; /* Stable height ceiling */
    line-height: var(--line-height-s);
    outline: none;
    background: transparent;
    border: none;
  }

  .name.edit {
    cursor: text;
    pointer-events: auto;
    caret-color: var(--signature-color);
  }

  .name.edit:focus-within {
    outline: none;
    background: rgb(var(--color-white-rgb) / 3%);
    border: none;
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
    padding: 0; /* Align perfectly with name padding */
    margin-top: 0;
  }

  :global(.description-field) {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  :global(.description-field.is-focused) {
    background: transparent !important;
    box-shadow: none !important;
  }

  :global(.description-field .field-header) {
    display: none !important; /* Human eyes only - remove AI header */
  }

  :global(.enhance-btn) {
    color: var(--color-white) !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 80%));
  }

  :global(.enhance-btn:hover) {
    background: transparent !important;
    color: var(--color-white) !important;
    transform: scale(1.1);
  }

  :global(.description-field .field-foundation),
  :global(.description-field .readonly-field) {
    padding: var(--spacing-xs) !important; /* Match name padding */
    font-size: var(--font-size-l) !important;
    color: var(--font-color-m) !important;
    background: transparent !important;
    border: none !important;
    outline: none !important;
  }

  :global(.description-field .field-foundation:focus) {
    background: rgb(var(--color-white-rgb) / 3%) !important;
    border: none !important;
  }
</style>
