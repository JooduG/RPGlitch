<script>
  /**
   * @file src/ui/organisms/AudioWing.svelte
   * Entity voice selection and cadence controls wing for Profile.
   */
  import { Audio, VOICE_CADENCES, get_cadence_rate, resolve_voice_name, resolve_voice_uri } from "@media";
  import { Button, Icon, Label, Slider, tooltip } from "@atoms";
  import { Dropdown } from "@molecules";

  /**
   * @typedef {Object} Props
   * @property {ProfileController} profile_state - Profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  $effect(() => {
    if (!profile_state.char) return;
    if (!profile_state.char.voice) {
      profile_state.char.voice = { name: "Standard Voice", uri: "default", cadence: "standard" };
    } else {
      const v_key = profile_state.char.voice.name || profile_state.char.voice.uri || "Standard Voice";
      profile_state.char.voice.name = resolve_voice_name(v_key);
      profile_state.char.voice.uri = resolve_voice_uri(v_key);
      profile_state.char.voice.cadence ??= "standard";
    }
  });

  const active_voice_name = $derived(resolve_voice_name(profile_state.char?.voice?.name || profile_state.char?.voice?.uri || "Standard Voice"));
  const dropdown_items = $derived((Audio.voice.voices ?? []).map((voice) => ({ value: voice.name, label: voice.name })));

  const cadence_index = $derived.by(() => {
    const key = profile_state.char?.voice?.cadence || "standard";
    const idx = VOICE_CADENCES.findIndex((c) => c.id === key);
    return idx >= 0 ? idx : 2;
  });

  const active_cadence = $derived(VOICE_CADENCES[cadence_index]);

  function handle_voice_change(new_name) {
    if (profile_state.char?.voice && typeof new_name === "string") {
      profile_state.char.voice.name = resolve_voice_name(new_name);
      profile_state.char.voice.uri = resolve_voice_uri(new_name);
      profile_state.mark_mutated();
    }
  }

  /** @param {number} val */
  function handle_cadence_change(val) {
    const idx = Number(val);
    if (!isNaN(idx) && VOICE_CADENCES[idx]) {
      profile_state.char.voice.cadence = VOICE_CADENCES[idx].id;
      profile_state.mark_mutated();
    }
  }
</script>

<section
  class="flex w-full flex-col gap-standard rounded-standard bg-glass-elevated p-standard [backdrop-filter:var(--blur-mist)]"
  style:animation="wing-item-slide-down var(--motion-elastic) forwards"
  style:--signature-color="var(--color-frozen)">
  <div class="flex flex-col gap-tight">
    <Label for="voice-select">Voice</Label>

    <div class="grid w-full grid-cols-[minmax(0,1fr)_auto] items-stretch gap-tight">
      <Dropdown
        id="voice-select"
        bind:value={profile_state.char.voice.name}
        onchange={handle_voice_change}
        items={dropdown_items}
        disabled={!profile_state.is_editing || dropdown_items.length === 0}
        label={dropdown_items.length === 0 ? "Loading Voices..." : "Select Voice"}
        uppercase={false}
        matchWidth />

      <Button
        actions={[tooltip]}
        tooltip="Preview Voice"
        aria-label="Preview Voice"
        square
        onclick={() => Audio.voice.preview(active_voice_name, get_cadence_rate(profile_state.char.voice.cadence))}
        variant="secondary">
        <Icon name="volume" class="size-icon-small" />
      </Button>

      <div class="col-span-2 w-full pt-tight">
        <Slider
          min={0}
          max={4}
          step={1}
          value={cadence_index}
          onchange={handle_cadence_change}
          disabled={!profile_state.is_editing}
          label="Cadence"
          neutral={2}
          format={() => active_cadence.label}
          style="--empty-fill: var(--signature-color, #555d66)" />
      </div>
    </div>
  </div>
</section>
