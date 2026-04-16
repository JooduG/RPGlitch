<script>
  /**
   * @file src/ui/organisms/profile/wings/AudioWing.svelte
   * 🔊 THE SONIC IDENTITY
   * Manages character voice selection and parameters.
   */
  import { Audio } from "@media/audio.js";
  import Slider from "@ui/atoms/Slider.svelte";
  import Wing from "./Wing.svelte";

  let { char = $bindable(), is_editing } = $props();
  let show_voice_dropdown = $state(false);

  const selected_voice = $derived(Audio.voice.voices.find((v) => v.uri === char.voice.uri));
  const is_natural_voice = $derived(selected_voice?.name.includes("Natural"));

  function format_voice_name(name) {
    return name
      .replace(/Microsoft\s+/gi, "")
      .replace(/\s+Online\s+\(Natural\)/gi, "")
      .replace(/\s+-\s+English\s+\(.*\)/gi, "")
      .trim();
  }

  const ensure_voice = () => {
    if (!char.voice) {
      char.voice = { uri: "", rate: 1.0, pitch: 1.0 };
    } else {
      char.voice.rate ??= 1.0;
      char.voice.pitch ??= 1.0;
    }
  };

  ensure_voice();
  $effect(ensure_voice);
</script>

<div
  class="audio-wing-wrapper"
  onmouseleave={() => (show_voice_dropdown = false)}
  role="presentation"
>
  <Wing class="audio-wing">
    <div class="group">
      <div class="voice-control-row">
        <div class="dropdown">
          <button
            class="voice-button"
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
                  if (is_editing) char.voice.uri = voice.uri;
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
          class="preview-button"
          type="button"
          title="Preview Voice"
          disabled={!selected_voice}
          onclick={() => Audio.voice.preview(char.voice.uri, char.voice.rate, char.voice.pitch)}
        >
          🔊
        </button>
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
        />
        <Slider
          min={0.1}
          max={2.0}
          step={0.1}
          bind:value={char.voice.pitch}
          disabled={!is_editing || !selected_voice || is_natural_voice}
          label="Pitch"
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
    background: var(--glass-xs);
    border: none;
    border-radius: var(--border-radius-m);
    transition: all var(--motion-fast) var(--motion-elastic);
  }

  .voice-button:hover:not(:disabled) {
    background: var(--glass-s);
    filter: brightness(1.2);
  }

  .voice-button:focus {
    outline: none;
  }

  .voice-button:active:not(:disabled) {
    transform: scale(var(--motion-click));
  }

  .voice-button:disabled {
    opacity: var(--opacity-m);
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
    background: var(--glass-xs);
    border: none;
    border-radius: var(--border-radius-m);
    transition: all var(--motion-fast) var(--motion-elastic);
  }

  .preview-button:hover:not(:disabled) {
    background: var(--glass-s);
    filter: brightness(1.2);
  }

  .preview-button:active:not(:disabled) {
    transform: scale(var(--motion-click));
  }

  .preview-button:disabled {
    opacity: var(--opacity-s);
  }

  .dropdown-content {
    display: none;
    opacity: 0;
    transform: translateY(-var(--spacing-xs));
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%; /* Expansion fix: Match parent row width */
    max-height: 300px;
    overflow-y: auto;
    z-index: var(--z-index-max);
    background: var(--glass-xxl); /* Clarified transparency */
    backdrop-filter: var(--blur-m);
    border: 1px solid var(--border-xl);
    border-radius: var(--border-radius-m);
    box-shadow: var(--shadow-xxl);
    transition:
      opacity var(--motion-fast) ease,
      transform var(--motion-fast) var(--motion-elastic);
  }

  .dropdown-content.visible {
    display: flex;
    flex-direction: column;
    opacity: 1;
    transform: translateY(var(--spacing-xs));
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
    font-size: var(--font-size-xxs);
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
    color: var(--font-color-s);
    letter-spacing: 0.1em;
  }

  .voice-option .voice-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .voice-option.active {
    background: var(--glass-xs);
  }

  .sliders {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-m);
    width: 100%;
  }
</style>
