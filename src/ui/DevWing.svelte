<script>
  /**
   * @file src/ui/DevWing.svelte
   * DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   * Part of the RPGlitch UI.
   */
  import { DYNAMICS } from "@config";
  import { query_entity_history } from "@data";
  import { runtime } from "@state";
  import { Accordion, Button, tooltip } from "@primitives";
  import Meter from "./Meter.svelte";
  import { format_datetime } from "@utils";

  /**
   * @typedef {Object} Props
   * @property {import('./Profile.svelte.js').ProfileState} profile_state - The profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  let show_token_details = $state(false);
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
        list.push({
          source: "dynamics",
          key: key,
          label: DYNAMICS[key.toUpperCase()]?.label || key.charAt(0).toUpperCase() + key.slice(1),
          desc: DYNAMICS[key.toUpperCase()]?.desc || "Metric",
        });
      }
    }
    return list;
  });

  const snapshot = $derived(runtime.last_prompt_token_snapshot);
  const total_tokens = $derived(snapshot?.total ?? 0);
  const cliff_limit = $derived(snapshot?.cliff_limit ?? 6000);
  const cliff_percent = $derived(Math.min(100, Math.round((total_tokens / cliff_limit) * 100)));
  const status_color = $derived(
    cliff_percent >= 90 ? "text-rose-400 bg-rose-950/40 border-rose-500/30"
    : cliff_percent >= 75 ? "text-amber-400 bg-amber-950/40 border-amber-500/30"
    : "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
  );
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
  style:animation="wing-item-slide-down var(--motion-elastic) forwards">
  <!-- PROMPT TOKEN CLIFF HUD BADGE -->
  <div class="flex flex-col gap-tight rounded-standard bg-glass-sunken p-standard">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-tight">
        <span class="font-mono text-[10px] font-bold tracking-widest text-slate-400 uppercase">Token Budget</span>
        <span
          class="rounded-full border px-tight py-0.5 font-mono text-[10px] font-semibold {status_color}"
          use:tooltip
          aria-label={`Current compile token load against ${cliff_limit.toLocaleString()} cliff threshold`}>
          ⚡ {total_tokens.toLocaleString()} / {cliff_limit.toLocaleString()} tok ({cliff_percent}%){snapshot?.mode ? ` [${snapshot.mode.toUpperCase()}]` : ""}
        </span>
      </div>
      <Button
        variant="invisible"
        size="small"
        onclick={() => (show_token_details = !show_token_details)}
        class="cursor-pointer font-mono text-[10px] text-cyan-400 hover:text-cyan-200">
        {show_token_details ? "Hide Breakdown ▲" : "Breakdown ▼"}
      </Button>
    </div>

    <!-- Progress bar -->
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        class="h-full transition-[width] duration-300 {cliff_percent >= 90 ? 'bg-rose-500'
        : cliff_percent >= 75 ? 'bg-amber-400'
        : 'bg-emerald-400'}"
        style="width: {cliff_percent}%;">
      </div>
    </div>

    {#if show_token_details && snapshot}
      <div class="mt-tight flex flex-col gap-tight border-t border-white/5 pt-tight text-[10px]">
        <div class="grid grid-cols-2 gap-x-tight gap-y-1 font-mono text-slate-300">
          <span class="text-slate-400">Mode:</span>
          <span class="text-right font-bold text-white uppercase">{snapshot.mode || "prose"}</span>
          <span class="text-slate-400">System Slot:</span>
          <span class="text-right text-cyan-300">{snapshot.layers?.system?.toLocaleString() ?? 0} tok</span>
          <span class="text-slate-400">Entities Slot:</span>
          <span class="text-right text-purple-300">{snapshot.layers?.entities?.toLocaleString() ?? 0} tok</span>
          <span class="text-slate-400">History Slot:</span>
          <span class="text-right text-sky-300">{snapshot.layers?.history?.toLocaleString() ?? 0} tok</span>
          <span class="text-slate-400">Task Slot:</span>
          <span class="text-right text-amber-300">{snapshot.layers?.task?.toLocaleString() ?? 0} tok</span>
        </div>
        {#if snapshot.entities_breakdown}
          <div class="mt-tight flex flex-col gap-0.5 border-t border-white/5 pb-tight font-mono text-[9px] text-slate-400">
            <span class="font-bold tracking-wider text-slate-300 uppercase">Entities Sub-Allocation:</span>
            <div class="flex justify-between">
              <span>Actors:</span>
              <span class="text-slate-200">{snapshot.entities_breakdown.actors?.toLocaleString() ?? 0} tok</span>
            </div>
            <div class="flex justify-between">
              <span>Cast / NPCs:</span>
              <span class="text-slate-200">{snapshot.entities_breakdown.cast?.toLocaleString() ?? 0} tok</span>
            </div>
            <div class="flex justify-between">
              <span>Past:</span>
              <span class="text-slate-200">{snapshot.entities_breakdown.past?.toLocaleString() ?? 0} tok</span>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

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
