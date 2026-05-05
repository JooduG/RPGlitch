<script>
  /**
   * @file src/ui/AudioWing.svelte
   * 🔊 THE SONIC IDENTITY
   * Manages character voice selection and parameters.
   */
  import { Audio } from "@media/audio-engine.svelte.js";
  import Button from "@atoms/Button.svelte";
  import Slider from "@atoms/Slider.svelte";
  import Wing from "@atoms/Wing.svelte";
  import { portal } from "@utils/portal.js";
  import { DROPDOWN_MAX_HEIGHT } from "@core/constants.js";

  let { char = $bindable(), is_editing } = $props();

  // [CRITICAL FIX] Synchronously ensure the voice object exists
  const ensure_voice = () => {
    if (!char.voice) {
      char.voice = {
        uri: "",
        rate: 1.0,
        pitch: 1.0,
      };
    } else {
      char.voice.uri ??= "";
      char.voice.rate ??= 1.0;
      char.voice.pitch ??= 1.0;
    }
  };

  ensure_voice();
  $effect(ensure_voice);

  let show_voice_dropdown = $state(false);
  let row_el = $state();
  /** @type {{ top: number | null, bottom: number | null, left: number, width: number, is_dropup: boolean, max_h: number }} */
  let coords = $state({
    top: null,
    bottom: null,
    left: 0,
    width: 0,
    is_dropup: false,
    max_h: DROPDOWN_MAX_HEIGHT,
  });

  $effect(() => {
    if (show_voice_dropdown && row_el) {
      const update = () => {
        const rect = row_el.getBoundingClientRect();
        const vh = window.innerHeight;
        const padding = 16;
        const space_below = vh - rect.bottom - padding;
        const space_above = rect.top - padding;

        const use_dropup = space_below < DROPDOWN_MAX_HEIGHT && space_above > space_below;
        const max_h = use_dropup
          ? Math.min(space_above, DROPDOWN_MAX_HEIGHT)
          : Math.min(space_below, DROPDOWN_MAX_HEIGHT);

        coords = {
          top: use_dropup ? null : rect.bottom,
          bottom: use_dropup ? vh - rect.top : null,
          left: rect.left,
          width: rect.width,
          is_dropup: use_dropup,
          max_h,
        };
      };

      const handle_outside = (/** @type {MouseEvent} */ e) => {
        const target = e.target instanceof Element ? e.target : (e.target instanceof Node ? e.target.parentElement : null);
        if (!target) return;
        if (!row_el.contains(target) && !target.closest(".dropdown-content")) {
          show_voice_dropdown = false;
        }
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

  const selected_voice = $derived(Audio.voice.voices.find((v) => v.uri === char.voice.uri));
  const is_natural_voice = $derived(selected_voice?.name.includes("Natural"));

  /** @param {string} name */
  function format_voice_name(name) {
    return name
      .replace(/Microsoft\s+/gi, "")
      .replace(/\s+Online\s+\(Natural\)/gi, "")
      .replace(/\s+-\s+English\s+\(.*\)/gi, "")
      .trim();
  }

  const dropdown_style = $derived(
    `top: ${coords.top !== null ? coords.top + "px" : "auto"}; ` +
      `bottom: ${coords.bottom !== null ? coords.bottom + "px" : "auto"}; ` +
      `left: ${coords.left}px; ` +
      `width: ${coords.width}px; ` +
      `max-height: ${coords.max_h}px;`,
  );
</script>

<div class="audio-wing-wrapper" role="presentation">
  <Wing class="audio-wing">
    <div class="group">
      <div class="voice-control-row" bind:this={row_el}>
        <div class="dropdown">
          <Button
            className="voice-button no-tooltip"
            disabled={!is_editing}
            onclick={() => (show_voice_dropdown = !show_voice_dropdown)}
            aria-label="Select Voice"
            aria-haspopup="listbox"
            aria-expanded={show_voice_dropdown}
            aria-controls="voice-listbox"
            variant="invisible"
          >
            <span class="voice-name-truncate">
              {format_voice_name(
                Audio.voice.voices.find((v) => v.uri === char.voice.uri)?.name || "Select Voice",
              )}
            </span>
          </Button>
        </div>
        <div
          id="voice-listbox"
          use:portal
          role="listbox"
          class="dropdown-content"
          class:visible={show_voice_dropdown}
          class:dropup={coords.is_dropup}
          style={dropdown_style}
        >
          {#each Audio.voice.voices as voice (voice.uri)}
            <Button
              role="option"
              aria-selected={char.voice.uri === voice.uri}
              className="voice-option {char.voice.uri === voice.uri ? 'active' : ''}"
              onclick={() => {
                if (is_editing) char.voice.uri = voice.uri;
                show_voice_dropdown = false;
              }}
              variant="invisible"
            >
              <span class="voice-name">{format_voice_name(voice.name)}</span>
              <span class="region-pill">{voice.region}</span>
            </Button>
          {/each}
        </div>
        <Button
          className="preview-button"
          aria-label="Preview Voice"
          disabled={!selected_voice}
          onclick={() => Audio.voice.preview(char.voice.uri, char.voice.rate, char.voice.pitch)}
          variant="invisible"
        >
          🔊
        </Button>
      </div>
    </div>

    <div class="group">
      <div class="sliders">
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
          disabled={!is_editing || !selected_voice || is_natural_voice}
          label="Pitch"
          neutral={1.0}
        />
      </div>
    </div>
  </Wing>
</div>

<style>
  .audio-wing-wrapper {
    display: contents;
  }

  .voice-control-row {
    position: relative; /* Fix: Anchor for the wide dropdown */
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--spacing-xs);
    width: 100%;
    align-items: center;
  }

  .dropdown {
    min-width: 0;
  }

  .voice-control-row :global(.button.voice-button) {
    width: 100%;
    height: 2.5rem;
    padding: 0 var(--spacing-m);
    background: var(--glass-xs);
    border: none;
    border-radius: var(--border-radius-m);
    transition: all var(--motion-l) var(--motion-elastic);
  }

  .voice-control-row :global(.button.voice-button:hover:not(:disabled)) {
    background: var(--glass-s);
    filter: brightness(1.2);
  }

  .voice-control-row :global(.button.preview-button) {
    aspect-ratio: 1;
    height: 2.5rem;
    width: 2.5rem;
    padding: 0;
    background: var(--glass-xs);
    border: none;
    border-radius: var(--border-radius-m);
    transition: all var(--motion-l) var(--motion-elastic);
    min-height: 0;
  }

  .voice-control-row :global(.button.preview-button:hover:not(:disabled)) {
    background: var(--glass-s);
    filter: brightness(1.2);
  }

  .dropdown-content :global(.button.voice-option) {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    background: transparent;
    border: none;
    text-align: left;
    justify-content: flex-start;
    border-radius: 0;
    min-height: 0;
  }

  .dropdown-content :global(.button.voice-option:hover) {
    background: var(--glass-xs);
  }

  .dropdown-content :global(.button.voice-option.active) {
    background: var(--glass-xs);
  }

  .dropdown-content {
    visibility: hidden;
    pointer-events: none;
    opacity: 0;
    transform: translateY(-var(--spacing-xs));
    position: fixed;
    overflow-y: auto;
    z-index: var(--z-index-max);
    background: var(--glass-xxl); /* Clarified transparency */
    backdrop-filter: var(--blur-m);
    border: var(--border-xl);
    border-radius: var(--border-radius-m);
    box-shadow: var(--shadow-xxl);
    transition:
      opacity var(--motion-l) ease,
      transform var(--motion-l) var(--motion-elastic),
      visibility var(--motion-l);
  }

  .dropdown-content.visible {
    visibility: visible;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    opacity: 1;
    transform: translateY(var(--spacing-xs));
  }

  .dropdown-content.dropup {
    transform: translateY(var(--spacing-xs)); /* Start from below when opening upwards */
  }

  .dropdown-content.visible.dropup {
    transform: translateY(calc(-1 * var(--spacing-xs)));
  }

  :global(.button.voice-option .region-pill) {
    font-size: var(--font-size-xxs);
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
    color: var(--font-color-s);
    letter-spacing: 0.1em;
  }

  .voice-name-truncate,
  :global(.button.voice-option .voice-name) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .sliders {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-m);
    width: 100%;
  }
</style>
