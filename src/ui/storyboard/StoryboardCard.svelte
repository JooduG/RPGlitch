<script>
  /**
   * @file StoryboardCard.svelte
   * 🃏 THE SELECTION TAROT
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */

  import Button from "@atoms/Button.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { themeStore } from "@theme/palette.svelte.js";
  import { fit_text } from "@utils/fit-text.js";

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

  // --- STATE & DERIVATIONS ---

  let is_empty = $derived(!entity);
  let signature_color = $derived(themeStore.get_signature_color(entity));

  let a11y_label = $derived(is_empty ? `Select ${role_label}` : `Change ${role_label}`);
</script>

<div
  class="root"
  class:is-fractal={type === "fractal"}
  class:is-empty={is_empty}
  class:interactable={!is_empty}
  use:tooltip={{ text: a11y_label }}
  style:--signature-color={signature_color}
  aria-label={a11y_label}
  data-testid="storyboard-card"
>
  <!-- [BODY] MAIN INTERACTION LAYER -->
  <Button variant="invisible" cover={true} onclick={on_select} class="body" aria-label={a11y_label}>
    {#if is_empty}
      <div class="status">
        {#if type === "fractal"}
          <svg viewBox="0 0 24 24" class="icon icon-outline">
            <path d="M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" class="icon icon-outline">
            <path
              d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
            />
          </svg>
        {/if}
        <span class="primary">{role_label}</span>
      </div>
    {:else}
      <ProfilePicture {entity} />
    {/if}
  </Button>

  {#if !is_empty}
    <!-- [HEADER] INFO OVERLAY -->
    <header class="header">
      <h3 class="primary" use:fit_text={{ minSize: "var(--font-size-base)" }}>{entity.name}</h3>
      <p class="secondary">{entity.description || "No description provided."}</p>
    </header>

    <!-- [ACTIONS] CONTEXTUAL TOOLBAR -->
    <nav class="actions">
      <Button
        class="item"
        actions={[[tooltip, { text: `View ${entity.name} Profile` }]]}
        variant="invisible"
        aria-label="View {entity.name} Profile"
        onclick={on_view_profile}
        tabindex="-1"
      >
        <svg viewBox="0 0 24 24" class="icon icon-outline">
          <path
            d="M20,2H4C2.89,2 2,2.89 2,4V20C2,21.11 2.89,22 4,22H20C21.11,22 22,21.11 22,20V4C22,2.89 21.11,2 20,2M20,20H4V4H20V20M12,10H17V12H12V10M12,14H17V16H12V14M7,10H10V13H7V10M7,14H10V15H7V14"
          />
        </svg>
      </Button>
    </nav>
  {/if}
</div>

<style>
  /* --- ROOT --- */
  .root {
    position: relative;
    width: var(--storyboard-character-card-width);
    height: var(--storyboard-character-card-height);
    overflow: hidden;
    border-radius: var(--radius-standard);
    background: var(--glass-elevated);
    backdrop-filter: var(--blur-mist);
    z-index: var(--z-index-surface);
    transition:
      transform var(--duration-fast) var(--ease-standard),
      z-index var(--duration-none);
  }

  .root:hover {
    z-index: var(--z-index-overlay);
  }

  .root.is-fractal {
    width: var(--storyboard-fractal-card-width);
    height: var(--storyboard-fractal-card-height);
  }

  /* Structural Highlight (The Edge) */
  .root::after {
    content: "";
    position: absolute;
    inset: calc(var(--spacing-unit) * 0);
    pointer-events: none;
    border-radius: inherit;
    border: var(--border-width-base) solid transparent;
    box-shadow: inset calc(var(--spacing-unit) * 0) calc(var(--spacing-unit) * 0)
      calc(var(--spacing-unit) * 0) var(--spacing-pixel) transparent;
    transition:
      box-shadow var(--duration-standard) var(--ease-standard),
      border-color var(--duration-standard) var(--ease-standard);
    z-index: var(--z-index-surface);
  }

  .root:hover::after {
    border-color: var(--signature-color, var(--electric-cyan));
    box-shadow: inset calc(var(--spacing-unit) * 0) calc(var(--spacing-unit) * 0)
      calc(var(--spacing-unit) * 0) var(--spacing-pixel)
      var(--signature-color, var(--electric-cyan));
  }

  /* --- BODY --- */
  .root :global(.body) {
    z-index: var(--z-index-surface);
    background-color: transparent !important;
    background-image: linear-gradient(
      to bottom,
      rgb(from var(--pure-white) r g b / var(--opacity-ghost)),
      transparent
    );
    transition:
      filter var(--duration-standard) var(--ease-standard),
      background-color var(--duration-standard) var(--ease-standard),
      box-shadow var(--duration-standard) var(--ease-standard);
  }

  .root:hover :global(.body) {
    /* prettier-ignore */
    background-color: rgb(from var(--signature-color, var(--electric-cyan)) r g b / var(--opacity-ghost)) !important;
    filter: var(--brightness-glow) var(--contrast-tension);
    /* stylelint-disable scale-unlimited/declaration-strict-value */

    /* prettier-ignore */
    box-shadow:
      inset calc(var(--spacing-unit) * 0) calc(var(--spacing-unit) * 0) calc(var(--spacing-unit) * 12) rgb(from var(--signature-color, var(--electric-cyan)) r g b / var(--opacity-whisper)),
      var(--shadow-standard);
    /* stylelint-enable scale-unlimited/declaration-strict-value */
  }

  /* --- STATUS (Empty State) --- */
  .status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--gap-standard);
    color: var(--pure-white);
    opacity: var(--opacity-whisper);
    transition: opacity var(--duration-standard) var(--ease-standard);
  }

  .root:hover .status {
    opacity: var(--opacity-solid);
  }

  .status .icon {
    width: calc(var(--spacing-unit) * 20);
    height: calc(var(--spacing-unit) * 20);
  }

  .icon-outline {
    fill: none;
    stroke: currentcolor;
    stroke-width: 1.5;
  }

  .status .primary {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-h6);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
  }

  /* --- HEADER (Info Overlay) --- */
  .header {
    position: absolute;
    bottom: calc(var(--spacing-unit) * 0);
    left: calc(var(--spacing-unit) * 0);
    right: calc(var(--spacing-unit) * 0);
    height: 60%;

    /* prettier-ignore */
    background: linear-gradient(
      to top,
      var(--chalk) 0%,
      rgb(from var(--chalk) r g b / var(--opacity-solid)) 30%,
      rgb(from var(--chalk) r g b / var(--opacity-muted)) 60%,
      rgb(from var(--chalk) r g b / var(--opacity-ghost)) 80%,
      transparent 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    text-align: center;
    padding: var(--padding-standard) var(--padding-standard);
    z-index: var(--z-index-surface);
    pointer-events: none;
    border-radius: calc(var(--spacing-unit) * 0) calc(var(--spacing-unit) * 0)
      var(--radius-standard) var(--radius-standard);
  }

  .header .primary {
    margin: 0;
    font-family: var(--font-family-heading);
    color: var(--signature-color, var(--electric-cyan));
    text-shadow: var(--shadow-font);
    font-size: var(--font-size-h4);
    line-height: var(--font-height-base);
    letter-spacing: var(--font-spacing-tight);
    width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .header .secondary {
    margin: var(--margin-tight) 0 0;
    font-family: var(--font-family-base);
    font-size: var(--font-size-small);
    color: var(--pure-white);
    line-height: var(--font-height-base);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    opacity: var(--opacity-whisper);
  }

  /* --- ACTIONS (Toolbar) --- */
  .actions {
    position: absolute;
    top: calc(var(--spacing-unit) * 2);
    right: calc(var(--spacing-unit) * 2);
    z-index: var(--z-index-modal); /* Extremely high to ensure clickability over dynamic titles */
    pointer-events: auto;
    visibility: hidden;
    opacity: var(--opacity-none);
    transition:
      transform var(--duration-standard) var(--ease-standard),
      opacity var(--duration-standard) var(--ease-standard),
      visibility var(--duration-standard) var(--ease-standard);
    transform: translateY(calc(var(--spacing-unit) * -1));
  }

  .root:hover .actions {
    visibility: visible;
    opacity: var(--opacity-solid);
    transform: translateY(0);
  }

  .actions :global(.item) {
    width: var(--icon-large);
    height: var(--icon-large);
    border-radius: var(--radius-full);
    background: var(--pure-white);
    backdrop-filter: var(--blur-mist);
    color: var(--chalk);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background var(--duration-standard) var(--ease-standard),
      transform var(--duration-standard) var(--ease-elastic),
      box-shadow var(--duration-standard) var(--ease-standard);
  }

  .actions :global(.item:hover) {
    background: rgb(from var(--pure-white) r g b / var(--opacity-whisper));
    transform: var(--scale-lift);
    box-shadow: var(--shadow-standard);
  }

  .actions .icon {
    width: var(--icon-large);
    height: var(--icon-large);
  }
</style>
