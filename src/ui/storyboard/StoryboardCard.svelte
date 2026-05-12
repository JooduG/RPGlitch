<script>
  /**
   * @file StoryboardCard.svelte
   * 🃏 THE SELECTION TAROT
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */

  /**
   * @typedef {Object} Props
   * @property {any} [entity] - The entity to display
   * @property {string} [role_label] - Label for the role (e.g., "Narrator")
   * @property {"ai" | "fractal" | "user"} [type] - The type of card
   * @property {import('svelte/elements').MouseEventHandler<HTMLButtonElement>} [on_select] - Click handler for card selection
   * @property {import('svelte/elements').MouseEventHandler<HTMLButtonElement>} [on_view_profile] - Click handler for profile view
   */

  /** @type {Props} */
  let {
    entity,
    role_label = "",
    type = "user",
    on_select = () => {},
    on_view_profile = () => {},
  } = $props();

  import Button from "@atoms/Button.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { themeStore } from "@theme/palette.svelte.js";
  import { fit_text } from "@utils/fit-text.js";

  // --- STATE & DERIVATIONS ---

  let is_empty = $derived(!entity);
  let signature_color = $derived(
    is_empty ? "var(--color-frisk)" : themeStore.get_signature_color(entity),
  );

  let a11y_label = $derived(is_empty ? `Select ${role_label}` : `Change ${role_label}`);
</script>

<div
  class="root {type}-card glass-elevated interactable"
  use:tooltip={{ text: a11y_label }}
  style="--signature-color: {signature_color};"
  aria-label={a11y_label}
  data-testid="storyboard-card"
>
  {#if is_empty}
    <!-- Empty State / Placeholder -->
    <Button variant="invisible" cover={true} onclick={on_select} className="placeholder">
      <div class="content">
        {#if type === "fractal"}
          <svg viewBox="0 0 24 24" class="icon-large icon-outline">
            <path d="M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" class="icon-large icon-outline">
            <path
              d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
            />
          </svg>
        {/if}
        <span class="label">{role_label}</span>
      </div>
    </Button>
  {:else}
    <!-- Occupied State -->
    <Button variant="invisible" cover={true} onclick={on_select} className="body">
      <ProfilePicture {entity} />
    </Button>

    <div class="info">
      <h3 use:fit_text={{ minSize: "var(--font-size-base)" }}>{entity.name}</h3>
      <p>{entity.description || "No description provided."}</p>
    </div>

    <div class="toolbar">
      <Button
        className="action-btn"
        actions={[tooltip]}
        tooltip="View {entity.name} Profile"
        variant="invisible"
        aria-label="View {entity.name} Profile"
        onclick={on_view_profile}
        tabindex="-1"
      >
        <svg viewBox="0 0 24 24" class="icon-small icon-solid">
          <path
            d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
          />
        </svg>
      </Button>
    </div>
  {/if}
</div>

<style>
  /* --- CARD ROOT --- */
  .root {
    position: relative;
    width: var(--storyboard-character-card-width);
    height: var(--storyboard-character-card-height);
    overflow: hidden;
    border-radius: var(--radius-standard);
    transition: transform var(--duration-fast) var(--ease-standard);
  }

  .root:hover {
    transform: var(--hover-lift);
  }

  /* Landscape Orientation for Fractals */
  .fractal-card {
    width: var(--storyboard-fractal-card-width);
    height: var(--storyboard-fractal-card-height);
  }

  /* Structural Border (Pseudo-element) */
  .root::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: var(--radius-standard);
    box-shadow: inset 0 0 0 var(--spacing-pixel) transparent;
    border: var(--border-muted);
    transition:
      box-shadow var(--duration-standard) var(--ease-standard),
      border-color var(--duration-standard) var(--ease-standard);
    z-index: var(--surface-z-index);
  }

  .root:hover::after {
    border-color: var(--signature-color);
    box-shadow: inset 0 0 0 var(--spacing-pixel) var(--signature-color);
  }

  .root:focus-visible {
    outline: none;
  }

  .root:focus-visible::after {
    box-shadow: inset 0 0 0 var(--spacing-pixel) var(--signature-color);
  }

  /* --- PLACEHOLDER --- */
  .root :global(.button.placeholder) {
    width: var(--opacity-solid); /* Full width */
    height: var(--opacity-solid); /* Full height */
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: var(--radius-standard);
    flex: 1; /* Ensure button expands to fill root */
  }

  /* Wait, using --opacity-solid (1) for width/height is hacky. I'll use 100% since it's standard for layout. */
  .root :global(.button.placeholder),
  .root :global(.button.body) {
    width: 100%;
    height: 100%;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-1);
    color: var(--font-color-muted);
    opacity: var(--opacity-muted);
    transition: opacity var(--duration-standard) var(--ease-standard);
  }

  .root:hover .content {
    opacity: var(--opacity-solid);
  }

  .content .label {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-tiny);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
  }

  /* --- INFO OVERLAY --- */
  .info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(var(--opacity-half) * 100%); /* 50% */
    background: linear-gradient(
      to top,
      var(--background-base) 0%,
      rgb(from var(--background-base) r g b / var(--opacity-heavy)) 50%,
      transparent 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: var(--spacing-8) var(--spacing-2) var(--spacing-2);
    z-index: var(--surface-z-index);
    pointer-events: none;
    border-radius: 0 0 var(--radius-standard) var(--radius-standard);
  }

  .info h3 {
    margin: 0;
    font-family: var(--font-family-heading);
    color: var(--signature-color);
    text-shadow: var(--shadow-font);
    font-size: var(--font-size-h3);
    line-height: var(--font-height-short);
    letter-spacing: var(--font-spacing-tight);
    max-width: 100%; /* Using semantic metric for width constraint */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .info p {
    margin: var(--spacing-1) 0 0;
    font-size: var(--font-size-small);
    color: var(--font-color-base);
    line-height: var(--font-height-short);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    opacity: var(--opacity-heavy);
  }

  /* --- TOOLBAR ACTIONS --- */
  .toolbar {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);
    z-index: var(--overlay-z-index);
    visibility: hidden;
    opacity: 0;
    transition:
      transform var(--duration-standard) var(--ease-standard),
      opacity var(--duration-standard) var(--ease-standard),
      visibility var(--duration-standard) var(--ease-standard);
    transform: translateY(calc(var(--spacing-1) * -1));
  }

  .root:hover .toolbar {
    visibility: visible;
    opacity: var(--opacity-solid);
    transform: translateY(0);
  }

  .toolbar :global(.button.action-btn) {
    width: var(--icon-large);
    height: var(--icon-large);
    border-radius: var(--radius-full);
    background: var(--color-white);
    backdrop-filter: var(--blur-mist);
    color: var(--background-base);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background var(--duration-standard) var(--ease-standard),
      transform var(--duration-standard) var(--ease-elastic),
      box-shadow var(--duration-standard) var(--ease-standard);
  }

  .toolbar :global(.button.action-btn:hover) {
    background: rgb(from var(--color-white) r g b / var(--opacity-heavy));
    transform: var(--hover-lift);
    box-shadow: var(--shadow-heavy);
  }
</style>
