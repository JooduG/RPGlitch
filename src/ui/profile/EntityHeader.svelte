<script>
  /**
   * @file src/ui/profile/EntityHeader.svelte
   * 🪪 THE IDENTITY BANNER
   * Renders the entity's name and description in read and edit states.
   */
  import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
  import { fit_text } from "@utils/fit-text.js";
  import { auto_resize } from "@utils/auto-resize.js";
  import { tooltip } from "@atoms/Tooltip.svelte";

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

<header class:is-editing={is_editing} data-testid="profile-header">
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
    gap: var(--spacing-xs);

    /* [063] Bleed full width into parent padding via negative margins */
    width: calc(100% + (2 * var(--spacing-m)));
    margin: calc(-1 * var(--spacing-m));
    padding: var(--spacing-m);
    background: color-mix(
      in srgb,
      rgb(from var(--color-gunmetal) r g b / 20%),
      var(--signature-color) 12%
    );
    z-index: var(--z-index-xl);
    transition: all var(--motion-l);
    border-top-right-radius: calc(var(--border-radius-l) - 1px);
  }

  /* ── NAME ─────────────────────────────────────────────────────────── */
  .name {
    width: 100%;
    margin: 0;
    padding: var(--spacing-xs);
    color: var(--signature-color);
    font-size: clamp(32px, 8vw, 64px);
    font-weight: var(--font-weight-xl);
    letter-spacing: -0.02em;
    text-shadow: var(--shadow-font);
    text-align: left;
    line-height: 1;
    min-height: 4.5rem;
    outline: none;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-m);
    box-shadow: none;
    display: flex;
    align-items: center;
    transition:
      background var(--motion-l),
      border-color var(--motion-l),
      box-shadow var(--motion-l);
  }

  .name.edit {
    cursor: text;
    caret-color: var(--signature-color);
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

  /* ── DESCRIPTION ──────────────────────────────────────────────────── */
  .description {
    width: 100%;
    margin: 0;
    margin-top: var(--spacing-xxs);
    padding: var(--spacing-xs) var(--spacing-s);
    color: var(--color-white);
    font-family: var(--font-family-body);
    font-size: var(--font-size-body);
    line-height: var(--line-height-m);
  }

  /* [063] Naked textarea: borderless, no glow, human-first reading */
  .description.edit {
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    opacity: 0.8;
    border-radius: var(--border-radius-m);
    box-shadow: none;
    transition: opacity var(--motion-m);
  }

  .description.edit:focus {
    opacity: 1;
  }

  .description:not(.edit) {
    opacity: 0.7;
    white-space: pre-wrap;
    transition: opacity var(--motion-m);
  }

  .description:not(.edit):empty::before {
    content: attr(data-placeholder);
    color: var(--color-frisk);
    opacity: 0.4;
    font-style: italic;
  }

  /* ── RESPONSIVE ───────────────────────────────────────────────────── */
  @media (width <= 850px) {
    /* Synchronized with Profile.svelte breakpoint */
    header {
      padding: var(--spacing-s);
      border-radius: 0;
      margin: calc(-1 * var(--spacing-s)) calc(-1 * var(--spacing-s)) var(--spacing-s);
    }

    .name {
      font-size: var(--font-size-h5);
      padding: var(--spacing-xxs);
      min-height: auto;
    }
  }

  @media (width <= 480px) {
    header {
      padding: var(--spacing-xs);
    }

    .name {
      font-size: var(--font-size-h6);
    }
  }
</style>
