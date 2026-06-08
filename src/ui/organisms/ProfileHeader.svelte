<script>
  /**
   * @file src/ui/organisms/ProfileHeader.svelte
   * 🪐 HIGH-FIDELITY PROFILE TRANSLATION NODE
   * Organism component managing designation titles and context description text blocks.
   * Enforces strict Svelte 5 state machine physics and Nordic styling token regimes.
   */
  import FitText from "@atoms/FitText.svelte";
  import { auto_resize } from "@actions";
  import { ENTITY_FRAGMENTS, NAME_PREFIXES } from "@intelligence";

  // --- PROP MATRIX BOUNDARIES ---
  let {
    name = $bindable(""),
    description = $bindable(""),
    is_editing = false,
    active_field = "",
    on_focus_field = (/** @type {string} */ _key, /** @type {string} */ _label) => {},
    class: className = "",
  } = $props();

  // --- INTERACTIVE SYSTEM RUNES ---
  /** @type {HTMLInputElement | undefined} */
  let name_input = $state();

  /**
   * Formats a name to be bottom-heavy if it consists of exactly 3 words.
   * @param {string} rawName
   * @returns {string}
   */
  function formatName(rawName) {
    if (!rawName) return "";
    const trimmed = rawName.trim();
    const words = trimmed.split(/\s+/);
    if (words.length !== 3) return trimmed;

    const prefixes = NAME_PREFIXES;

    if (prefixes.includes(words[0].toLowerCase())) {
      return `${words[0]} ${words[1]}\n${words[2]}`;
    }
    return `${words[0]}\n${words[1]} ${words[2]}`;
  }

  // Fine-grained tracking of edit state transitions to capture viewport focus boundaries
  $effect(() => {
    if (is_editing && active_field === "name" && name_input) {
      name_input.focus();
      name_input.select();
    }
  });
</script>

<header
  class="
    profile-header

    {className}"
  data-testid="profile-header"
>
  <div class="identity-info">
    {#if is_editing}
      <div class="editor-wrapper">
        <input
          bind:this={name_input}
          bind:value={name}
          class="editor"
          onfocus={() => on_focus_field("name", "Entity Name")}
        />
      </div>
    {:else}
      <h1 class="name">
        <FitText text={formatName(name)} class="fit-override" />
      </h1>
    {/if}
  </div>

  {#if is_editing}
    <div class="description-wrapper" data-expanded={active_field === "description"}>
      <textarea
        class="
          description
          edit
          textarea-scroll-track
        "
        placeholder={ENTITY_FRAGMENTS.description}
        bind:value={description}
        use:auto_resize
        onfocus={() => on_focus_field("description", "Description")}
      ></textarea>
    </div>
  {:else if description}
    <p class="description">{description}</p>
  {/if}
</header>

<style>
  .profile-header {
    flex-shrink: 0;
    width: var(--state-fill-end);
    min-width: 0;
    min-height: var(--font-size-h3);
    padding: var(--padding-standard);
    display: flex;
    flex-direction: column;
    gap: var(--gap-tight);
  }

  .meta-tag {
    font-size: var(--font-size-tiny);
    letter-spacing: var(--font-spacing-loose);
    font-weight: var(--font-weight-bold);
    color: var(--font-color-muted);
    opacity: var(--opacity-muted);
  }

  .identity-info {
    width: var(--state-fill-end);
    min-width: 0;
    flex-shrink: 0;
  }

  .name {
    color: var(--signature-color);
    display: block;
    line-height: 1.1;
    text-align: right;
    text-shadow: 0 var(--spacing-pixel) calc(var(--spacing-unit) * 2)
      rgb(from var(--void-black) r g b / var(--opacity-muted));
  }

  .name :global(.fit-override) {
    color: inherit;
  }

  /* --- HARDCORE FIELD CONTROLLERS --- */
  .editor-wrapper {
    position: relative;
    width: var(--state-fill-end);
    border-radius: var(--radius-standard);
    background: color-mix(in srgb, var(--signature-color) 4%, var(--glass-sunken));
    border: var(--border-width-base) solid transparent;
    transition:
      border-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard),
      background var(--duration-fast) var(--ease-standard);
  }

  .editor-wrapper::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    padding: var(--spacing-pixel);
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, transparent, var(--signature-color) 40%),
      transparent 40%
    );
    mask:
      linear-gradient(var(--pure-white) 0 0) content-box,
      linear-gradient(var(--pure-white) 0 0);
    mask-composite: exclude;
    opacity: var(--opacity-whisper);
    transition: opacity var(--duration-standard);
  }

  .editor-wrapper:focus-within {
    border-color: transparent;
    background: color-mix(in srgb, var(--signature-color) 8%, var(--glass-sunken));
  }

  .editor-wrapper:focus-within::before {
    opacity: var(--opacity-solid);
    background: linear-gradient(
      to bottom,
      var(--signature-color),
      color-mix(in srgb, var(--signature-color), transparent 60%) 30%,
      transparent 80%
    );
  }

  .editor {
    width: var(--state-fill-end);
    background: transparent;
    border: none;
    padding: var(--padding-standard);
    color: var(--signature-color);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-h3);
    font-weight: var(--font-weight-bold);
    text-align: left;
    outline: none;
    box-sizing: border-box;
    letter-spacing: var(--font-spacing-base);
  }

  .description {
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    color: var(--frisk);
    opacity: var(--opacity-muted);
    margin: 0;
    text-align: right;
    white-space: pre-wrap;
    text-wrap: balance;
    border-radius: var(--radius-standard);
  }

  .description-wrapper {
    width: var(--state-fill-end);
    display: flex;
    position: relative;
    border-radius: var(--radius-standard);
    background: color-mix(in srgb, var(--signature-color) 4%, var(--glass-sunken));
    border: var(--border-width-base) solid transparent;
    transition:
      border-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard),
      background var(--duration-fast) var(--ease-standard);
  }

  .description-wrapper::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    padding: var(--spacing-pixel);
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, transparent, var(--signature-color) 40%),
      transparent 40%
    );
    mask:
      linear-gradient(var(--pure-white) 0 0) content-box,
      linear-gradient(var(--pure-white) 0 0);
    mask-composite: exclude;
    opacity: var(--opacity-whisper);
    transition: opacity var(--duration-standard);
  }

  .description-wrapper[data-expanded="true"] {
    border-color: transparent;
    background: color-mix(in srgb, var(--signature-color) 8%, var(--glass-sunken));
  }

  .description-wrapper[data-expanded="true"]::before {
    opacity: var(--opacity-solid);
    background: linear-gradient(
      to bottom,
      var(--signature-color),
      color-mix(in srgb, var(--signature-color), transparent 60%) 30%,
      transparent 80%
    );
  }

  textarea.description.edit {
    width: var(--state-fill-end);
    min-height: var(--row-unit);
    max-height: calc(var(--row-unit) * 4);
    padding: var(--padding-standard);
    color: var(--frisk);
    font-family: var(--font-family-base);
    font-size: var(--font-size-small);
    line-height: var(--font-height-base);
    resize: none;
    text-align: left;
    background: transparent;
    border: none;
    outline: none;
    margin: 0;
    z-index: var(--z-index-surface);
    text-wrap: auto;
  }

  textarea.description.edit::placeholder {
    color: var(--frozen);
    font-style: italic;
    opacity: var(--opacity-whisper);
  }

  /* --- SCOPED SCROLL TRACK FOR TEXTAREA --- */
  .textarea-scroll-track {
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }

  .textarea-scroll-track::-webkit-scrollbar {
    width: var(--scrollbar-width);
    height: var(--scrollbar-width);
  }

  .textarea-scroll-track::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
  }

  .textarea-scroll-track::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--radius-standard);
  }

  .textarea-scroll-track::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }
</style>
