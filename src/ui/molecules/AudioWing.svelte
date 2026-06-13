<script>
  /**
   * @file src/ui/profile/AudioWing.svelte
   * ðŸ”Š THE SONIC IDENTITY
   * Manages character voice selection and parameters.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import { Button, Dropdown, Slider, tooltip } from "@atoms";
  import { Audio } from "@media";

  /**
   * @typedef {Object} Props
   * @property {import('@organisms/profile.svelte.js').ProfileState} profileState - The profile state controller
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

  // --- DERIVED ---

  const selected_voice = $derived(Audio.voice.voices.find((v) => v.uri === profileState.char?.voice?.uri));
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

  // Derived list formatted for the Dropdown atom schema
  const dropdown_items = $derived(
    Audio.voice.voices.map((voice) => ({
      value: voice.uri,
      label: format_name(voice.name, voice.region),
      region: voice.region,
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
>
  <!-- VOICE SELECTOR -->
  <div
    class="
    grid
    w-full
    grid-cols-[minmax(0,1fr)_auto]
    items-stretch
    gap-2
  "
  >
    <Dropdown bind:value={profileState.char.voice.uri} items={dropdown_items} disabled={!profileState.is_editing} label="Select Voice" />

    <Button actions={[tooltip]} tooltip="Preview Voice" aria-label="Preview Voice" square disabled={!selected_voice} onclick={() => Audio.voice.preview(profileState.char.voice.uri, profileState.char.voice.rate, profileState.char.voice.pitch)} variant="secondary">
      <svg viewBox="0 0 24 24" class="size-icon-small">
        <path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
      </svg>
    </Button>
  </div>

  <!-- PARAMETERS -->
  <div
    class="
    flex
    w-full
    flex-row
    gap-4
  "
  >
    <Slider min={0.1} max={2.0} step={0.1} bind:value={profileState.char.voice.rate} disabled={!profileState.is_editing || !selected_voice} label="Rate" neutral={1.0} />
    <Slider min={0.1} max={2.0} step={0.1} bind:value={profileState.char.voice.pitch} disabled={!profileState.is_editing || !selected_voice || is_natural} label="Pitch" neutral={1.0} />
  </div>
</section>
