<script>
  /**
   * @file src/ui/profile/AudioWing.svelte
   * THE SONIC IDENTITY
   * Manages character voice selection and parameters.
   * Part of the RPGlitch UI.
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
      profileState.char.voice = { uri: "af_heart", rate: 1.0, pitch: 1.0 };
    } else {
      profileState.char.voice.uri ??= "af_heart";
      profileState.char.voice.rate ??= 1.0;
      profileState.char.voice.pitch ??= 1.0;
    }
  });

  // --- DERIVED ---

  const selected_voice = $derived(Audio.voice.voices.find((v) => v.uri === profileState.char?.voice?.uri));

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
  {#if !Audio.voice.modelReady}
    <!-- DOWNLOAD / LOADING (full width, covers entire row) -->
    {#if Audio.voice.isLoading}
      <div
        class="
          relative
          h-12
          w-full
          overflow-hidden
          rounded-xl
          border
          border-solid
          border-transparent
          bg-(--signature-color,#555d66)
        "
      >
        <div
          class="
            absolute
            inset-y-0
            left-0
            bg-white/15
            transition-[width]
            duration-300
            ease-out
          "
          style="width: {Audio.voice.loadProgress}%"
        ></div>
        <div
          class="
            absolute
            inset-0
            flex
            items-center
            gap-2
            px-4
            text-left
            font-sans
            text-sm
            text-white
          "
        >
          <span class="truncate">Loading voices…</span>
          <span class="tabular-nums opacity-70">{Audio.voice.loadProgress}%</span>
        </div>
      </div>
    {:else}
      <div
        role="button"
        tabindex="0"
        onclick={() => profileState.is_editing && Audio.voice.loadModel()}
        onkeydown={(e) => (e.key === "Enter" || e.key === " ") && profileState.is_editing && Audio.voice.loadModel()}
        class="
          inline-flex
          h-12
          w-full
          cursor-pointer
          items-center
          gap-2
          rounded-xl
          border
          border-solid
          border-transparent
          bg-(--signature-color,#555d66)
          px-4
          text-left
          font-sans
          text-sm
          text-white
          transition-[background-color,color,box-shadow,transform,filter,border-color]
          duration-500
          ease-out
          hover:brightness-125
          focus-visible:outline
          focus-visible:outline-offset-1
          focus-visible:outline-white
          active:scale-[0.99]
          data-[disabled=true]:pointer-events-none
          data-[disabled=true]:opacity-30
          data-[disabled=true]:grayscale
        "
        data-disabled={!profileState.is_editing}
        aria-disabled={!profileState.is_editing}
        aria-label="Download Voices"
      >
        <span class="flex-1 truncate">Download Voices</span>
      </div>
    {/if}
  {:else}
    <!-- DROPDOWN + PREVIEW + SLIDER (3-col, single row) -->
    <div
      class="
        grid
        w-full
        grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]
        items-stretch
        gap-2
      "
    >
      <Dropdown
        bind:value={profileState.char.voice.uri}
        items={dropdown_items}
        disabled={!profileState.is_editing}
        label="Select Voice"
        uppercase={false}
        matchWidth
        dropdownHeight="max-h-64"
        trigger_class="
          group/trigger
          inline-flex
          h-12
          w-full
          cursor-pointer
          items-center
          justify-between
          gap-2
          rounded-xl
          border
          border-solid
          border-transparent
          bg-(--signature-color,#555d66)
          px-4
          text-left
          font-sans
          text-sm
          text-white
          transition-[background-color,color,box-shadow,transform,filter,border-color]
          duration-500
          ease-out
          hover:brightness-125
          focus-visible:outline
          focus-visible:outline-offset-1
          focus-visible:outline-white
          active:scale-[0.99]
          disabled:pointer-events-none
          disabled:cursor-not-allowed
          disabled:opacity-30
          disabled:grayscale
          data-[state=open]:brightness-110
        "
      />

      <Button
        actions={[tooltip]}
        tooltip="Preview Voice"
        aria-label="Preview Voice"
        square
        disabled={!selected_voice}
        onclick={() => Audio.voice.preview(profileState.char.voice.uri, profileState.char.voice.rate, profileState.char.voice.pitch)}
        variant="secondary"
      >
        <svg viewBox="0 0 24 24" class="size-icon-small">
          <path
            fill="currentColor"
            d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
          />
        </svg>
      </Button>

      <Slider
        min={0.1}
        max={1.9}
        step={0.1}
        bind:value={profileState.char.voice.rate}
        disabled={!profileState.is_editing || !selected_voice}
        label="Rate"
        neutral={1.0}
        style="--empty-fill: var(--signature-color, #555d66)"
      />
    </div>
  {/if}
</section>
