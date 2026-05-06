<script>
  /**
   * @file src/ui/profile/AudioWing.svelte
   * 🔊 THE SONIC IDENTITY
   * Manages character voice selection and parameters.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import { Audio } from "@media/audio-engine.svelte.js";
  import Button from "@atoms/Button.svelte";
  import Slider from "@atoms/Slider.svelte";
  import Wing from "@atoms/Wing.svelte";
  import { portal } from "@utils/portal.js";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { DROPDOWN_MAX_HEIGHT } from "@core/constants.js";

  /** @type {{ char: any, is_editing: boolean }} */
  let { char = $bindable(), is_editing } = $props();

  // --- INITIALIZATION ---

  /** Ensure the voice state object is initialized correctly. */
  $effect(() => {
    if (!char.voice) {
      char.voice = { uri: "", rate: 1.0, pitch: 1.0 };
    } else {
      char.voice.uri ??= "";
      char.voice.rate ??= 1.0;
      char.voice.pitch ??= 1.0;
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

  const selected_voice = $derived(Audio.voice.voices.find((v) => v.uri === char.voice.uri));
  const is_natural = $derived(selected_voice?.name.includes("Natural"));

  /**
   * Cleans voice names by stripping vendor and redundant locale info.
   * @param {string} name
   * @param {string} region
   */
  const format_name = (name, region = "") => {
    let clean = name
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
   * Formats the region string into displayable parts.
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
    if (show_dropdown && anchor_el) {
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
    }
  });
</script>

<Wing class="audio-wing">
  <div class="header" bind:this={anchor_el}>
    <Button
      className="voice-select {show_dropdown ? 'active' : ''}"
      disabled={!is_editing}
      onclick={() => (show_dropdown = !show_dropdown)}
      aria-label="Select Voice"
      aria-haspopup="listbox"
      aria-expanded={show_dropdown}
      variant="invisible"
    >
      <span class="truncate">
        {format_name(selected_voice?.name || "Select Voice")}
      </span>
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
          aria-selected={char.voice.uri === voice.uri}
          className="item {char.voice.uri === voice.uri ? 'active' : ''}"
          onclick={() => {
            if (is_editing) char.voice.uri = voice.uri;
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
      className="preview-btn"
      actions={[tooltip]}
      tooltip="Preview Voice"
      aria-label="Preview Voice"
      square
      disabled={!selected_voice}
      onclick={() => Audio.voice.preview(char.voice.uri, char.voice.rate, char.voice.pitch)}
      variant="invisible"
    >
      <svg viewBox="0 0 24 24" class="icon-xs">
        <path
          fill="currentColor"
          d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
        />
      </svg>
    </Button>
  </div>

  <div class="body">
    <Slider
      min={0.1}
      max={2.0}
      step={0.1}
      bind:value={char.voice.rate}
      disabled={!is_editing || !selected_voice}
      label="Rate"
      neutral={1.0}
    />
    <Slider
      min={0.1}
      max={2.0}
      step={0.1}
      bind:value={char.voice.pitch}
      disabled={!is_editing || !selected_voice || is_natural}
      label="Pitch"
      neutral={1.0}
    />
  </div>
</Wing>

<style>
  .header {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--spacing-xs);
    width: 100%;
    align-items: center;
  }

  .body {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-m);
    width: 100%;
  }

  /* --- Components --- */

  :global(.voice-select.button),
  :global(.preview-btn.button) {
    height: var(--icon-m);
    min-height: 0;
    background: var(--glass-xs);
    border: none;
    border-radius: var(--border-radius-m);
    transition: all var(--motion-l) var(--motion-elastic);
  }

  :global(.voice-select.button:hover:not(:disabled)),
  :global(.preview-btn.button:hover:not(:disabled)),
  :global(.voice-select.button.active) {
    background: var(--glass-s);
    filter: brightness(1.2);
  }

  :global(.voice-select.button) {
    width: 100%;
    padding: 0 var(--spacing-m);
  }

  :global(.preview-btn.button) {
    width: var(--icon-m);
    padding: 0;
  }

  /* --- Menu --- */

  .menu {
    visibility: hidden;
    pointer-events: none;
    opacity: 0;
    transform: translateY(-var(--spacing-xs));
    position: fixed;
    overflow-y: auto;
    z-index: var(--z-index-max);
    background: var(--glass-xl);
    backdrop-filter: var(--blur-m);
    border-radius: var(--border-radius-m);
    transition:
      opacity var(--motion-l) ease,
      transform var(--motion-l) var(--motion-elastic),
      visibility var(--motion-l);
    display: flex;
    flex-direction: column;
  }

  .menu.is-visible {
    visibility: visible;
    pointer-events: auto;
    opacity: 1;
    transform: translateY(var(--spacing-xs));
  }

  .menu.is-dropup {
    transform: translateY(var(--spacing-xs));
  }

  .menu.is-visible.is-dropup {
    transform: translateY(calc(-1 * var(--spacing-xs)));
  }

  :global(.item.button) {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    background: transparent;
    border: none;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-s);
    border-radius: 0;
    min-height: 0;
  }

  :global(.item.button:hover),
  :global(.item.button.active) {
    background: var(--glass-xs);
  }

  /* --- Labels & Tags --- */

  .truncate,
  :global(.item.button .label) {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    flex: 1;
  }

  :global(.item.button .tags) {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-end;
    gap: var(--spacing-xxs);
    font-size: var(--font-size-xxs);
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
    color: var(--font-color-s);
    letter-spacing: 0.1em;
    line-height: 1;
    text-align: right;
    flex-shrink: 0;
  }

  :global(.item.button .tags span) {
    white-space: nowrap;
  }
</style>
