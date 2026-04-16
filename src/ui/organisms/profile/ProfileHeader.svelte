<script>
  /**
   * @file ProfileHeader.svelte
   * 🏷️ THE IDENTITY BANNER
   * Handles the top-level name and description of the entity.
   * Flattened Schema Compliant.
   */
  import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
  import { fitText } from "@ui/utils/actions/fit-text.js";
  import TextField from "@ui/atoms/TextField.svelte";
  let { char = $bindable(), is_editing, render_markdown } = $props();
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
        lineHeight: "var(--line-height-s)",
      }}
    >
      {char.name || ENTITY_FRAGMENTS.name}
    </h1>
  {/if}
  <TextField
    is_edit={is_editing}
    class="description"
    placeholder={ENTITY_FRAGMENTS.description}
    value={char.description || ""}
    oninput={(e) => (char.description = e.target.value)}
    {render_markdown}
  />
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
    font-weight: var(--font-weight-l);
    letter-spacing: -(var(--letter-spacing-s));
    text-shadow: var(--shadow-font);
    margin: 0;
    padding: var(--spacing-xs);
    text-align: left;
    border-radius: var(--border-radius-m);
    transition: background var(--motion-fast);
    box-shadow: inset 0 0 0 1px transparent;
    min-height: 1.2em;
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

  .name.edit:hover,
  .name.edit:focus-within {
    outline: none;
  }

  .name.edit span {
    outline: none;
  }

</style>
