<script>
  import { Button, Slider, Toggle, tooltip } from "@primitives";
  import { Audio } from "@media";

  let previous_volume = $state(1.0);
  let explicitly_muted = $state(false);
  let is_muted = $derived(Audio.volume === 0 || explicitly_muted);

  function toggle_mute() {
    if (explicitly_muted || Audio.volume === 0) {
      explicitly_muted = false;
      Audio.volume = previous_volume || 1.0;
    } else {
      previous_volume = Audio.volume;
      explicitly_muted = true;
      Audio.volume = 0;
      Audio.voice.stop();
    }
  }
</script>

<div class="grid w-full grid-cols-2 gap-4">
  <div class="flex min-w-0 items-center">
    <Toggle label="NOTIFICATIONS" bind:value={Audio.notifications_enabled} />
  </div>
  <div class="flex min-w-0 flex-wrap items-center gap-3">
    <Button
      variant="bare"
      onclick={toggle_mute}
      aria-label={is_muted ? "Unmute" : "Mute"}
      actions={[[tooltip, is_muted ? "Unmute" : "Mute"]]}
      class="
        pointer-events-auto
        flex h-6 w-10
        shrink-0 items-center justify-center
        rounded-md
        bg-transparent
        text-slate-400 transition-colors
        hover:bg-slate-700/50 hover:text-white
        focus-visible:outline
        focus-visible:outline-offset-1 focus-visible:outline-slate-600 active:scale-95
      "
    >
      {#if is_muted}
        <svg viewBox="0 0 24 24" class="size-5">
          <path
            fill="currentColor"
            d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z"
          />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" class="size-5">
          <path
            fill="currentColor"
            d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
          />
        </svg>
      {/if}
    </Button>
    <Slider
      horizontal
      label=""
      class="min-w-0 flex-1"
      bind:value={Audio.volume}
      min={0}
      max={1}
      step={0.1}
      neutral={0}
      format={(v) => Math.round(v * 100) + "%"}
      disabled={explicitly_muted}
      disabled_label="MUTED"
      show_value_tooltip={true}
    />
  </div>
</div>
