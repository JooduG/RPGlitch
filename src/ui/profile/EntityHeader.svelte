<script>
  /**
   * @file src/ui/profile/EntityHeader.svelte
   * 🏷️ ENTITY HEADER — Modularized name and description logic.
   * Chalk Regime UI · Standardized Spacing
   */
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { fit_text } from "@utils/fit-text.js";
  import { auto_resize } from "@utils/auto-resize.js";
  import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";

  let {
    char = $bindable(),
    is_editing = false,
    active_field = $bindable(),
    signature_color = "var(--signature-color)",
    className = "",
  } = $props();

  const is_name_active = $derived(active_field?.key === "name");
</script>

<header
  class="root {className}"
  class:is-editing={is_editing}
  style="--header-signature: {signature_color}"
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
  .root {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    width: 100%;
    padding: var(--spacing-6) var(--spacing-4) var(--spacing-4);
    background: color-mix(
      in srgb,
      rgb(from var(--gunmetal) r g b / var(--opacity-ghost)),
      var(--header-signature) 8%
    );
    z-index: var(--surface-z-index);
    border-bottom: var(--spacing-pixel) solid
      rgb(from var(--pure-white) r g b / var(--opacity-ghost));
    transition: background var(--duration-standard) var(--ease-standard);
  }

  .name {
    width: 100%;
    margin: 0;
    padding: var(--spacing-1);
    color: var(--header-signature);
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
    display: flex;
    align-items: center;
    transition: all var(--duration-standard);
  }

  .name.edit {
    cursor: text;
    caret-color: var(--header-signature);
  }

  .name.edit span {
    display: inline-block;
    min-width: var(--spacing-pixel);
    outline: none;
  }

  .name.edit span:empty::before {
    content: attr(data-placeholder);
    color: var(--frisk);
    opacity: var(--opacity-muted);
    font-style: italic;
    pointer-events: none;
  }

  .description {
    width: 100%;
    margin: var(--spacing-0);
    margin-top: var(--spacing-pixel);
    padding: var(--spacing-1) var(--spacing-2);
    color: var(--pure-white);
    font-size: var(--font-size-base);
    opacity: var(--opacity-moderate);
    white-space: pre-wrap;
    transition: opacity var(--duration-fast);
  }

  .description.edit {
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    opacity: var(--opacity-heavy);
  }

  .description.edit:focus {
    opacity: var(--opacity-solid);
  }

  .description:empty::before {
    content: attr(data-placeholder);
    color: var(--frisk);
    opacity: var(--opacity-muted);
    font-style: italic;
  }

  /* Responsive Adjustments */
  :global(.is-mobile) .root {
    padding: var(--spacing-4);
  }

  :global(.is-mini) .root {
    padding: var(--spacing-2);
  }

  :global(.is-mini) .name {
    font-size: var(--font-size-h5);
  }
</style>
