<script>
  /**
   * @file src/ui/profile/AudioWing.svelte
   * 🔊 THE SONIC IDENTITY
   * Manages character voice selection and parameters.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import Button from "@atoms/Button.svelte";
  import Slider from "@atoms/Slider.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { DROPDOWN_MAX_HEIGHT } from "@core/constants.js";
  import { Audio } from "@media/audio-engine.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import { portal } from "@utils/portal.js";

  /**
   * @typedef {Object} Props
   * @property {import('./profile.svelte.js').ProfileState} profileState - The profile state controller
   */

  /** @type {Props} */
  let { profileState } = $props();

  // --- INITIALIZATION ---

  $effect(() => {
    /** Ensure the voice state object is initialized correctly. */
    if (!profileState.char) return;
    if (!profileState.char.voice) {
      profileState.char.voice = { uri: "", rate: 1.0, pitch: 1.0 };
    } else {
      profileState.char.voice.uri ??= "";
      profileState.char.voice.rate ??= 1.0;
      profileState.char.voice.pitch ??= 1.0;
    }
  });

  // --- STATE ---

  let show_dropdown = $state(false);
  let anchor_el = $state();

  /** @type {{ top: number | null, bottom: number | null, left: number, width: number, is_dropup: boolean, max_h: number }} */
  let coords = $state({
    top: null,
    bottom: null,
    left: 0,
    width: 0,
    is_dropup: false,
    max_h: DROPDOWN_MAX_HEIGHT,
  });

  // --- DERIVED ---

  const signature_color = $derived(
    themeStore.get_signature_color(profileState.char, "var(--gunmetal)"),
  );

  const selected_voice = $derived(
    Audio.voice.voices.find((v) => v.uri === profileState.char?.voice?.uri),
  );
  const is_natural = $derived(selected_voice?.name.includes("Natural"));

  /**
   * Cleans voice names by stripping vendor and redundant locale info.
   * @param {string} name
   * @param {string} [region]
   */
  const format_name = (name, region = "") => {
    const clean = name
      .replace(/Microsoft\s+/gi, "")
      .replace(/\s*Online\s*\(Natural\)/gi, "")
      .replace(/\s+-\s+English\s+\(.*\)/gi, "")
      .replace(new RegExp(`\\b${region}\\b`, "gi"), "")
      .replace(/\b(English|Swedish|German|French|Spanish|Italian|UK|US)\b/gi, "")
      .replace(/\s*-\s*$/, "")
      .replace(/\s+/g, " ")
      .trim();
    return clean || name;
  };

  /**
   * Formats the region string into a single-element array for iteration.
   * @param {string} region
   */
  const format_region = (region) => (region ? [region] : []);

  const dropdown_style = $derived(
    `top: ${coords.top !== null ? coords.top + "px" : "auto"}; ` +
      `bottom: ${coords.bottom !== null ? coords.bottom + "px" : "auto"}; ` +
      `left: ${coords.left}px; ` +
      `width: ${coords.width}px; ` +
      `max-height: ${coords.max_h}px;`,
  );

  // --- INTERACTION ---

  $effect(() => {
    if (!show_dropdown || !anchor_el) return;

    const update = () => {
      const rect = anchor_el.getBoundingClientRect();
      const vh = window.innerHeight;
      const pad = 16;
      const below = vh - rect.bottom - pad;
      const above = rect.top - pad;
      const is_dropup = below < DROPDOWN_MAX_HEIGHT && above > below;
      const max_h = is_dropup
        ? Math.min(above, DROPDOWN_MAX_HEIGHT)
        : Math.min(below, DROPDOWN_MAX_HEIGHT);

      coords = {
        top: is_dropup ? null : rect.bottom,
        bottom: is_dropup ? vh - rect.top : null,
        left: rect.left,
        width: rect.width,
        is_dropup,
        max_h,
      };
    };

    const handle_outside = (/** @type {MouseEvent} */ e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      if (!anchor_el.contains(target) && !target.closest(".menu")) show_dropdown = false;
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    window.addEventListener("mousedown", handle_outside, true);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.removeEventListener("mousedown", handle_outside, true);
    };
  });
</script>

<section class="wing glass-elevated" style="--signature-color: {signature_color};">
  <!-- 🏷️ HEADER CHASSIS -->
  <header class="wing-header">
    <h4 class="wing-title text-shadow-bloom">Sonic Resonance</h4>
    <p class="wing-subtitle">Acoustic Signature & Pacing</p>
  </header>

  <!-- 🗣️ VOICE SELECTION SECTION -->
  <div class="wing-section">
    <span class="section-label">Voice Selection</span>
    <div class="header" bind:this={anchor_el}>
      <Button
        className="select {show_dropdown ? 'active' : ''}"
        disabled={!profileState.is_editing}
        onclick={() => (show_dropdown = !show_dropdown)}
        aria-label="Select Voice"
        aria-haspopup="listbox"
        aria-expanded={show_dropdown}
        variant="invisible"
      >
        <span class="truncate">{format_name(selected_voice?.name || "Select Voice")}</span>
      </Button>

      <div
        use:portal
        role="listbox"
        class="menu"
        class:is-visible={show_dropdown}
        class:is-dropup={coords.is_dropup}
        style={dropdown_style}
      >
        {#each Audio.voice.voices as voice (voice.uri)}
          <Button
            role="option"
            aria-selected={profileState.char?.voice?.uri === voice.uri}
            className="option {profileState.char?.voice?.uri === voice.uri ? 'active' : ''}"
            onclick={() => {
              if (profileState.is_editing) profileState.char.voice.uri = voice.uri;
              show_dropdown = false;
            }}
            variant="invisible"
          >
            <span class="label">{format_name(voice.name, voice.region)}</span>
            <div class="tags">
              {#each format_region(voice.region) as part, j (voice.uri + j)}
                <span>{part}</span>
              {/each}
            </div>
          </Button>
        {/each}
      </div>

      <Button
        className="preview"
        actions={[tooltip]}
        tooltip="Preview Voice"
        aria-label="Preview Voice"
        square
        disabled={!selected_voice}
        onclick={() =>
          Audio.voice.preview(
            profileState.char.voice.uri,
            profileState.char.voice.rate,
            profileState.char.voice.pitch,
          )}
        variant="invisible"
      >
        <svg viewBox="0 0 24 24" class="icon-small">
          <path
            fill="currentColor"
            d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
          />
        </svg>
      </Button>
    </div>
  </div>

  <!-- 🎚️ PARAMETERS SECTION -->
  <div class="wing-section">
    <span class="section-label">Sonic Parameters</span>
    <div class="body">
      <Slider
        min={0.1}
        max={2.0}
        step={0.1}
        bind:value={profileState.char.voice.rate}
        disabled={!profileState.is_editing || !selected_voice}
        label="Rate"
        neutral={1.0}
      />
      <Slider
        min={0.1}
        max={2.0}
        step={0.1}
        bind:value={profileState.char.voice.pitch}
        disabled={!profileState.is_editing || !selected_voice || is_natural}
        label="Pitch"
        neutral={1.0}
      />
    </div>
  </div>
</section>

<style>
  /* --- Wing Shell --- */

  .wing {
    width: 100%;
    overflow: visible;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    position: relative;
    transition: all var(--duration-standard) var(--motion-elastic);
    padding: var(--padding-standard);
    gap: var(--gap-standard);
  }

  /* --- Wing Header --- */

  .wing-header {
    display: flex;
    flex-direction: column;
    gap: var(--gap-tight);
    padding-bottom: var(--padding-tight);
    border-bottom: var(--border-width-base) solid
      rgb(from var(--pure-white) r g b / var(--opacity-whisper));
  }

  .wing-title {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-h4);
    font-weight: var(--font-weight-bold);
    color: var(--signature-color);
    margin: 0;
    letter-spacing: var(--font-spacing-tight);
  }

  .wing-subtitle {
    font-size: var(--font-size-nano);
    color: var(--pure-white);
    opacity: var(--opacity-whisper);
    margin: 0;
    font-style: italic;
  }

  /* --- Wing Section --- */

  .wing-section {
    display: flex;
    flex-direction: column;
    gap: var(--gap-standard);
    width: 100%;
  }

  .section-label {
    font-size: var(--font-size-nano);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    color: var(--signature-color);
    opacity: var(--opacity-solid);
    text-align: left;
    text-shadow: var(--shadow-font);
    margin-bottom: var(--margin-tight);
    width: 100%;
    letter-spacing: var(--font-spacing-loose);
    padding-left: var(--padding-tight);
    border-left: var(--border-width-base) solid var(--signature-color);
  }

  /* --- Layout --- */

  .header {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--gap-standard);
    width: 100%;
    align-items: center;
  }

  .body {
    display: flex;
    flex-direction: row;
    gap: var(--gap-standard);
    width: 100%;
    --slider-fill-color-start: var(--signature-color);
  }

  /* --- Controls --- */

  :global(.select),
  :global(.preview) {
    height: var(--icon-medium);
    min-height: 0;
    background: color-mix(in srgb, var(--signature-color) 8%, var(--glass-sunken));
    border: var(--spacing-pixel) solid color-mix(in srgb, var(--signature-color) 20%, transparent);
    border-radius: var(--radius-sharp);
    transition: all var(--duration-standard) var(--motion-elastic);
  }

  :global(.select:hover:not(:disabled)),
  :global(.preview:hover:not(:disabled)),
  :global(.select.active),
  :global(.preview:focus-visible) {
    background: color-mix(in srgb, var(--signature-color) 12%, var(--glass-base));
    border-color: var(--signature-color);
    box-shadow: 0 0 calc(var(--spacing-unit) * 3)
      color-mix(in srgb, var(--signature-color) 30%, transparent);
    filter: brightness(1.15);
    outline: none;
  }

  :global(.select) {
    width: 100%;
    padding: 0 var(--padding-standard);
  }

  :global(.preview) {
    width: var(--icon-medium);
    padding: 0;
  }

  /* --- Menu --- */

  .menu {
    visibility: hidden;
    pointer-events: none;
    opacity: 0;
    transform: translateY(calc(-1 * calc(var(--spacing-unit) * 2)));
    position: fixed;
    overflow-y: auto;
    z-index: var(--z-index-modal);
    background: var(--glass-peak);
    backdrop-filter: var(--blur-mist);
    border-radius: var(--radius-sharp);
    border: var(--border-width-base) solid
      rgb(from var(--pure-white) r g b / var(--opacity-whisper));
    transition:
      opacity var(--duration-standard) ease,
      transform var(--duration-standard) var(--motion-elastic),
      visibility var(--duration-standard);
    display: flex;
    flex-direction: column;
  }

  .menu.is-visible {
    visibility: visible;
    pointer-events: auto;
    opacity: 1;
    transform: translateY(calc(var(--spacing-unit) * 2));
  }

  .menu.is-dropup {
    transform: translateY(calc(var(--spacing-unit) * 2));
  }

  .menu.is-visible.is-dropup {
    transform: translateY(calc(-1 * calc(var(--spacing-unit) * 2)));
  }

  /* --- Menu Items --- */

  :global(.option) {
    width: 100%;
    padding: var(--padding-tight) var(--padding-standard);
    background: transparent;
    border: none;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-standard);
    border-radius: 0;
    min-height: 0;
    color: var(--frisk);
  }

  :global(.option:hover) {
    background: var(--glass-sunken);
  }

  :global(.option.active) {
    background: color-mix(in srgb, var(--signature-color) 12%, var(--glass-sunken));
    color: var(--pure-white);
  }

  /* --- Labels & Tags --- */

  .truncate,
  :global(.option .label) {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    flex: 1;
  }

  :global(.option .tags) {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-end;
    gap: var(--gap-tight);
    font-size: var(--font-size-tiny);
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
    color: var(--frozen);
    letter-spacing: var(--font-spacing-loose);
    line-height: 1;
    text-align: right;
    flex-shrink: 0;
  }

  :global(.option .tags span) {
    white-space: nowrap;
  }
</style>
