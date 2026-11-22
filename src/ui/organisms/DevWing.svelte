<script>
  /**
   * @file src/ui/organisms/DevWing.svelte
   * Developer telemetry inspector wing for entity dynamics and raw JSON inspection.
   */
  import { DYNAMICS } from "@config";
  import { Accordion } from "@atoms";
  import { Meter } from "@molecules";
  import { format_datetime } from "@utils";

  /**
   * @typedef {Object} Props
   * @property {ProfileController} profile_state - Profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  let active_dynamics = $derived.by(() => {
    const list = [];
    const entity = profile_state.char;
    if (entity?.dynamics) {
      for (const key of Object.keys(entity.dynamics)) {
        const axis = DYNAMICS[key.toUpperCase()];
        list.push({
          source: "dynamics",
          key,
          label: axis?.label || key.charAt(0).toUpperCase() + key.slice(1),
          desc: axis?.low && axis?.high ? `${axis.low} → ${axis.high}` : "",
        });
      }
    }
    return list;
  });
</script>

<section
  class="flex w-full flex-col gap-standard rounded-standard bg-glass-elevated p-standard [backdrop-filter:var(--blur-mist)]"
  style:animation="wing-item-slide-down var(--motion-elastic) forwards"
  style:--signature-color="var(--color-electric-cyan)">
  <div class="grid grid-cols-2 gap-standard">
    {#each active_dynamics as dynamic (dynamic.source + "-" + dynamic.key)}
      <Meter
        label={dynamic.label}
        description={dynamic.desc}
        value={Number(profile_state.char?.[dynamic.source]?.[dynamic.key]) || 0}
        editable={profile_state.is_editing}
        onchange={(next) => profile_state.set_field_value(`${dynamic.source}.${dynamic.key}`, next)} />
    {/each}
  </div>

  <Accordion label="View JSON Data">
    <div class="terminal-box max-h-60 overflow-y-auto bg-black/10 p-standard text-sm">
      <pre class="m-0 font-[inherit] text-xs whitespace-pre-wrap">{JSON.stringify(profile_state.char, null, 2)}</pre>
    </div>
  </Accordion>

  <footer class="flex flex-col gap-tight">
    <div class="flex justify-between gap-standard font-mono text-[10px] tracking-widest uppercase">
      <span class="text-cyan-400 opacity-60">Born:</span>
      <span class="text-slate-50">{format_datetime(profile_state.char.created_at)}</span>
    </div>
    <div class="flex justify-between gap-standard font-mono text-[10px] tracking-widest uppercase">
      <span class="text-cyan-400 opacity-60">Sync:</span>
      <span class="text-slate-50">{format_datetime(profile_state.char.updated_at)}</span>
    </div>
  </footer>
</section>
