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

<section class="root glass-elevated">
  <!-- 🗣️ VOICE SELECTOR -->
  <div class="controls" bind:this={anchor_el}>
    <Button
      class="trigger {show_dropdown ? 'active' : ''}"
      disabled={!profileState.is_editing}
      onclick={() => (show_dropdown = !show_dropdown)}
      aria-label="Select Voice"
      aria-haspopup="listbox"
      aria-expanded={show_dropdown}
      variant="secondary"
      full_width
    >
      <span class="truncate">{format_name(selected_voice?.name || "Select Voice")}</span>
    </Button>

    <div
      use:portal
      role="listbox"
      class="menu glass-elevated"
      class:is-visible={show_dropdown}
      class:is-dropup={coords.is_dropup}
      style={dropdown_style}
    >
      {#each Audio.voice.voices as voice (voice.uri)}
        <Button
          role="option"
          aria-selected={profileState.char?.voice?.uri === voice.uri}
          class="option {profileState.char?.voice?.uri === voice.uri ? 'active' : ''}"
          onclick={() => {
            if (profileState.is_editing) profileState.char.voice.uri = voice.uri;
            show_dropdown = false;
          }}
          variant="invisible"
          full_width
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
      class="preview"
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
      variant="secondary"
    >
      <svg viewBox="0 0 24 24" class="icon-small">
        <path
          fill="currentColor"
          d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
        />
      </svg>
    </Button>
  </div>

  <!-- 🎚️ PARAMETERS -->
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
</section>

<style>
  /* --- ROOT SHELL --- */

  .root {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--gap-standard);
    padding: var(--padding-standard);
    border-radius: var(--radius-standard);
  }

  /* --- CONTROLS ROW --- */

  .controls {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--gap-tight);
    width: 100%;
    align-items: stretch;
  }

  /* --- BODY ROW --- */

  .body {
    display: flex;
    flex-direction: row;
    gap: var(--gap-standard);
    width: 100%;
  }

  /* --- DROPDOWN MENU --- */

  .menu {
    visibility: hidden;
    pointer-events: none;
    opacity: 0;
    transform: translateY(calc(-1 * var(--margin-tight)));
    position: fixed;
    overflow-y: auto;
    z-index: var(--z-index-modal);
    border-radius: var(--radius-standard);
    border: var(--border-width-base) solid var(--border-whisper);
    transition:
      opacity var(--duration-standard) var(--ease-standard),
      transform var(--duration-standard) var(--ease-elastic),
      visibility var(--duration-standard);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-standard);
  }

  .menu.is-visible {
    visibility: visible;
    pointer-events: auto;
    opacity: 1;
    transform: translateY(var(--margin-tight));
  }

  .menu.is-dropup {
    transform: translateY(var(--margin-tight));
  }

  .menu.is-visible.is-dropup {
    transform: translateY(calc(-1 * var(--margin-tight)));
  }

  /* --- TRIGGER --- */

  :global(.root.trigger.active) {
    border-color: var(--pure-white);
    box-shadow: var(--signature-glow);
    filter: var(--brightness-glow);
  }

  /* --- MENU ITEMS --- */

  :global(.root.option) {
    border-radius: 0;
    text-align: left;
    justify-content: space-between;
    color: var(--frisk);
    border-bottom: var(--border-width-base) solid var(--border-whisper);
    width: 100%;
    flex: 1;
    padding: var(--padding-tight) var(--padding-standard);
  }

  :global(.root.option:last-child) {
    border-bottom: none;
  }

  :global(.root.option:hover:not(:disabled)) {
    background: var(--glass-sunken) !important;
    color: var(--pure-white) !important;
    filter: var(--brightness-glow);
  }

  :global(.root.option.active) {
    background: var(--glass-base) !important;
    color: var(--pure-white) !important;
    filter: var(--brightness-glow);
  }

  /* --- ELEMENTS --- */

  .truncate,
  :global(.root.option .label) {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    flex: 1;
  }

  :global(.root.option .tags) {
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
</style>
