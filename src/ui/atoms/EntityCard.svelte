<script>
  /**
   * @file EntityCard.svelte
   * 🃏 THE UNIFIED TAROT
   * Highly flexible consolidated card component supporting drawer library and storyboard slot/panel variants.
   * Standard: Ultra-Lean DOM, Svelte 5 `$props`, and Chalk Regime Enforcement.
   */

  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import Button from "@atoms/Button.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { themeStore } from "@media";

  /**
   * @typedef {Object} Props
   * @property {"library" | "slot" | "panel"} [variant] - Visual variant layout
   * @property {any} [entity] - Entity data object
   * @property {"ai" | "user" | "fractal"} [type] - Entity archetype role
   * @property {boolean} [disabled] - Disabled interaction state (mostly library)
   * @property {string} [role_label] - Label for empty slot placeholders
   * @property {() => void} [onclick] - Select click handler
   * @property {() => void} [on_select] - Selection callback mapping
   * @property {() => void} [onViewProfile] - View profile context mapping
   * @property {() => void} [on_view_profile] - View profile callback mapping
   */

  /** @type {Props} */
  let {
    variant = "library",
    entity = undefined,
    type = "ai",
    disabled = false,
    role_label = "",
    onclick = undefined,
    on_select = undefined,
    onViewProfile = undefined,
    on_view_profile = undefined
  } = $props();

  // --- DERIVATIONS & COMPATIBILITY ---
  let is_empty = $derived(!entity);
  let signature_color = $derived(
    themeStore.get_signature_color(entity, variant === "library" ? undefined : "var(--gunmetal)")
  );
  let name = $derived(entity?.name || "Untitled");
  let a11y_label = $derived(is_empty ? `Select ${role_label}` : `Change ${role_label}`);

  // Unified callback event mappings
  let select_handler = $derived(onclick || on_select || (() => {}));
  let view_profile_handler = $derived(on_view_profile || onViewProfile || (() => {}));

  /**
   * Selection handler representing card selection gestures (click / Enter key / Space key).
   */
  function handle_select() {
    if (!disabled) {
      select_handler();
    }
  }
</script>

{#if variant === "library"}
  <div
    class="card glass-elevated interactable"
    class:fractal={type === "fractal"}
    class:disabled
    style="--signature-color: {signature_color};"
    style:view-transition-name={entity ? ("card-" + entity.type + "-" + entity.id) : undefined}
    role="button"
    tabindex="0"
    aria-label={disabled ? "Already selected" : `Select ${name}`}
    onclick={handle_select}
    oncontextmenu={(/** @type {MouseEvent} */ e) => {
      e.preventDefault();
      view_profile_handler();
    }}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handle_select();
      }
    }}
  >
    <div class="visual">
      <ProfilePicture {entity} />
    </div>

    <div class="info">
      <span class="name">{name}</span>
      <div class="bar"></div>
    </div>
  </div>
{:else}
  <div
    class="root"
    class:is-fractal={type === "fractal"}
    class:is-empty={variant === "slot"}
    class:interactable={variant === "panel"}
    use:tooltip={{ text: a11y_label }}
    style:--signature-color={signature_color}
    style:view-transition-name={entity ? ("card-" + entity.type + "-" + entity.id) : undefined}
    aria-label={a11y_label}
    data-testid="storyboard-card"
  >
    <!-- [BODY] MAIN INTERACTION LAYER -->
    <Button variant="invisible" cover={true} onclick={handle_select} class="body" aria-label={a11y_label}>
      {#if variant === "slot"}
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

    {#if variant === "panel" && entity}
      <!-- [HEADER] INFO OVERLAY -->
      <header class="header">
        <h4 class="primary">{entity.name}</h4>
        <p class="secondary">{entity.description || "No description provided."}</p>
      </header>

      <!-- [ACTIONS] CONTEXTUAL TOOLBAR -->
      <nav class="actions">
        <Button
          class="item"
          actions={[[tooltip, { text: `View ${entity.name} Profile` }]]}
          variant="secondary"
          aria-label="View {entity.name} Profile"
          onclick={view_profile_handler}
          tabindex="-1"
        >
          <svg viewBox="0 0 24 24" class="icon-medium">
            <path
              d="M20,2H4C2.89,2 2,2.89 2,4V20C2,21.11 2.89,22 4,22H20C21.11,22 22,21.11 22,20V4C22,2.89 21.11,2 20,2M20,20H4V4H20V20M12,10H17V12H12V10M12,14H17V16H12V14M7,10H10V13H7V10M7,14H10V15H7V14"
            />
          </svg>
        </Button>
      </nav>
    {/if}
  </div>
{/if}

<style>
  /* ==========================================================================
     LIBRARY VARIANT STYLES
     ========================================================================== */
  .card {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 3;
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    border: var(--border-whisper);
    border-color: rgb(from var(--signature-color) r g b / var(--opacity-whisper));
    padding: 0;
    background: transparent;
    border-radius: var(--radius-standard);
    overflow: visible; /* Allow tooltips and highlights to bleed */
    transition:
      transform var(--duration-fast) var(--ease-standard),
      filter var(--duration-fast) var(--ease-standard),
      opacity var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
    container-type: inline-size;
  }

  .card:hover:not(.disabled) {
    border-color: var(--signature-color);
    box-shadow: 0 0 calc(var(--spacing-unit) * 4)
      rgb(from var(--signature-color) r g b / var(--opacity-whisper));
  }

  .card.disabled {
    pointer-events: none;
  }

  .card.disabled .visual {
    filter: saturate(0.5) brightness(0.9);
    opacity: 0.8;
  }

  .card.disabled .name {
    opacity: 0.8;
  }

  .visual {
    flex: 1.5;
    background: var(--signature-color, var(--frisk));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    border-radius: var(--radius-standard) var(--radius-standard) 0 0;
  }

  .info {
    flex: 0.6;
    padding: var(--padding-tight);
    display: flex;
    align-items: center;
    background: var(--glass-base);
    border-radius: 0 0 var(--radius-standard) var(--radius-standard);
    position: relative;
    overflow: hidden;
    min-width: 0; /* Stabilize for fit_text */
  }

  .name {
    color: var(--signature-color, var(--frisk));
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--font-spacing-loose);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    line-height: 1;
    max-height: 100%;
    margin: 0;
    padding: 0;
    text-align: center;
    width: 100%;
    flex-shrink: 0; /* Never squash the name */
    font-size: clamp(var(--font-size-nano), 12cqi, var(--font-size-small));
  }

  .bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--gap-tight);
    background: var(--signature-color, var(--frisk));
    opacity: 0.3;
    transition: opacity var(--motion-standard);
  }

  .card:hover:not(:disabled, .disabled) .bar {
    opacity: 1;
  }

  /* ==========================================================================
     SLOT / PANEL VARIANT STYLES
     ========================================================================== */
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
    container-type: inline-size;
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
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    border: var(--border-width-base) solid transparent;
    box-shadow: inset 0 0 0 var(--spacing-pixel) transparent;
    transition:
      box-shadow var(--duration-standard) var(--ease-standard),
      border-color var(--duration-standard) var(--ease-standard);
    z-index: var(--z-index-surface);
  }

  .root:hover::after {
    border-color: var(--signature-color, var(--frisk));
    box-shadow: inset 0 0 0 var(--spacing-pixel) var(--signature-color, var(--frisk));
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
    background-color: rgb(from var(--signature-color, var(--frisk)) r g b / var(--opacity-ghost)) !important;
    filter: var(--brightness-glow);
    /* stylelint-disable scale-unlimited/declaration-strict-value */

    /* prettier-ignore */
    box-shadow:
      inset 0 0 calc(var(--spacing-unit) * 12) rgb(from var(--signature-color, var(--frisk)) r g b / var(--opacity-whisper)),
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
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    min-width: 0; /* Stabilize for fit_text */

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
    border-radius: 0 0 var(--radius-standard) var(--radius-standard);
  }

  .header .primary {
    color: var(--signature-color, var(--frisk));
    text-shadow: var(--shadow-font);
    width: 100%;
    min-width: 0;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    flex-shrink: 0; /* Name wins scaling priority */
    font-size: clamp(var(--font-size-base), 15cqi, var(--font-size-h1));
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
    min-height: 0;
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
    width: var(--icon-giant);
    height: var(--icon-giant);
    border-radius: var(--radius-full);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
