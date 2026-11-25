<script>
  /**
   * @file src/ui/organisms/DevWing.svelte
   * Developer telemetry inspector wing for entity dynamics and raw JSON inspection.
   */
  import { Accordion } from "@atoms";
  import { DYNAMICS } from "@config";
  import { Meter } from "@molecules";
  import { format_datetime } from "@utils";

  let { profile_state } = $props();

  const active_dynamics = $derived.by(() => {
    const dynamics = profile_state.char?.dynamics;
    if (!dynamics) return [];
    return Object.keys(dynamics).map((key) => {
      const axis = DYNAMICS.AXES[key];
      return { key, label: axis?.label || key.charAt(0).toUpperCase() + key.slice(1), desc: axis?.low && axis?.high ? `${axis.low} → ${axis.high}` : "" };
    });
  });
</script>

<div
  role="region"
  aria-label="Developer telemetry"
  class="flex w-full flex-col gap-standard rounded-standard bg-glass-elevated p-standard [backdrop-filter:var(--blur-mist)]"
  style:animation="wing-item-slide-down var(--motion-elastic) forwards"
  style:--signature-color="var(--color-electric-cyan)">
  {#if active_dynamics.length > 0}
    <div class="grid grid-cols-2 gap-standard">
      {#each active_dynamics as dynamic (dynamic.key)}
        <Meter
          label={dynamic.label}
          description={dynamic.desc}
          value={Number(profile_state.char?.dynamics?.[dynamic.key]) || 0}
          editable={profile_state.is_editing}
          onchange={(next) => profile_state.set_field_value(`dynamics.${dynamic.key}`, next)} />
      {/each}
    </div>
  {/if}

  <Accordion label="View JSON Data">
    <div class="terminal-box max-h-60 overflow-y-auto bg-black/10 p-standard text-sm">
      <pre class="m-0 font-[inherit] text-xs whitespace-pre-wrap">{JSON.stringify(profile_state.char, null, 2)}</pre>
    </div>
  </Accordion>

  <div class="flex flex-col gap-tight">
    <div class="flex justify-between gap-standard">
      <span class="type-uppercase-label text-cyan-400 opacity-60">Born:</span>
      <span class="type-data text-frisk">{format_datetime(profile_state.char?.created_at)}</span>
    </div>
    <div class="flex justify-between gap-standard">
      <span class="type-uppercase-label text-cyan-400 opacity-60">Sync:</span>
      <span class="type-data text-frisk">{format_datetime(profile_state.char?.updated_at)}</span>
    </div>
  </div>
</div>
