<script>
  /**
   * @file src/ui/profile/EntityHeader.svelte
   * 🪪 THE IDENTITY BANNER
   * Handles the top-level name and description of the entity.
   */
  import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
  import { fitText } from "@utils/fit-text.js";
  import { auto_resize } from "@utils/auto-resize.js";

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
    <h1 class="banner-name edit no-tooltip" class:is-active={is_name_active} aria-label="Edit Entity Name">
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
      class="banner-name no-tooltip"
      aria-label="Entity Name"
      use:fitText={{ minSize: 40 }}
    >
      {char.name || ENTITY_FRAGMENTS.name}
    </h1>
  {/if}

  {#if is_editing}
    <textarea
      class="banner-description custom-scrollbar"
      placeholder={ENTITY_FRAGMENTS.description}
      bind:value={char.description}
      use:auto_resize
      aria-label="Edit Entity Description"
      onfocus={() => (active_field = null)}
    ></textarea>
  {:else}
    <p class="banner-description-text" data-placeholder={ENTITY_FRAGMENTS.description}>
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

    /* [063] Force full width to fill parent padding area via negative margins */
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

  .banner-name {
    width: 100%;
    color: var(--signature-color);
    font-size: clamp(32px, 8vw, 64px); /* Fluid typography */
    font-weight: var(--font-weight-xl);
    letter-spacing: -0.02em;
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
    min-height: 4.5rem; /* Slightly increased for clamp stability */
    line-height: 1;
    outline: none;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
  }

  .banner-name.edit {
    cursor: text;
    pointer-events: auto;
    caret-color: var(--signature-color);
  }

  .banner-name.edit:focus-within {
    background: transparent;
  }

  .banner-name.edit span {
    display: inline-block;
    min-width: 2px;
    outline: none;
  }

  .banner-name.edit span:empty::before {
    content: attr(data-placeholder);
    color: var(--color-frisk);
    opacity: 0.4;
    font-style: italic;
    pointer-events: none;
  }

  .banner-description,
  .banner-description-text {
    width: 100%;
    margin: 0;
    margin-top: var(--spacing-xxs);
    color: var(--color-white);
    font-family: var(--font-family-body);
    font-size: var(--font-size-m);
    line-height: var(--line-height-m);
    padding: var(--spacing-xs) var(--spacing-s);
  }

  /* [063] Naked Description Aesthetic: No borders, no focus glow, human-first reading */
  .banner-description {
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    opacity: 0.8;
    transition: opacity var(--motion-m);
    border-radius: var(--border-radius-m);
    box-shadow: none;
  }

  .banner-description:focus {
    opacity: 1;
    background: transparent;
    box-shadow: none;
  }

  .banner-description-text {
    opacity: 0.7;
    white-space: pre-wrap;
    transition: opacity var(--motion-m);
  }

  .banner-description-text:empty::before {
    content: attr(data-placeholder);
    color: var(--color-frisk);
    opacity: 0.4;
    font-style: italic;
  }

  /* --- RESPONSIVE ADAPTATION --- */
  @media (width <= 850px) {
    /* Synchronized with Profile.svelte breakpoint */
    header {
      padding: var(--spacing-s);
      border-radius: 0;
      margin: calc(-1 * var(--spacing-s)) calc(-1 * var(--spacing-s)) var(--spacing-s);
    }

    .banner-name {
      font-size: var(--font-size-xl);
      padding: var(--spacing-xxs);
      min-height: auto;
    }
  }

  @media (width <= 480px) {
    header {
      padding: var(--spacing-xs);
    }

    .banner-name {
      font-size: var(--font-size-l);
    }
  }
</style>
