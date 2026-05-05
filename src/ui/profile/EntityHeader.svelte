<script>
  /**
   * @file src/ui/profile/EntityHeader.svelte
   * 🪪 THE IDENTITY BANNER
   * Handles the top-level name and description of the entity.
   */
  import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
  import TextField from "@atoms/TextField.svelte";
  import { fitText } from "@utils/fit-text.js";

  let { char = $bindable(), is_editing, busy_fields } = $props();
</script>

<header class:is-editing={is_editing} data-testid="profile-header">
  {#if is_editing}
    <h1 class="title editing no-tooltip" aria-label="Edit Entity Name">
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
      class="title no-tooltip"
      aria-label="Entity Name"
      use:fitText={{
        maxSize: 64,
        minSize: 20,
        lineHeight: "1.0",
      }}
    >
      {char.name || ENTITY_FRAGMENTS.name}
    </h1>
  {/if}

  <TextField
    is_edit={is_editing}
    class="field"
    noBackground={true}
    placeholder={ENTITY_FRAGMENTS.description}
    value={char.description || ""}
    oninput={(/** @type {any} */ e) => (char.description = e.currentTarget.value)}
    busy={busy_fields.has("description")}
  >
    {#snippet status()}
      {#if busy_fields.has("description")}
        <div class="status">
          <span class="tag pulse">GENERATING</span>
        </div>
      {/if}
    {/snippet}
  </TextField>
</header>

<style>
  header {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: calc(-1 * var(--spacing-m)) calc(-1 * var(--spacing-m)) 0;
    padding: var(--spacing-m);
    background: color-mix(
      in srgb,
      rgb(from var(--color-gunmetal) r g b / 20%),
      var(--signature-color) 12%
    );
    backdrop-filter: var(--blur-m);
    border-bottom: var(--border-s);
    z-index: var(--z-index-xl);
    transition: all var(--motion-l);
    border-top-right-radius: var(--border-radius-m);
  }

  .title {
    width: 100%;
    color: var(--signature-color);
    font-size: var(--font-size-xxxxl);
    font-weight: var(--font-weight-xl);
    letter-spacing: var(--letter-spacing-s);
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
    min-height: 4rem;
    line-height: 1.0;
    outline: none;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
  }

  .title.editing {
    cursor: text;
    pointer-events: auto;
    caret-color: var(--signature-color);
    font-size: 64px;
  }

  .title.editing:focus-within {
    background: rgb(var(--color-white-rgb) / 3%);
  }

  .title.editing span {
    display: inline-block;
    min-width: 2px;
    outline: none;
  }

  .title.editing span:empty::before {
    content: attr(data-placeholder);
    color: var(--color-frisk);
    opacity: 0.4;
    font-style: italic;
    pointer-events: none;
  }

  .status {
    display: flex;
    align-items: center;
  }

  @media (width <= 768px) {
    .title {
      font-size: var(--font-size-xl);
      padding: var(--spacing-xxs);
    }

    header {
      padding: var(--spacing-s);
      margin-bottom: var(--spacing-s);
    }
  }

  @media (width <= 480px) {
    .title {
      font-size: var(--font-size-l);
    }

    header {
      padding: var(--spacing-xs);
    }
  }
</style>
