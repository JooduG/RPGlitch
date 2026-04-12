<script>
  import { Audio } from "@media/audio.js";
  let { char = $bindable(), is_editing } = $props();
  let show_voice_dropdown = $state(false);
  // Voice metadata
  const selected_voice = $derived(Audio.voice.voices.find((v) => v.uri === char.voice.uri));
  const is_natural_voice = $derived(selected_voice?.name.includes("Natural"));
  // Voice name normalization
  function format_voice_name(name) {
    return name
      .replace(/Microsoft\s+/gi, "")
      .replace(/\s+Online\s+\(Natural\)/gi, "")
      .replace(/\s+-\s+English\s+\(.*\)/gi, "")
      .trim();
  }
</script>

<div
  class="voice-wing-content glass-overlay"
  onmouseleave={() => (show_voice_dropdown = false)}
  role="presentation"
>
  <div class="wing-header">
    <div class="voice-control-row">
      <div class="dropdown">
        <button
          class="voice-button seamless-field"
          type="button"
          disabled={!is_editing}
          onclick={() => (show_voice_dropdown = !show_voice_dropdown)}
          title="Select Voice"
        >
          <span class="voice-name-truncate">
            {format_voice_name(
              Audio.voice.voices.find((v) => v.uri === char.voice.uri)?.name || "Select Voice",
            )}
          </span>
        </button>
        <div class="dropdown-content glass-xxl" class:visible={show_voice_dropdown}>
          {#each Audio.voice.voices as voice (voice.uri)}
            <button
              class="voice-option"
              class:active={char.voice.uri === voice.uri}
              onclick={() => {
                char.voice.uri = voice.uri;
                show_voice_dropdown = false;
              }}
            >
              <span class="voice-name">{format_voice_name(voice.name)}</span>
              <span class="region-pill">{voice.region}</span>
            </button>
          {/each}
        </div>
      </div>
      <button
        class="preview-button seamless-field"
        type="button"
        title="Preview Voice"
        disabled={!is_editing || !char.voice.uri}
        onclick={() => Audio.voice.preview(char.voice.uri, char.voice.rate, char.voice.pitch)}
      >
        🔊
      </button>
    </div>
  </div>

  <div class="wing-body">
    <div class="sliders">
      <div class="slider-group" data-tooltip={`Rate: ${char.voice.rate.toFixed(1)}x`}>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          bind:value={char.voice.rate}
          disabled={!is_editing}
          title="Voice Rate (Speed)"
        />
      </div>
      <div
        class="slider-group"
        class:locked={is_natural_voice}
        data-tooltip={is_natural_voice
          ? "Locked (Natural Voice)"
          : `Pitch: ${char.voice.pitch.toFixed(1)}`}
      >
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          bind:value={char.voice.pitch}
          disabled={!is_editing || is_natural_voice}
          title="Voice Pitch"
        />
      </div>
    </div>
  </div>
</div>

<style>
  .voice-wing-content {
    padding: var(--spacing-m);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    height: 100%;
    overflow: visible;
  }

  .wing-header {
    flex: 0 0 auto;
    overflow: visible;
    z-index: 20; /* High enough to beat slider thumbs */
  }

  .wing-body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    padding-right: var(--spacing-xxs); /* minimal scrollbar accommodation */
  }

  /* Custom scrollbar for wing-body */
  .wing-body::-webkit-scrollbar {
    width: var(--spacing-xxs);
  }

  .wing-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .wing-body::-webkit-scrollbar-thumb {
    background: rgb(var(--color-frozen-rgb) / var(--opacity-s));
    border-radius: var(--border-radius-full);
  }

  .voice-control-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--spacing-xs);
    width: 100%;
    align-items: center;
  }

  .dropdown {
    position: relative;
    min-width: 0;
  }

  .voice-button {
    width: 100%;
    height: 2.5rem;
    padding: 0 var(--spacing-m);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--font-color-m);
    font-size: var(--font-size-s);
    cursor: pointer;
    overflow: hidden;

    /* foundation handled by .seamless-field */
  }

  .voice-button:disabled {
    opacity: var(--opacity-m);
    cursor: default;
  }

  /* hover handled by .seamless-field */

  .voice-name-truncate {
    display: block;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }

  .preview-button {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    height: 2.5rem;
    width: 2.5rem;
    color: var(--font-color-m);
    cursor: pointer;
    font-size: var(--font-size-m);

    /* foundation handled by .seamless-field */
  }

  .preview-button:disabled {
    opacity: var(--opacity-s);
    cursor: default;
  }

  /* hover handled by .seamless-field */

  .preview-button:active:not(:disabled) {
    transform: scale(0.95);
  }

  .dropdown-content {
    display: none;
    opacity: 0;
    transform: translateY(-var(--spacing-xs));
    position: absolute;
    top: 100%;
    right: 0;
    width: calc(100% + 4rem); /* Allow overflow to the left */
    max-height: 200px;
    overflow-y: auto;
    z-index: var(--z-index-max);
    transition:
      opacity var(--motion-fast) ease,
      transform var(--motion-fast) var(--motion-elastic);
  }

  .dropdown-content.visible {
    display: flex;
    flex-direction: column;
    opacity: 1;
    transform: translateY(0);
  }

  .voice-option {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    background: transparent;
    border: none;
    color: var(--font-color-m);
    text-align: left;
    font-size: var(--font-size-s);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    transition: all var(--motion-fast);
  }

  .voice-option:hover {
    background: var(--glass-xs);
  }

  .voice-option .region-pill {
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    font-weight: var(--font-weight-l);
    color: var(--font-color-s);
    letter-spacing: var(--letter-spacing-m);
    transition: color var(--motion-fast);
  }

  .voice-option .region-pill::before {
    content: "-";
    margin-right: var(--spacing-xs);
    opacity: var(--opacity-m);
  }

  .voice-option .voice-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .voice-option.active {
    color: var(--app-accent);
    background: rgb(var(--app-accent-rgb) / 5%);
  }

  .voice-option.active .region-pill {
    color: var(--app-accent);
    opacity: var(--opacity-xl);
  }

  .sliders {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xs);
    width: 100%;
  }

  .slider-group {
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
  }

  .slider-group.locked {
    opacity: var(--opacity-m);
    cursor: not-allowed;
  }

  .slider-group input[type="range"] {
    display: block;
    width: calc(100% - var(--spacing-xxs));
    margin: 0 auto;
    height: var(--spacing-s);
    background: transparent;
    appearance: none;
    outline: none;
    border: none;
    padding: 0;
    overflow: visible;
  }

  .slider-group input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 0.25rem;
    background: var(--glass-xs);
    box-shadow: inset 0 1px 2px var(--color-black);
    border-radius: var(--border-radius-full);
    border: none;
  }

  .slider-group input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: var(--spacing-s);
    height: var(--spacing-s);
    background: var(--color-frozen);
    border-radius: var(--border-radius-full);
    cursor: pointer;
    box-shadow:
      0 0 8px var(--color-frozen),
      var(--shadow-s);
    margin-top: -0.25rem; /* Centering on 0.25rem track */
    border: none;
    transition: transform var(--motion-fast) var(--motion-elastic);
  }

  .slider-group input[type="range"]:active::-webkit-slider-thumb {
    transform: scale(1.2);
  }

  .slider-group input[type="range"]:disabled {
    cursor: not-allowed;
  }

  .slider-group input[type="range"]:disabled::-webkit-slider-thumb {
    display: none;
  }
</style>
