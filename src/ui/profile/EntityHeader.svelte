<script>
  /**
   * @file src/ui/profile/EntityHeader.svelte
   * 🪪 THE IDENTITY BANNER
   * Renders the entity's name and description in read and edit states.
   */
  import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { app } from "@state/app.svelte.js";
  import { auto_resize } from "@utils/auto-resize.js";
  import { fit_text } from "@utils/fit-text.js";

  /** @typedef {import("@data/content-normaliser.js").normalize} Normalizer */
  /** @typedef {ReturnType<Normalizer>} Entity */

  /** @type {{ char: Entity, is_editing: boolean, active_field: { key: string, label: string } | null }} */
  let {
    char = $bindable(),
    is_editing = false,
    active_field = $bindable({ key: "visual-prompt", label: "Image Prompt" }),
  } = $props();

  const is_name_active = $derived(active_field?.key === "name");
</script>

<header
  class:is-editing={is_editing}
  class:is-mobile={app.viewport.mobile}
  class:is-mini={app.viewport.mini}
  data-testid="profile-header"
>
  {#if is_editing}
    <h1
      class="name edit"
      class:is-active={is_name_active}
      use:tooltip={{ text: "Edit Entity Name" }}
      aria-label="Edit Entity Name"
    >
      <span
        contenteditable="true"
        bind:innerText={char.name}
        role="textbox"
        tabindex="0"
        data-placeholder={ENTITY_FRAGMENTS.name}
        onfocus={() => (active_field = { key: "name", label: "Entity Name" })}
      ></span>
    </h1>
  {:else}
    <h1
      class="name"
      use:tooltip={{ text: "Entity Name" }}
      aria-label="Entity Name"
      use:fit_text={{ minSize: 40 }}
    >
      {char.name || ENTITY_FRAGMENTS.name}
    </h1>
  {/if}

  {#if is_editing}
    <textarea
      class="description edit scrollbar"
      use:tooltip={{ text: "Edit Entity Description" }}
      placeholder={ENTITY_FRAGMENTS.description}
      bind:value={char.description}
      use:auto_resize
      aria-label="Edit Entity Description"
      onfocus={() => (active_field = null)}
    ></textarea>
  {:else}
    <p class="description" data-placeholder={ENTITY_FRAGMENTS.description}>
      {char.description || ""}
    </p>
  {/if}
</header>

<style>
  header {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);

    /* [063] Bleed full width into parent padding via negative margins */
    width: calc(100% + (2 * var(--spacing-4)));
    margin: calc(-1 * var(--spacing-4));
    padding: var(--spacing-4);
    background: color-mix(
      in srgb,
      rgb(from var(--color-gunmetal) r g b / var(--opacity-ghost)),
      var(--signature-color) 12%
    );
    z-index: var(--surface-z-index);
    transition: all var(--duration-standard) var(--ease-standard);
    border-top-right-radius: calc(var(--radius-standard) - var(--spacing-pixel));
  }

  /* ── NAME ─────────────────────────────────────────────────────────── */
  .name {
    width: 100%;
    margin: 0;
    padding: var(--spacing-1);
    color: var(--signature-color);
    font-size: var(--font-size-h3);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-spacing-tight);
    text-shadow: var(--shadow-font);
    text-align: left;
    line-height: var(--font-height-short);
    min-height: calc(var(--spacing-12) * 1.5);
    outline: none;
    background: transparent;
    border: none;
    border-radius: var(--radius-standard);
    box-shadow: none;
    display: flex;
    align-items: center;
    transition:
      background var(--duration-standard),
      border-color var(--duration-standard),
      box-shadow var(--duration-standard);
  }

  .name.edit {
    cursor: text;
    caret-color: var(--signature-color);
  }

  .name.edit span {
    display: inline-block;
    min-width: var(--spacing-pixel);
    outline: none;
  }

  .name.edit span:empty::before {
    content: attr(data-placeholder);
    color: var(--color-frisk);
    opacity: var(--opacity-muted);
    font-style: italic;
    pointer-events: none;
  }

  /* ── DESCRIPTION ──────────────────────────────────────────────────── */

  .description {
    width: 100%;
    margin: 0;
    margin-top: var(--spacing-pixel);
    padding: var(--spacing-1) var(--spacing-2);
    color: var(--color-white);
    font-family: var(--font-family-base);
    font-size: var(--font-size-base);
    line-height: var(--font-height-base);
  }

  /* [063] Naked textarea: borderless, no glow, human-first reading */
  .description.edit {
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    opacity: var(--opacity-heavy);
    border-radius: var(--radius-standard);
    box-shadow: none;
    transition: opacity var(--duration-fast);
  }

  .description.edit:focus {
    opacity: var(--opacity-solid);
  }

  .description:not(.edit) {
    opacity: 0.7;
    white-space: pre-wrap;
    transition: opacity var(--duration-fast);
  }

  .description:not(.edit):empty::before {
    content: attr(data-placeholder);
    color: var(--color-frisk);
    opacity: var(--opacity-muted);
    font-style: italic;
  }

  /* ── RESPONSIVE ───────────────────────────────────────────────────── */

  header.is-mobile {
    /* Synchronized with Profile.svelte breakpoint */
    padding: var(--spacing-2);
    border-radius: 0;
    margin: calc(-1 * var(--spacing-2)) calc(-1 * var(--spacing-2)) var(--spacing-2);
  }

  header.is-mobile .name {
    font-size: var(--font-size-h5);
    padding: var(--spacing-pixel);
    min-height: auto;
  }

  header.is-mini {
    padding: var(--spacing-1);
  }

  header.is-mini .name {
    font-size: var(--font-size-h6);
  }
</style>
