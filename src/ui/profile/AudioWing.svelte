<script>
  /**
   * @file src/ui/profile/AudioWing.svelte
   * THE SONIC IDENTITY
   * Manages character voice selection and parameters.
   * Part of the RPGlitch UI.
   */
  import { Button, Dropdown, Slider, tooltip, Label } from "@primitives";
  import { Audio, VOICE_CADENCES, get_cadence_rate, resolve_voice_name, resolve_voice_uri } from "@media";

  /**
   * @typedef {Object} Props
   * @property {import('@profile/Profile.svelte.js').ProfileState} profile_state - The profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  // --- INITIALIZATION ---

  $effect(() => {
    /** Ensure the voice state object is initialized correctly. */
    if (!profile_state.char) return;
    if (!profile_state.char.voice) {
      profile_state.char.voice = { name: "Cinematic Narrator", uri: "am_adam", cadence: "standard" };
    } else {
      const v_key = profile_state.char.voice.name || profile_state.char.voice.uri || "Cinematic Narrator";
      profile_state.char.voice.name = resolve_voice_name(v_key);
      profile_state.char.voice.uri = resolve_voice_uri(v_key);
      profile_state.char.voice.cadence ??= "standard";
    }
  });

  // --- DERIVED ---

  const active_voice_name = $derived(resolve_voice_name(profile_state.char?.voice?.name || profile_state.char?.voice?.uri || "Cinematic Narrator"));

  const selected_voice = $derived(Audio.voice.voices.find((v) => v.name === active_voice_name || v.uri === profile_state.char?.voice?.uri));

  // Derived list formatted for the Dropdown atom schema
  const dropdown_items = $derived(
    Audio.voice.voices.map((voice) => ({
      value: voice.name,
      label: voice.name,
    })),
  );

  /** Finds index 0..4 in VOICE_CADENCES for the active cadence string key */
  const cadence_index = $derived.by(() => {
    const key = profile_state.char?.voice?.cadence || "standard";
    const idx = VOICE_CADENCES.findIndex((c) => c.id === key);
    return idx >= 0 ? idx : 2;
  });

  /** The active cadence item for label formatting */
  const active_cadence = $derived(VOICE_CADENCES[cadence_index]);

  function handle_voice_change(new_name) {
    if (profile_state.char?.voice && typeof new_name === "string") {
      profile_state.char.voice.name = resolve_voice_name(new_name);
      profile_state.char.voice.uri = resolve_voice_uri(new_name);
    }
  }

  /**
   * @param {Event & { currentTarget: HTMLInputElement }} e
   */
  function handle_cadence_change(e) {
    const idx = Number(e.currentTarget.value);
    if (!isNaN(idx) && VOICE_CADENCES[idx]) {
      profile_state.char.voice.cadence = VOICE_CADENCES[idx].id;
    }
  }
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
        bind:value={profile_state.char.voice.name}
        onchange={handle_voice_change}
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
        onclick={() => Audio.voice.preview(active_voice_name, get_cadence_rate(profile_state.char.voice.cadence))}
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
          min={0}
          max={4}
          step={1}
          value={cadence_index}
          onchange={handle_cadence_change}
          disabled={!profile_state.is_editing || !selected_voice}
          label="Cadence"
          neutral={2}
          format={() => active_cadence.label}
          style="--empty-fill: var(--signature-color, #555d66)"
        />
      </div>
    </div>
  </div>
</section>
