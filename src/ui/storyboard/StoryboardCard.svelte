<script>
  /**
   * @file StoryboardCard.svelte
   * 🃏 THE SELECTION TAROT
   * Refactored: Universal SOTA Refactor & DOM Harmonization
   * Harmonized: Ultra-Lean Nomenclature (wrapper, body, placeholder, scrim, content, actions, border)
   */
  let {
    entity,
    role_label = "",
    type = "user", // "ai" | "fractal" | "user"
    on_select = () => {},
    on_view_profile = () => {},
  } = $props();

  import { themeStore } from "@theme/palette.svelte.js";
  import Button from "@atoms/Button.svelte";
  import ProfilePicture from "@atoms/ProfilePicture.svelte";
  import { fit_text } from "@utils/fit-text.js";
  import { tooltip } from "@atoms/Tooltip.svelte";

  // --- REACTIVE STATE ---
  let is_empty = $derived(!entity);
  let signature_color = $derived(
    is_empty ? "var(--color-frisk)" : themeStore.get_signature_color(entity),
  );
  let signature_rgb = $derived(themeStore.hex_to_rgb(signature_color));
</script>

<div
  class="wrapper {type}-card glass-l"
  use:tooltip={{ text: is_empty ? `Select ${role_label}` : `Change ${role_label}` }}
  style="--signature-color: {signature_color}; --signature-rgb: {signature_rgb};"
  aria-label={is_empty ? `Select ${role_label}` : `Change ${role_label}`}
  data-testid="storyboard-card"
>
  {#if is_empty}
    <Button variant="invisible" cover={true} onclick={on_select} className="placeholder">
      {#if type === "fractal"}
        <svg viewBox="0 0 24 24" class="icon-l">
          <path fill="currentColor" d="M19,12L12,22L5,12L12,2M12,2L19,12H5L12,2Z" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" class="icon-l">
          <path
            fill="currentColor"
            d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
          />
        </svg>
      {/if}
      <span class="label">{role_label}</span>
    </Button>
  {:else}
    <Button variant="invisible" cover={true} onclick={on_select} className="body">
      <ProfilePicture {entity} />
    </Button>

    <div class="scrim">
      <div class="content">
        <h2 use:fit_text={{ minSize: 26 }}>
          {entity.name}
        </h2>
        <div class="details">
          <p>{entity.description || "No description provided."}</p>
        </div>
      </div>
    </div>

    <div class="actions">
      <Button
        className="profile-link"
        actions={[tooltip]}
        tooltip="View {entity.name} Profile"
        variant="invisible"
        aria-label="View {entity.name} Profile"
        onclick={on_view_profile}
        tabindex="-1"
      >
        <svg viewBox="0 0 24 24" class="icon">
          <path
            fill="currentColor"
            d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
          />
        </svg>
      </Button>
    </div>
  {/if}

  <div class="border"></div>
</div>

<style>
  .wrapper {
    position: relative;
    width: var(--card-width-m);
    height: var(--card-height-m);
    overflow: hidden;
    border-radius: var(--border-radius-l);
    border: var(--border-l);
    box-shadow: var(--shadow-m);
    transition: all var(--motion-l) var(--motion-elastic);
  }

  /* Fractal Landscape Logic */
  .fractal-card {
    width: var(--card-height-m);
    height: var(--card-width-m);
  }

  .wrapper:hover {
    background: var(--glass-xxl);
    backdrop-filter: var(--blur-xl);
    --card-hover-shadow: 0 var(--spacing-s) var(--spacing-l) calc(var(--spacing-s) * -1)
      rgb(from var(--signature-color) r g b / 40%);

    box-shadow: var(--card-hover-shadow);
  }

  .wrapper:active {
    background: var(--glass-s);
    backdrop-filter: var(--blur-m);
    transition-duration: var(--motion-s);
  }

  .border {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: var(--border-radius-l);
    transition: box-shadow var(--motion-l) ease;
    z-index: var(--z-index-xl);
  }

  .wrapper:hover .border {
    box-shadow: inset 0 0 0 var(--spacing-border) var(--signature-color);
  }

  .wrapper:focus-visible {
    outline: none;
  }

  .wrapper:focus-visible .border {
    --border-focus-shadow: inset 0 0 0 2.5px var(--signature-color);

    box-shadow: var(--border-focus-shadow);
  }

  /* --- PLACEHOLDER --- */
  .wrapper :global(.button.placeholder) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-m);
    padding: var(--spacing-xl);
    text-align: center;
    color: var(--font-color-s);
  }

  .placeholder .icon {
    width: 64px;
    height: 64px;
    opacity: var(--opacity-m);
  }

  .placeholder .label {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
    opacity: var(--opacity-m);
  }

  /* --- BODY --- */
  .wrapper :global(.button.body) {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .scrim {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 45%;
    background: linear-gradient(
      to top,
      var(--color-chalk) 0%,
      rgb(from var(--color-chalk) r g b / 50%) 40%,
      transparent 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: var(--spacing-xxl) var(--spacing-m) var(--spacing-m);
    z-index: var(--z-index-l);
    pointer-events: none;
  }

  .content h2 {
    margin: 0;
    font-family: var(--font-family-heading);
    color: rgb(var(--signature-rgb));
    text-shadow: var(--shadow-font);
    font-size: var(--font-size-xxxl);
    line-height: 1;
    letter-spacing: -0.01em;
    max-width: 75%;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .details {
    position: relative;
    margin-top: var(--spacing-xs);
  }

  .details p {
    margin: 0;
    font-size: var(--font-size-s);
    color: var(--font-color-m);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* --- ACTIONS --- */
  .actions {
    position: absolute;
    top: var(--spacing-m);
    right: var(--spacing-m);
    z-index: var(--z-index-max);
    width: 36px;
    height: 36px;
    visibility: hidden;
    opacity: 0;
    transition:
      opacity var(--motion-s) ease,
      visibility var(--motion-s) ease;
  }

  .wrapper:hover .actions {
    visibility: visible;
    opacity: 1;
  }

  .actions :global(.button.profile-link) {
    width: 100%;
    height: 100%;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--glass-xxl);
    border: var(--border-l);
    backdrop-filter: var(--blur-xl);
    color: var(--color-white);
    transition: all var(--motion-s) ease;
  }

  .actions:hover :global(.button.profile-link) {
    background: color-mix(in srgb, var(--glass-xxl), var(--color-white) 15%);
    border-color: var(--color-white);
    transform: scale(1.1);
  }

  .profile-link .icon {
    width: 20px;
    height: 20px;
  }
</style>
