<script>
  /**
   * @file src/ui/DevWing.svelte
   * DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   * Part of the RPGlitch UI.
   */
  import { DYNAMICS } from "@config";
  import { query_entity_history } from "@data";
  import { Accordion } from "@primitives";
  import Meter from "./Meter.svelte";
  import { format_datetime } from "@utils";

  /**
   * @typedef {Object} Props
   * @property {import('./Profile.svelte.js').ProfileState} profile_state - The profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  let show_ledger_feed = $state(false);
  /** @type {Array<any>} */
  let ledger_records = $state([]);
  let is_ledger_loading = $state(false);

  $effect(() => {
    if (show_ledger_feed && profile_state.char?.id) {
      is_ledger_loading = true;
      query_entity_history(profile_state.char.id)
        .then((records) => {
          ledger_records = records.slice().reverse().slice(0, 30);
        })
        .catch(() => {
          ledger_records = [];
        })
        .finally(() => {
          is_ledger_loading = false;
        });
    }
  });

  /**
   * Dynamically computes which dynamics are available on the current character.
   */
  let active_dynamics = $derived.by(() => {
    const list = [];
    const entity = profile_state.char;
    if (entity?.dynamics) {
      for (const key of Object.keys(entity.dynamics)) {
        const axis = DYNAMICS[key.toUpperCase()];
        list.push({
          source: "dynamics",
          key: key,
          label: axis?.label || key.charAt(0).toUpperCase() + key.slice(1),
          desc: axis?.low && axis?.high ? `${axis.low} → ${axis.high}` : "",
        });
      }
    }
    return list;
  });
</script>

<section
  class="
    flex
    w-full
    flex-col
    gap-standard
    rounded-standard
    bg-glass-elevated
    p-standard
    [backdrop-filter:var(--blur-mist)]
  "
  style:animation="wing-item-slide-down var(--motion-elastic) forwards"
  style:--signature-color="var(--color-electric-cyan)">
  <!-- DYNAMICS GRID -->
  <div
    class="
      grid
      grid-cols-2
      gap-standard
    ">
    {#each active_dynamics as dynamic (dynamic.source + "-" + dynamic.key)}
      <Meter {profile_state} {dynamic} />
    {/each}
  </div>

  <!-- RAW EXPLORER & HISTORY INSPECTOR -->
  <Accordion label="View JSON Data">
    <div class="terminal-box max-h-60 overflow-y-auto bg-black/10 p-standard text-sm">
      <pre class="m-0 font-[inherit] text-xs whitespace-pre-wrap">{JSON.stringify(profile_state.char, null, 2)}</pre>
    </div>
  </Accordion>

  <Accordion label="Mutation Ledger" bind:open={show_ledger_feed}>
    {#if is_ledger_loading}
      <span class="font-mono text-[10px] text-slate-400">Loading ledger...</span>
    {:else if ledger_records.length === 0}
      <span class="font-mono text-[10px] text-slate-500">No ledger events recorded.</span>
    {:else}
      <div class="flex max-h-56 flex-col divide-y divide-white/5 overflow-y-auto font-mono text-[10px]">
        {#each ledger_records as rec (rec.id || `${rec.round}-${rec.seq}-${rec.timestamp}`)}
          <div class="flex flex-col gap-0.5 py-1.5 text-left first:pt-0 last:pb-0">
            <div class="flex items-center justify-between text-slate-400">
              <span class="font-bold text-cyan-400">R{rec.round}:S{rec.seq} · {rec.field}</span>
              <span class="text-[9px] text-slate-500">{format_datetime(rec.timestamp)}</span>
            </div>
            <div class="text-slate-200">
              {#if rec.key}<span class="text-cyan-300">[{rec.key}]</span>
              {/if}
              {rec.new_value ?? "cleared (null)"}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Accordion>

  <!-- META FOOTER -->
  <footer
    class="
      flex
      flex-col
      gap-tight
    ">
    <div
      class="
        flex
        justify-between
        gap-standard
        font-mono
        text-[10px]
        tracking-widest
        uppercase
      ">
      <span
        class="
          text-cyan-400
          opacity-60
        ">Born:</span>
      <span class="text-slate-50">{format_datetime(profile_state.char.created_at)}</span>
    </div>
    <div
      class="
        flex
        justify-between
        gap-standard
        font-mono
        text-[10px]
        tracking-widest
        uppercase
      ">
      <span
        class="
          text-cyan-400
          opacity-60
        ">Sync:</span>
      <span class="text-slate-50">{format_datetime(profile_state.char.updated_at)}</span>
    </div>
  </footer>
</section>

<!--
CHANGELOG:
- 2026-10-18: Phase V Sub-item 5.5 - Added Token Budget HUD badge and collapsible slot/entity breakdown popover in DevWing.
- 2026-10-03: Added Mutation Ledger history inspector trigger and embedded `FieldHistoryModal` in DevWing.
-->
