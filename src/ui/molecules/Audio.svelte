<script>
  /**
   * @file src/ui/molecules/Audio.svelte
   * THE SONIC IDENTITY
   * Manages character voice selection and parameters.
   * Part of the RPGlitch UI.
   */
  import { Button, Dropdown, Slider, tooltip, Label } from "@atoms";
  import { Audio } from "@media";

  /**
   * @typedef {Object} Props
   * @property {import('@organisms/Profile.svelte.js').ProfileState} profile_state - The profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  // --- INITIALIZATION ---

  $effect(() => {
    /** Ensure the voice state object is initialized correctly. */
    if (!profile_state.char) return;
    if (!profile_state.char.voice) {
      profile_state.char.voice = { uri: "am_adam", rate: 1.0 };
    } else {
      profile_state.char.voice.uri ??= "am_adam";
      profile_state.char.voice.rate ??= 1.0;
    }
  });

  // --- DERIVED ---

  const selected_voice = $derived(Audio.voice.voices.find((v) => v.uri === profile_state.char?.voice?.uri));

  // Derived list formatted for the Dropdown atom schema
  const dropdown_items = $derived(
    Audio.voice.voices.map((voice) => ({
      value: voice.uri,
      label: voice.name,
    })),
  );
</script>

<section
  class="
    flex
    w-full
    flex-col
    gap-gap-standard
    rounded-standard
    bg-glass-elevated
    p-padding-standard
    [backdrop-filter:var(--blur-mist)]
  "
  style:animation="wing-item-slide-down var(--motion-elastic) forwards"
>
  <!-- DROPDOWN + PREVIEW + SLIDER (3-col, single row) -->
  <div class="flex flex-col gap-2">
    <Label for="voice-select">Voice</Label>

    <div
      class="
        grid
      w-full
      grid-cols-[minmax(0,1fr)_auto]
      items-stretch
      gap-2
    "
    >
      <Dropdown
        id="voice-select"
        bind:value={profile_state.char.voice.uri}
        items={dropdown_items}
        disabled={!profile_state.is_editing}
        label="Select Voice"
        uppercase={false}
        matchWidth
      />

      <Button
        actions={[tooltip]}
        tooltip="Preview Voice"
        aria-label="Preview Voice"
        square
        disabled={!selected_voice}
        onclick={() => Audio.voice.preview(profile_state.char.voice.uri, profile_state.char.voice.rate)}
        variant="secondary"
      >
        <svg viewBox="0 0 24 24" class="size-icon-small">
          <path
            fill="currentColor"
            d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
          />
        </svg>
      </Button>

      <div class="col-span-2 w-full pt-2">
        <Slider
          min={0.1}
          max={1.9}
          step={0.1}
          bind:value={profile_state.char.voice.rate}
          disabled={!profile_state.is_editing || !selected_voice}
          label="Rate"
          neutral={1.0}
          style="--empty-fill: var(--signature-color, #555d66)"
        />
      </div>
    </div>
  </div>
</section>
